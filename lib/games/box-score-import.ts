// 試合ボックススコアCSVの、DBを使う検査と取込(サーバー専用・service_roleで実行)。
// 1. lib/games/box-score-csv.ts で列・必須項目・数値・試合内の重複を検査
// 2. ここでチームの存在・試合の存在・選手の照合・合計得点の照合を検査
// 3. 問題がなければ、試合ごとに replace_game_player_stats() で選手スタッツを入れ替える
//    (削除と登録が1つのトランザクションで行われるため、失敗しても以前のデータが残る)

import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { gameKey, normalizePlayerName, parseBoxScoreCsv, type CsvIssue, type ParsedBoxScoreRow } from "./box-score-csv";

type Client = SupabaseClient<Database>;

export type GamePlan = {
  key: string;
  label: string;
  gameId: string;
  gameStatus: string;
  rowCount: number;
  awayCount: number;
  homeCount: number;
  existingCount: number;
  unmatchedPlayers: string[];
};

export type CheckReport = {
  errors: CsvIssue[];
  warnings: CsvIssue[];
  games: GamePlan[];
  totalRows: number;
};

type PreparedRow = {
  team_id: string;
  player_id: string | null;
  player_name: string;
  seconds_played: number;
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  fgm: number;
  fga: number;
  fg3m: number;
  fg3a: number;
  ftm: number;
  fta: number;
  plus_minus: number | null;
};

type Prepared = { report: CheckReport; payloads: Map<string, PreparedRow[]> };

async function fetchAllPlayers(supabase: Client): Promise<{ id: string; full_name: string }[]> {
  const all: { id: string; full_name: string }[] = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase.from("players").select("id, full_name").order("id").range(from, from + PAGE - 1);
    if (error) throw new Error(`playersの取得に失敗しました: ${error.message}`);
    all.push(...(data ?? []));
    if (!data || data.length < PAGE) break;
  }
  return all;
}

/** 選手名 → 選手ID。完全一致 → 正規化一致 → 別名(player_name_aliases)の順で照合し、1人に決まる場合だけ返す */
async function buildPlayerResolver(supabase: Client): Promise<(name: string) => string | null> {
  const [players, aliasesResult] = await Promise.all([
    fetchAllPlayers(supabase),
    supabase.from("player_name_aliases").select("player_id, alias_full_name"),
  ]);
  if (aliasesResult.error) throw new Error(`player_name_aliasesの取得に失敗しました: ${aliasesResult.error.message}`);

  const exact = new Map<string, string[]>();
  const normalized = new Map<string, string[]>();
  const add = (map: Map<string, string[]>, key: string, id: string) => {
    const list = map.get(key) ?? [];
    if (!list.includes(id)) list.push(id);
    map.set(key, list);
  };
  for (const p of players) {
    add(exact, p.full_name, p.id);
    add(normalized, normalizePlayerName(p.full_name), p.id);
  }
  for (const a of aliasesResult.data ?? []) add(normalized, normalizePlayerName(a.alias_full_name), a.player_id);

  return (name: string) => {
    const e = exact.get(name);
    if (e && e.length === 1) return e[0];
    const n = normalized.get(normalizePlayerName(name));
    if (n && n.length === 1) return n[0];
    return null;
  };
}

/** CSVを検査し、取り込める場合は試合ごとの登録データを用意する */
export async function prepareBoxScoreImport(supabase: Client, csvText: string): Promise<Prepared> {
  const parsed = parseBoxScoreCsv(csvText);
  const errors = [...parsed.errors];
  const warnings = [...parsed.warnings];
  const payloads = new Map<string, PreparedRow[]>();
  const games: GamePlan[] = [];

  if (parsed.rows.length === 0 && errors.length > 0) {
    return errorsOnly(errors, parsed.dataLineCount);
  }

  // チームの存在
  const { data: teams, error: teamsError } = await supabase.from("teams").select("id, abbreviation, is_active");
  if (teamsError) throw new Error(`teamsの取得に失敗しました: ${teamsError.message}`);
  const teamIdByAbbr = new Map((teams ?? []).map((t) => [t.abbreviation, t.id]));
  const unknownTeams = new Map<string, number[]>();
  for (const r of parsed.rows) {
    for (const abbr of new Set([r.awayTeam, r.homeTeam, r.team])) {
      if (!teamIdByAbbr.has(abbr)) unknownTeams.set(abbr, [...(unknownTeams.get(abbr) ?? []), r.line]);
    }
  }
  for (const [abbr, lines] of unknownTeams) {
    errors.push({ line: lines[0], message: `チーム略称「${abbr}」が見つかりません（${lines.length}行、最初は${lines[0]}行目）。当サイトのチーム略称（例: BOS, NYK, GSW）で記入してください。` });
  }

  // 試合ごとにまとめる
  const groups = new Map<string, ParsedBoxScoreRow[]>();
  for (const r of parsed.rows) groups.set(gameKey(r), [...(groups.get(gameKey(r)) ?? []), r]);

  // 選手の照合は「注意」にしか使わないため、エラーがすでにある場合は行わない
  const resolvePlayer = errors.length === 0 && groups.size > 0 ? await buildPlayerResolver(supabase) : null;

  for (const [key, rows] of groups) {
    const { gameDate, awayTeam, homeTeam } = rows[0];
    const label = `${gameDate} ${awayTeam} @ ${homeTeam}`;
    const awayId = teamIdByAbbr.get(awayTeam);
    const homeId = teamIdByAbbr.get(homeTeam);
    if (!awayId || !homeId) continue;

    const { data: game, error } = await supabase
      .from("games")
      .select("id, status, home_score, away_score")
      .eq("game_date", gameDate)
      .eq("home_team_id", homeId)
      .eq("away_team_id", awayId)
      .maybeSingle();
    if (error) throw new Error(`gamesの取得に失敗しました: ${error.message}`);

    if (!game) {
      // 日付の書き間違いの手がかりとして、前後の日付に同じ対戦があるか調べる
      const { data: nearby } = await supabase
        .from("games")
        .select("game_date")
        .eq("home_team_id", homeId)
        .eq("away_team_id", awayId)
        .gte("game_date", shiftDate(gameDate, -3))
        .lte("game_date", shiftDate(gameDate, 3));
      const hint = nearby && nearby.length > 0 ? `近い日付にこの対戦があります（${nearby.map((g) => g.game_date).join("、")}）。試合日は米国の日付で記入してください。` : "先に「日程・スコアの取り込み」でこの日の試合を取り込んでください。";
      errors.push({ line: rows[0].line, message: `試合が見つかりません: ${label}。${hint}` });
      continue;
    }

    if (game.status !== "final") warnings.push({ line: rows[0].line, message: `${label} は試合終了になっていません（状態: ${game.status}）。最終結果の確定後に再取込してください。` });

    // 合計得点の照合(試合のスコアがある場合)
    for (const [side, teamAbbr, score] of [["アウェー", awayTeam, game.away_score], ["ホーム", homeTeam, game.home_score]] as const) {
      const total = rows.filter((r) => r.team === teamAbbr).reduce((sum, r) => sum + r.pts, 0);
      if (score !== null && total !== score) {
        warnings.push({ line: rows[0].line, message: `${label}: ${side}（${teamAbbr}）の選手の得点合計 ${total} が、試合のスコア ${score} と一致しません。選手の記入漏れがないか確認してください。` });
      }
    }

    const { count: existingCount } = await supabase.from("game_player_stats").select("id", { count: "exact", head: true }).eq("game_id", game.id);
    if ((existingCount ?? 0) > 0) warnings.push({ line: rows[0].line, message: `${label} には登録済みのボックススコア（${existingCount}人分）があります。取り込むと、この試合の選手スタッツはCSVの内容にすべて置き換わります。` });

    const unmatched: string[] = [];
    const payload: PreparedRow[] = rows.map((r) => {
      const playerId = resolvePlayer ? resolvePlayer(r.player) : null;
      if (!playerId) unmatched.push(r.player);
      return {
        team_id: teamIdByAbbr.get(r.team)!,
        player_id: playerId,
        player_name: r.player,
        seconds_played: r.secondsPlayed,
        pts: r.pts,
        reb: r.reb,
        ast: r.ast,
        stl: r.stl,
        blk: r.blk,
        fgm: r.fgm,
        fga: r.fga,
        fg3m: r.fg3m,
        fg3a: r.fg3a,
        ftm: r.ftm,
        fta: r.fta,
        plus_minus: r.plusMinus,
      };
    });
    if (unmatched.length > 0) {
      warnings.push({ line: rows[0].line, message: `${label}: 当サイトの選手データと照合できなかった選手がいます（${unmatched.join("、")}）。名前のまま登録し、選手ページへのリンクは付きません。` });
    }

    payloads.set(key, payload);
    games.push({
      key,
      label,
      gameId: game.id,
      gameStatus: game.status,
      rowCount: rows.length,
      awayCount: rows.filter((r) => r.team === awayTeam).length,
      homeCount: rows.filter((r) => r.team === homeTeam).length,
      existingCount: existingCount ?? 0,
      unmatchedPlayers: unmatched,
    });
  }

  // エラーが1件でもある場合は取り込めないため、試合ごとの「注意」や概要は出さず、エラーだけを返す
  if (errors.length > 0) return errorsOnly(errors, parsed.dataLineCount);

  return { report: { errors, warnings, games, totalRows: parsed.dataLineCount }, payloads };
}

/** エラーだけの検査結果(行番号順。行番号のないファイル全体のエラーを先頭にする) */
function errorsOnly(errors: CsvIssue[], totalRows: number): Prepared {
  const sorted = [...errors].sort((a, b) => (a.line ?? 0) - (b.line ?? 0));
  return { report: { errors: sorted, warnings: [], games: [], totalRows }, payloads: new Map() };
}

function shiftDate(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export type ImportResult = { label: string; ok: boolean; count: number; message?: string };

/** 検査済みのデータを、試合ごとに入れ替えて登録する */
export async function applyBoxScoreImport(supabase: Client, prepared: Prepared): Promise<ImportResult[]> {
  const results: ImportResult[] = [];
  for (const plan of prepared.report.games) {
    const rows = prepared.payloads.get(plan.key) ?? [];
    const { data, error } = await supabase.rpc("replace_game_player_stats", { p_game_id: plan.gameId, p_rows: rows });
    if (error) results.push({ label: plan.label, ok: false, count: 0, message: error.message });
    else results.push({ label: plan.label, ok: true, count: typeof data === "number" ? data : rows.length });
  }
  return results;
}
