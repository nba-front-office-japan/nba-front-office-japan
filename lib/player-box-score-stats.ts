// 選手ページ(/players/[playerId])の「今季成績」: 管理画面から取り込んだ試合のボックススコア(box_score_*)から、
// その選手のレギュラーシーズン累計を表示のたびに集計する(集計結果は保存しない)。
// 試合の判定(レギュラーシーズンだけ・同じ試合の重複は最後に取り込んだ方)は Teams の 2026-27 Stats(lib/team-box-score-stats.ts)と同じ。
// シーズン中に移籍した選手は、全チームでの出場分を合計する。
import "server-only";
import { cache } from "react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import { addGame, classifyGame, matchupKey, ZERO } from "@/lib/team-box-score-stats";
import type { RawStatTotals } from "@/lib/stats";

type BoxGameRow = Database["public"]["Tables"]["box_score_games"]["Row"];
type BoxPlayerRow = Database["public"]["Tables"]["box_score_players"]["Row"];

export type PlayerCurrentSeasonStats = {
  season: number;
  totals: RawStatTotals;
  // 集計した最後の試合日(米国の日付、YYYY-MM-DD)
  lastGameDate: string;
};

/** 選手の今季のレギュラーシーズン累計。出場した試合が無ければ null。generateMetadata とページ本体で共通(1回のリクエストにつき1回) */
export const fetchPlayerCurrentSeasonStats = cache(
  async (playerId: string, season: number): Promise<PlayerCurrentSeasonStats | null> => {
    const supabase = createServerSupabaseClient();
    const { data: rows } = await supabase
      .from("box_score_players")
      .select("*")
      .eq("player_id", playerId)
      .neq("role", "dnp");
    if (!rows || rows.length === 0) return null;

    const { data: boxGames } = await supabase
      .from("box_score_games")
      .select("*")
      .in("id", [...new Set(rows.map((r) => r.game_id))])
      .gte("game_date", `${season}-08-01`)
      .lt("game_date", `${season + 1}-08-01`);
    if (!boxGames || boxGames.length === 0) return null;

    // Basketball-Reference の Game ID の試合は、日程(games)にレギュラーシーズンの同じ対戦があるかで判定する
    const { data: scheduled } = await supabase
      .from("games")
      .select("game_date, home_team_id, away_team_id")
      .eq("season", season)
      .eq("postseason", false)
      .in("game_date", [...new Set(boxGames.map((g) => g.game_date))]);
    const scheduledRegular = new Set(
      (scheduled ?? []).map((g) => matchupKey(g.game_date, g.home_team_id, g.away_team_id)),
    );

    // 同じ日付・同じ対戦は1試合として数える(最後に取り込んだ方を使う)
    const regularByMatchup = new Map<string, BoxGameRow>();
    for (const game of boxGames) {
      if (classifyGame(game, season, scheduledRegular) !== "regular") continue;
      const key = matchupKey(game.game_date, game.home_team_id, game.away_team_id);
      const existing = regularByMatchup.get(key);
      if (!existing || game.last_imported_at > existing.last_imported_at) regularByMatchup.set(key, game);
    }
    const counted = new Map([...regularByMatchup.values()].map((g) => [g.id, g]));

    let totals = ZERO;
    let lastGameDate: string | null = null;
    for (const row of rows as BoxPlayerRow[]) {
      const game = counted.get(row.game_id);
      if (!game) continue;
      totals = addGame(totals, row);
      if (lastGameDate === null || game.game_date > lastGameDate) lastGameDate = game.game_date;
    }
    return lastGameDate === null ? null : { season, totals, lastGameDate };
  },
);

/** 「10月26日」(米国の日付) */
export function gameDateLabel(date: string): string {
  const [, m, d] = date.split("-").map(Number);
  return `${m}月${d}日`;
}
