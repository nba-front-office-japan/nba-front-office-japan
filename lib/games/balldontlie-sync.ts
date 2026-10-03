// 試合日程・クオータースコアを、無料の balldontlie API(/v1/games)から games テーブルに取り込む(サーバー専用)。
//
// 【利用方針(2026-10-03 承認)】
// ・balldontlie は無料プラン(Free)の範囲だけで使う。有料プラン・お試し・支払い方法の登録はしない。
// ・取得するのは /v1/games の、試合日程・開始時刻・試合状況・クオータースコア・合計得点だけ。
// ・選手別のボックススコアはAPIで取得しない(/v1/stats などは使わない)。管理画面のCSV取込で登録する。
// ・これ以外のエンドポイントやデータを使う場合は、事前に利用者(サイト運営者)の承認が必要。
//
// ・無料プランの制限は 5リクエスト/分。/v1/games は複数の日付を1回のリクエストで指定できるため、
//   通常の取り込み(数日分)は1〜2リクエストで済む。1回の取り込みのリクエスト数は MAX_REQUESTS_PER_SYNC までに抑える。
// ・同じ試合は (source, source_game_id) で上書き(upsert)する。

import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, GameStatus } from "@/lib/supabase/types";
import { addDays, todayJst } from "./date";

type Client = SupabaseClient<Database>;
type GameInsert = Database["public"]["Tables"]["games"]["Insert"];

const BASE_URL = "https://api.balldontlie.io/v1/games";
/** 1回の取り込みで指定できる日付の数の上限(誤操作で大量に取得しないため) */
export const MAX_SYNC_DAYS = 14;
/** 1回の取り込みでAPIを呼ぶ回数の上限(無料プランの 5リクエスト/分 を超えないため) */
const MAX_REQUESTS_PER_SYNC = 3;

type BdlTeam = { abbreviation: string };
type BdlGame = {
  id: number;
  date: string;
  season: number;
  status: string;
  status_state?: string | null;
  period: number | null;
  postseason: boolean;
  postponed?: boolean | null;
  datetime: string | null;
  home_team_score: number | null;
  visitor_team_score: number | null;
  home_q1: number | null;
  home_q2: number | null;
  home_q3: number | null;
  home_q4: number | null;
  home_ot1: number | null;
  home_ot2: number | null;
  home_ot3: number | null;
  visitor_q1: number | null;
  visitor_q2: number | null;
  visitor_q3: number | null;
  visitor_q4: number | null;
  visitor_ot1: number | null;
  visitor_ot2: number | null;
  visitor_ot3: number | null;
  home_team: BdlTeam;
  visitor_team: BdlTeam;
};
type BdlResponse = { data: BdlGame[]; meta?: { next_cursor?: number | null } };

function mapStatus(g: BdlGame): GameStatus {
  if (g.postponed) return "postponed";
  if (g.status_state === "final" || /^final/i.test(g.status)) return "final";
  if ((g.period ?? 0) > 0) return "in_progress";
  return "scheduled";
}

function otScores(...values: (number | null)[]): number[] {
  return values.filter((v): v is number => v !== null);
}

/** 日本時間の前日〜翌日の試合を含む、米国の日付の一覧(日本の日付は米国の日付の翌日になることが多いため前後を含める) */
export function defaultSyncDates(now: Date = new Date()): string[] {
  const today = todayJst(now);
  return [-2, -1, 0, 1].map((d) => addDays(today, d));
}

export type SyncResult = {
  dates: string[];
  fetched: number;
  upserted: number;
  skipped: { gameId: number; reason: string }[];
  /** dryRun のときだけ:登録する予定だった行(書き込みはしない) */
  preview?: GameInsert[];
};

/** 指定した米国の日付の試合を取り込む。dryRun のときは取得と変換だけを行い、DBには書き込まない */
export async function syncGamesFromBalldontlie(
  supabase: Client,
  dates: string[],
  options: { dryRun?: boolean } = {}
): Promise<SyncResult> {
  const apiKey = process.env.BALLDONTLIE_API_KEY;
  if (!apiKey) throw new Error("BALLDONTLIE_API_KEY が設定されていません");
  if (dates.length === 0 || dates.length > MAX_SYNC_DAYS) throw new Error(`日付は1〜${MAX_SYNC_DAYS}日分で指定してください`);

  const games: BdlGame[] = [];
  let cursor: number | null | undefined = undefined;
  let requests = 0;
  do {
    if (requests >= MAX_REQUESTS_PER_SYNC) {
      throw new Error(`1回の取り込みで取得できる量を超えました（${MAX_REQUESTS_PER_SYNC}回まで）。期間を短くして取り込んでください。`);
    }
    requests++;
    const params = new URLSearchParams({ per_page: "100" });
    for (const d of dates) params.append("dates[]", d);
    if (cursor) params.set("cursor", String(cursor));
    const res = await fetch(`${BASE_URL}?${params.toString()}`, { headers: { Authorization: apiKey }, cache: "no-store" });
    if (res.status === 429) throw new Error("balldontlie の無料プランの回数制限（1分あたり5回）に達しました。1分以上待ってから取り込んでください。");
    if (res.status === 401) throw new Error("balldontlie のAPIキーが無効か、このデータを取得する権限がありません（HTTP 401）。");
    if (!res.ok) throw new Error(`balldontlie APIエラー: HTTP ${res.status}`);
    const body = (await res.json()) as BdlResponse;
    games.push(...body.data);
    cursor = body.meta?.next_cursor ?? null;
  } while (cursor);

  const { data: teams, error: teamsError } = await supabase.from("teams").select("id, abbreviation");
  if (teamsError) throw new Error(`teamsの取得に失敗しました: ${teamsError.message}`);
  const teamIdByAbbr = new Map((teams ?? []).map((t) => [t.abbreviation, t.id]));

  const skipped: SyncResult["skipped"] = [];
  const rows: GameInsert[] = [];
  for (const g of games) {
    const homeId = teamIdByAbbr.get(g.home_team.abbreviation);
    const awayId = teamIdByAbbr.get(g.visitor_team.abbreviation);
    if (!homeId || !awayId) {
      skipped.push({ gameId: g.id, reason: `チーム略称が当サイトにありません（${g.visitor_team.abbreviation} @ ${g.home_team.abbreviation}）` });
      continue;
    }
    const status = mapStatus(g);
    rows.push({
      source: "balldontlie",
      source_game_id: g.id,
      season: g.season,
      postseason: g.postseason,
      game_date: g.date.slice(0, 10),
      tipoff_at: g.datetime,
      home_team_id: homeId,
      away_team_id: awayId,
      status,
      // 試合前の status には開始時刻の文字列が入るため保存しない
      status_detail: status === "scheduled" ? null : g.status,
      period: g.period && g.period > 0 ? g.period : null,
      home_score: status === "scheduled" ? null : g.home_team_score,
      away_score: status === "scheduled" ? null : g.visitor_team_score,
      home_q1: g.home_q1,
      home_q2: g.home_q2,
      home_q3: g.home_q3,
      home_q4: g.home_q4,
      away_q1: g.visitor_q1,
      away_q2: g.visitor_q2,
      away_q3: g.visitor_q3,
      away_q4: g.visitor_q4,
      home_ot_scores: otScores(g.home_ot1, g.home_ot2, g.home_ot3),
      away_ot_scores: otScores(g.visitor_ot1, g.visitor_ot2, g.visitor_ot3),
      last_synced_at: new Date().toISOString(),
    });
  }

  if (options.dryRun) return { dates, fetched: games.length, upserted: 0, skipped, preview: rows };

  if (rows.length > 0) {
    const { error } = await supabase.from("games").upsert(rows, { onConflict: "source,source_game_id" });
    if (error) throw new Error(`gamesの登録に失敗しました: ${error.message}`);
  }

  return { dates, fetched: games.length, upserted: rows.length, skipped };
}
