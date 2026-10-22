// 試合のボックススコア Excel(新書式)の取り込み(サーバー専用・service_roleで実行)。
// 1. lib/games/xlsx-reader.ts で .xlsx を読み、lib/games/box-score-excel.ts で検査
// 2. チーム略称を teams の ID に、選手名を選手データ(players・別名)の ID に置き換える(照合できない選手は名前だけで表示)
// 3. import_box_scores() で1つの処理として取り込む
//    (同じ Game ID は更新、新しい Game ID は追加、アップロードに含まれない試合は削除しない)
// games(日程・スコア)・game_player_stats(CSV)・プレシーズンのテーブルには触れない。

import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { fetchAllRows } from "@/lib/supabase/fetch-all";
import { readXlsx } from "./xlsx-reader";
import { parseBoxScoreWorkbook, type ImportIssue, type SourceError } from "./box-score-excel";

type Client = SupabaseClient<Database>;

export type BoxScoreImportResult = {
  inserted: number;
  updated: number;
  errorCount: number;
  errors: ImportIssue[];
  warnings: ImportIssue[];
  skippedGameIds: string[];
  importedGames: { id: string; date: string; label: string }[];
  // 試合結果・チーム合計は登録し、個人成績は取得元の不足ありとして登録した試合
  incompleteGames: { id: string; label: string; note: string }[];
  importedPlayers: number;
  unmatchedPlayers: string[];
  schema: string | null;
  coverage: string[];
  sourceErrors: SourceError[];
};

/** 照合用に選手名をそろえる(アクセント記号・大文字小文字・記号・Jr./II などの違いを無視する) */
export function normalizePlayerName(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\b(jr|sr|ii|iii|iv|v)\b\.?/g, "")
    .replace(/[^a-z]/g, "");
}

async function buildPlayerMatcher(supabase: Client) {
  const [players, aliases] = await Promise.all([
    fetchAllRows<{ id: string; full_name: string; nba_person_id: number | null }>((from, to) =>
      supabase.from("players").select("id, full_name, nba_person_id").order("id").range(from, to)
    ),
    fetchAllRows<{ player_id: string; alias_full_name: string }>((from, to) =>
      supabase.from("player_name_aliases").select("player_id, alias_full_name").order("id").range(from, to)
    ),
  ]);
  if (players.error) throw new Error(`playersの取得に失敗しました: ${players.error.message}`);
  if (aliases.error) throw new Error(`player_name_aliasesの取得に失敗しました: ${aliases.error.message}`);

  const exact = new Map<string, Set<string>>();
  const normalized = new Map<string, Set<string>>();
  const byNbaId = new Map<string, Set<string>>();
  const add = (map: Map<string, Set<string>>, key: string, id: string) => {
    if (!map.has(key)) map.set(key, new Set());
    map.get(key)!.add(id);
  };
  for (const p of players.data) {
    add(exact, p.full_name, p.id);
    add(normalized, normalizePlayerName(p.full_name), p.id);
    if (p.nba_person_id !== null) add(byNbaId, String(p.nba_person_id), p.id);
  }
  for (const a of aliases.data) {
    add(exact, a.alias_full_name, a.player_id);
    add(normalized, normalizePlayerName(a.alias_full_name), a.player_id);
  }
  // NBA公式の選手ID(players.nba_person_id)で照合し、見つからなければ名前(別名を含む)で照合する。
  // 同じIDや名前の選手が複数いる場合は、取り違えないよう照合しない
  return (name: string, nbaPlayerId?: string | null): string | null => {
    const byId = nbaPlayerId ? byNbaId.get(nbaPlayerId.trim()) : undefined;
    if (byId && byId.size === 1) return [...byId][0];
    const e = exact.get(name);
    if (e) return e.size === 1 ? [...e][0] : null;
    const n = normalized.get(normalizePlayerName(name));
    return n && n.size === 1 ? [...n][0] : null;
  };
}

/**
 * Excel を検査し、検査が通った試合を取り込む。戻り値は管理画面に表示する取り込み結果。
 * dryRun: true のときは検査と登録内容の組み立てだけを行い、DBには書き込まない(登録予定の件数は totalsToSave で返す)
 */
export async function importBoxScoreWorkbook(
  supabase: Client,
  file: Buffer,
  options: { dryRun?: boolean } = {}
): Promise<BoxScoreImportResult & { totalsToSave: number }> {
  const parsed = parseBoxScoreWorkbook(readXlsx(file));
  const errors = [...parsed.errors];

  const { data: teams, error: teamsError } = await supabase.from("teams").select("id, abbreviation");
  if (teamsError) throw new Error(`teamsの取得に失敗しました: ${teamsError.message}`);
  const teamIdByAbbr = new Map((teams ?? []).map((t) => [t.abbreviation, t.id]));

  const skipped = new Set(parsed.skippedGameIds);
  const games = [];
  const importedGames: BoxScoreImportResult["importedGames"] = [];
  for (const g of parsed.games) {
    const awayId = teamIdByAbbr.get(g.away_abbr);
    const homeId = teamIdByAbbr.get(g.home_abbr);
    if (!awayId || !homeId) {
      errors.push({ sheet: "Game Summary", row: null, message: `${g.bref_game_id}：チーム（${g.away_abbr} / ${g.home_abbr}）が当サイトのチームデータにありません` });
      skipped.add(g.bref_game_id);
      continue;
    }
    const { away_abbr: _a, home_abbr: _h, ...rest } = g;
    void _a;
    void _h;
    games.push({ ...rest, away_team_id: awayId, home_team_id: homeId });
    importedGames.push({ id: g.bref_game_id, date: g.game_date, label: `${g.away_abbr} ${g.away_score} @ ${g.home_abbr} ${g.home_score}` });
  }
  const ok = new Set(games.map((g) => g.bref_game_id));

  const matchPlayer = await buildPlayerMatcher(supabase);
  const unmatched = new Set<string>();
  const players = parsed.players
    .filter((p) => ok.has(p.bref_game_id))
    .map(({ team_abbr, nba_player_id, ...p }) => {
      const playerId = matchPlayer(p.player_name, nba_player_id);
      if (!playerId) unmatched.add(p.player_name);
      return { ...p, team_id: teamIdByAbbr.get(team_abbr)!, player_id: playerId };
    });
  const totals = parsed.totals
    .filter((t) => ok.has(t.bref_game_id))
    .map(({ team_abbr, ...t }) => ({ ...t, team_id: teamIdByAbbr.get(team_abbr)! }));

  // 個人成績が不完全な試合の印(players_incomplete)は 20261023010000_box_score_players_incomplete.sql で追加する列。
  // 未実行のまま取り込むと印が保存されず、公開ページに注記が出ないため、その場合は何も書き込まずに止める
  const incompleteGames = games.filter((g) => g.players_incomplete);
  if (incompleteGames.length > 0 && !options.dryRun) {
    const { error: columnError } = await supabase.from("box_score_games").select("players_incomplete").limit(1);
    if (columnError) {
      throw new Error(
        "個人成績が不足している試合を登録するための列（box_score_games.players_incomplete）がまだありません。supabase/migrations/20261023010000_box_score_players_incomplete.sql を Supabase で実行してから、もう一度取り込んでください"
      );
    }
  }

  let inserted = 0;
  let updated = 0;
  if (games.length > 0 && !options.dryRun) {
    const { data, error } = await supabase.rpc("import_box_scores", { p_games: games, p_players: players, p_totals: totals });
    if (error) throw new Error(error.message);
    inserted = data?.inserted ?? 0;
    updated = data?.updated ?? 0;
  }

  return {
    inserted,
    updated,
    errorCount: errors.length,
    errors,
    warnings: parsed.warnings,
    skippedGameIds: [...skipped],
    importedGames,
    incompleteGames: incompleteGames.map((g) => ({
      id: g.bref_game_id,
      label: importedGames.find((x) => x.id === g.bref_game_id)?.label ?? g.bref_game_id,
      note: g.players_note ?? "",
    })),
    importedPlayers: players.length,
    totalsToSave: totals.length,
    unmatchedPlayers: [...unmatched],
    schema: parsed.schema,
    coverage: parsed.coverage,
    sourceErrors: parsed.sourceErrors,
  };
}
