// プレシーズンExcelの取り込み(サーバー専用・service_roleで実行)。
// 1. lib/games/xlsx-reader.ts で .xlsx を読み、lib/games/preseason-excel.ts で検査
// 2. チーム略称を teams の ID に置き換え、import_preseason() で1つの処理として取り込む
//    (同じ Game ID は更新、新しい Game ID は追加、アップロードに含まれない試合は削除しない)
// レギュラーシーズンの games / game_player_stats には触れない。

import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { readXlsx } from "./xlsx-reader";
import { parsePreseasonWorkbook, type ImportIssue } from "./preseason-excel";

type Client = SupabaseClient<Database>;

export type PreseasonImportResult = {
  inserted: number;
  updated: number;
  errorCount: number;
  errors: ImportIssue[];
  warnings: ImportIssue[];
  skippedGameKeys: string[];
  importedGames: number;
  importedPlayers: number;
  coverageDays: number;
};

/** Excel を検査し、問題のない試合を取り込む。戻り値は管理画面に表示する取り込み結果 */
export async function importPreseasonWorkbook(supabase: Client, file: Buffer): Promise<PreseasonImportResult> {
  const parsed = parsePreseasonWorkbook(readXlsx(file));
  const errors = [...parsed.errors];

  const { data: teams, error: teamsError } = await supabase.from("teams").select("id, abbreviation");
  if (teamsError) throw new Error(`teamsの取得に失敗しました: ${teamsError.message}`);
  const teamIdByAbbr = new Map((teams ?? []).map((t) => [t.abbreviation, t.id]));

  const skipped = new Set(parsed.skippedGameKeys);
  const games = [];
  for (const g of parsed.games) {
    const awayId = teamIdByAbbr.get(g.away_abbr);
    const homeId = teamIdByAbbr.get(g.home_abbr);
    if (!awayId || !homeId) {
      errors.push({ sheet: "Game Summary", row: null, message: `${g.game_key}：チーム（${g.away_abbr} / ${g.home_abbr}）が当サイトのチームデータにありません` });
      skipped.add(g.game_key);
      continue;
    }
    const { away_abbr: _a, home_abbr: _h, ...rest } = g;
    void _a;
    void _h;
    games.push({ ...rest, away_team_id: awayId, home_team_id: homeId });
  }
  const ok = new Set(games.map((g) => g.game_key));
  const players = parsed.players.filter((p) => ok.has(p.game_key));
  const totals = parsed.totals.filter((t) => ok.has(t.game_key));

  let inserted = 0;
  let updated = 0;
  if (games.length > 0 || parsed.coverage.length > 0) {
    const { data, error } = await supabase.rpc("import_preseason", {
      p_games: games,
      p_players: players,
      p_totals: totals,
      p_coverage: parsed.coverage,
    });
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
    skippedGameKeys: [...skipped],
    importedGames: games.length,
    importedPlayers: players.length,
    coverageDays: parsed.coverage.length,
  };
}
