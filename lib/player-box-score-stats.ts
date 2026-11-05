// 選手ページ(/players/[playerId])の「今季成績」と「Game Log」: 管理画面から取り込んだ試合のボックススコア(box_score_*)から、
// その選手のレギュラーシーズンの出場試合を表示のたびに取り出す(集計結果は保存しない)。
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
  // 出場したチーム(移籍していれば複数)
  teamIds: string[];
};

/** Game Log の1試合(出場した試合だけ。DNP は含めない) */
export type PlayerGameLogRow = {
  key: string;
  // 米国の試合日(YYYY-MM-DD)
  gameDate: string;
  // 日程(games)の試合ID。試合詳細(/games/[id])へのリンクに使う。日程に無い試合は null
  scheduleGameId: string | null;
  teamAbbr: string;
  opponentAbbr: string;
  isHome: boolean;
  teamScore: number;
  opponentScore: number;
  starter: boolean;
  seconds: number;
  pts: number;
  oreb: number;
  dreb: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  tov: number;
  pf: number;
  fgm: number;
  fga: number;
  fg3m: number;
  fg3a: number;
  ftm: number;
  fta: number;
  plusMinus: number | null;
};

type SeasonGames = {
  rows: { row: BoxPlayerRow; game: BoxGameRow }[];
  // 日程(games)の同じ日付・同じ対戦の試合ID
  scheduleIdByMatchup: Map<string, string>;
};

// 選手の今季のレギュラーシーズンの出場試合(DNP 以外)。今季成績・Game Log・generateMetadata で共通(1回のリクエストにつき1回)
const fetchPlayerSeasonGames = cache(async (playerId: string, season: number): Promise<SeasonGames | null> => {
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
    .select("id, game_date, home_team_id, away_team_id")
    .eq("season", season)
    .eq("postseason", false)
    .in("game_date", [...new Set(boxGames.map((g) => g.game_date))]);
  const scheduleIdByMatchup = new Map(
    (scheduled ?? []).map((g) => [matchupKey(g.game_date, g.home_team_id, g.away_team_id), g.id]),
  );
  const scheduledRegular = new Set(scheduleIdByMatchup.keys());

  // 同じ日付・同じ対戦は1試合として数える(最後に取り込んだ方を使う)
  const regularByMatchup = new Map<string, BoxGameRow>();
  for (const game of boxGames) {
    if (classifyGame(game, season, scheduledRegular) !== "regular") continue;
    const key = matchupKey(game.game_date, game.home_team_id, game.away_team_id);
    const existing = regularByMatchup.get(key);
    if (!existing || game.last_imported_at > existing.last_imported_at) regularByMatchup.set(key, game);
  }
  const counted = new Map([...regularByMatchup.values()].map((g) => [g.id, g]));

  const matched = (rows as BoxPlayerRow[])
    .map((row) => ({ row, game: counted.get(row.game_id) }))
    .filter((r): r is { row: BoxPlayerRow; game: BoxGameRow } => r.game !== undefined);
  if (matched.length === 0) return null;
  return { rows: matched, scheduleIdByMatchup };
});

/** 選手の今季のレギュラーシーズン累計。出場した試合が無ければ null。generateMetadata とページ本体で共通(1回のリクエストにつき1回) */
export const fetchPlayerCurrentSeasonStats = cache(
  async (playerId: string, season: number): Promise<PlayerCurrentSeasonStats | null> => {
    const games = await fetchPlayerSeasonGames(playerId, season);
    if (!games) return null;
    let totals = ZERO;
    let lastGameDate: string | null = null;
    const teamIds = new Set<string>();
    for (const { row, game } of games.rows) {
      totals = addGame(totals, row);
      teamIds.add(row.team_id);
      if (lastGameDate === null || game.game_date > lastGameDate) lastGameDate = game.game_date;
    }
    return lastGameDate === null ? null : { season, totals, lastGameDate, teamIds: [...teamIds] };
  },
);

/** 選手の今季のレギュラーシーズンの試合ごとの成績(新しい試合が先)。出場した試合が無ければ空配列 */
export async function fetchPlayerGameLog(playerId: string, season: number): Promise<PlayerGameLogRow[]> {
  const games = await fetchPlayerSeasonGames(playerId, season);
  if (!games) return [];

  const teamIds = new Set<string>();
  for (const { game } of games.rows) {
    teamIds.add(game.home_team_id);
    teamIds.add(game.away_team_id);
  }
  const { data: teams } = await createServerSupabaseClient()
    .from("teams")
    .select("id, abbreviation")
    .in("id", [...teamIds]);
  const abbr = new Map((teams ?? []).map((t) => [t.id, t.abbreviation]));

  return games.rows
    .map(({ row, game }): PlayerGameLogRow => {
      const isHome = row.side === "home";
      const opponentId = isHome ? game.away_team_id : game.home_team_id;
      return {
        key: row.id,
        gameDate: game.game_date,
        scheduleGameId:
          games.scheduleIdByMatchup.get(matchupKey(game.game_date, game.home_team_id, game.away_team_id)) ?? null,
        teamAbbr: abbr.get(row.team_id) ?? "-",
        opponentAbbr: abbr.get(opponentId) ?? "-",
        isHome,
        teamScore: isHome ? game.home_score : game.away_score,
        opponentScore: isHome ? game.away_score : game.home_score,
        starter: row.role === "starter",
        seconds: row.seconds_played ?? 0,
        pts: row.pts ?? 0,
        oreb: row.oreb ?? 0,
        dreb: row.dreb ?? 0,
        reb: row.reb ?? 0,
        ast: row.ast ?? 0,
        stl: row.stl ?? 0,
        blk: row.blk ?? 0,
        tov: row.tov ?? 0,
        pf: row.pf ?? 0,
        fgm: row.fgm ?? 0,
        fga: row.fga ?? 0,
        fg3m: row.fg3m ?? 0,
        fg3a: row.fg3a ?? 0,
        ftm: row.ftm ?? 0,
        fta: row.fta ?? 0,
        plusMinus: row.plus_minus,
      };
    })
    .sort((a, b) => (a.gameDate === b.gameDate ? 0 : a.gameDate < b.gameDate ? 1 : -1));
}

/** 「10月26日」(米国の日付) */
export function gameDateLabel(date: string): string {
  const [, m, d] = date.split("-").map(Number);
  return `${m}月${d}日`;
}
