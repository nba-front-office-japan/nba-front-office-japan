// 過去シーズンの試合結果を balldontlie /v1/games から historical_games に取り込む(過去の順位表用)。
//
// 実行方法: node scripts/import-historical-games.mjs 2003 2025
//   (開始年 終了年。シーズンは開始年。例: 2003 = 2003-04。1シーズンだけなら 2003 2003)
//
// 【利用方針】balldontlie は無料プランの範囲だけ(2026-10-03 承認。過去シーズンへの利用は 2026-11-18 承認)。
// 使うのは /v1/games の日付・得点・ピリオド・プレーオフの印だけ。他のエンドポイントは使わない。
// ・無料プランの制限(1分あたり5回)を守るため、リクエストの間を13秒空ける。429 が返ったら65秒待って同じページを取り直す。
// ・同じ試合は (source, source_game_id) で上書きするので、途中で止まっても同じコマンドで続きから取り込み直せる。
// ・終了(Final)していない試合は入れない。チームは balldontlie の今の略称で teams と照合する
//   (balldontlie は昔のチームも今のフランチャイズの略称で返す。例: 2007-08 のシアトルは OKC)。
// ・必要な環境変数(.env.local): NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, BALLDONTLIE_API_KEY

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/)
    .filter((line) => /^[A-Z_]+=/.test(line))
    .map((line) => [line.slice(0, line.indexOf("=")), line.slice(line.indexOf("=") + 1)])
);
for (const key of ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "BALLDONTLIE_API_KEY"]) {
  if (!env[key]) throw new Error(`.env.local に ${key} がありません`);
}

const [fromSeason, toSeason] = process.argv.slice(2).map(Number);
if (!Number.isInteger(fromSeason) || !Number.isInteger(toSeason) || fromSeason > toSeason || fromSeason < 1946 || toSeason > 2025) {
  console.error("使い方: node scripts/import-historical-games.mjs <開始年> <終了年>  (例: 2003 2025。今季 2026 は games で管理するため対象外)");
  process.exit(1);
}

const REQUEST_INTERVAL_MS = 13_000;
const RATE_LIMIT_WAIT_MS = 65_000;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: teams, error: teamsError } = await supabase.from("teams").select("id, abbreviation");
if (teamsError) throw new Error(`teams の取得に失敗しました: ${teamsError.message}`);
const teamIdByAbbr = new Map(teams.map((t) => [t.abbreviation, t.id]));

let lastRequestAt = 0;
let networkRetries = 0;
async function fetchPage(season, cursor) {
  for (;;) {
    const wait = lastRequestAt + REQUEST_INTERVAL_MS - Date.now();
    if (wait > 0) await sleep(wait);
    const params = new URLSearchParams({ "seasons[]": String(season), per_page: "100" });
    if (cursor) params.set("cursor", String(cursor));
    lastRequestAt = Date.now();
    let res;
    try {
      res = await fetch(`https://api.balldontlie.io/v1/games?${params}`, { headers: { Authorization: env.BALLDONTLIE_API_KEY }, signal: AbortSignal.timeout(60_000) });
    } catch (cause) {
      // 通信エラー・応答なし: 少し待って同じページを取り直す(5回まで)
      networkRetries++;
      if (networkRetries > 5) throw cause;
      console.log(`  通信エラー(${cause?.cause?.code ?? cause?.name ?? "unknown"})。30秒待って取り直します(${networkRetries}回目)`);
      await sleep(30_000);
      continue;
    }
    if (res.status === 429) {
      console.log(`  回数制限(429)。${RATE_LIMIT_WAIT_MS / 1000}秒待って取り直します`);
      await sleep(RATE_LIMIT_WAIT_MS);
      continue;
    }
    if (!res.ok) throw new Error(`balldontlie が ${res.status} を返しました(${season}年 cursor=${cursor ?? "-"})`);
    return res.json();
  }
}

let requests = 0;
for (let season = fromSeason; season <= toSeason; season++) {
  const games = [];
  let cursor;
  do {
    const body = await fetchPage(season, cursor);
    requests++;
    games.push(...body.data);
    cursor = body.meta?.next_cursor ?? null;
  } while (cursor);

  const rows = [];
  const skipped = [];
  for (const g of games) {
    const homeId = teamIdByAbbr.get(g.home_team.abbreviation);
    const awayId = teamIdByAbbr.get(g.visitor_team.abbreviation);
    if (g.status !== "Final") {
      skipped.push(`${g.id}: 終了していない(${g.status})`);
      continue;
    }
    if (!homeId || !awayId) {
      skipped.push(`${g.id}: チーム略称が teams にない(${g.visitor_team.abbreviation} @ ${g.home_team.abbreviation})`);
      continue;
    }
    rows.push({
      source: "balldontlie",
      source_game_id: g.id,
      season: g.season,
      postseason: g.postseason,
      game_date: g.date.slice(0, 10),
      home_team_id: homeId,
      away_team_id: awayId,
      home_score: g.home_team_score,
      away_score: g.visitor_team_score,
      period: g.period && g.period > 0 ? g.period : null,
    });
  }

  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await supabase.from("historical_games").upsert(rows.slice(i, i + 500), { onConflict: "source,source_game_id" });
    if (error) throw new Error(`${season}年の書き込みに失敗しました: ${error.message}`);
  }

  const regular = rows.filter((r) => !r.postseason).length;
  console.log(`${season}-${String((season + 1) % 100).padStart(2, "0")}: 取得 ${games.length}試合 / 登録 ${rows.length}(レギュラー ${regular}・プレーオフ ${rows.length - regular}) / 除外 ${skipped.length}`);
  for (const s of skipped.slice(0, 10)) console.log(`  除外 ${s}`);
}
console.log(`完了(リクエスト ${requests}回)`);
