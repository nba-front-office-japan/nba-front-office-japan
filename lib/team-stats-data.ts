// チームスタッツ一覧(/stats/teams): 管理画面から取り込んだ試合のボックススコアのチーム合計(box_score_team_totals)を、
// 表示のたびに30チーム分集計する(集計結果は保存しない)。
// ・対象の試合の判定は順位表・Teams の Stats と同じ(classifyGame: レギュラーシーズンだけ、同じ日付・同じ対戦は最後に取り込んだ方)
// ・失点と相手のスタッツは、同じ試合の相手側のチーム合計から取る
// ・チーム合計の行が両チーム分そろっていない試合は数えない(件数だけ返す)
import "server-only";
import type { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import { fetchAllRows } from "@/lib/supabase/fetch-all";
import { teamNameJa } from "@/lib/team-names-ja";
import { classifyGame, matchupKey } from "@/lib/team-box-score-stats";

type ServerClient = ReturnType<typeof createServerSupabaseClient>;
type BoxGameRow = Database["public"]["Tables"]["box_score_games"]["Row"];
type TeamTotalRow = Database["public"]["Tables"]["box_score_team_totals"]["Row"];
type CountedGame = Pick<BoxGameRow, "id" | "bref_game_id" | "game_date" | "away_team_id" | "home_team_id" | "last_imported_at">;

export interface TeamStatTotals {
  pts: number;
  fgm: number;
  fga: number;
  fg3m: number;
  fg3a: number;
  ftm: number;
  fta: number;
  oreb: number;
  dreb: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  tov: number;
  pf: number;
}

export interface TeamStatsListRow {
  teamId: string;
  abbreviation: string;
  nameJa: string;
  games: number;
  wins: number;
  losses: number;
  // チーム自身の合計と、相手チームの合計(失点 = opponent.pts)
  own: TeamStatTotals;
  opponent: TeamStatTotals;
}

export interface TeamStatsList {
  rows: TeamStatsListRow[];
  gamesCounted: number;
  lastGameDate: string | null;
  // チーム合計がそろっていないため数えなかった試合
  incompleteGames: number;
}

const STAT_KEYS = ["pts", "fgm", "fga", "fg3m", "fg3a", "ftm", "fta", "oreb", "dreb", "reb", "ast", "stl", "blk", "tov", "pf"] as const;

function zeroTotals(): TeamStatTotals {
  return { pts: 0, fgm: 0, fga: 0, fg3m: 0, fg3a: 0, ftm: 0, fta: 0, oreb: 0, dreb: 0, reb: 0, ast: 0, stl: 0, blk: 0, tov: 0, pf: 0 };
}

function addTotals(acc: TeamStatTotals, row: TeamTotalRow): void {
  for (const key of STAT_KEYS) acc[key] += row[key] ?? 0;
}

const ID_CHUNK = 150;

export async function fetchTeamStatsList(supabase: ServerClient, season: number): Promise<TeamStatsList> {
  const [teamsResult, gamesResult, scheduledResult] = await Promise.all([
    supabase.from("teams").select("id, abbreviation, name").order("abbreviation"),
    fetchAllRows<CountedGame>((from, to) =>
      supabase
        .from("box_score_games")
        .select("id, bref_game_id, game_date, away_team_id, home_team_id, last_imported_at")
        .gte("game_date", `${season}-08-01`)
        .lt("game_date", `${season + 1}-08-01`)
        .order("game_date")
        .order("id")
        .range(from, to)
    ),
    fetchAllRows<{ game_date: string; home_team_id: string; away_team_id: string }>((from, to) =>
      supabase
        .from("games")
        .select("game_date, home_team_id, away_team_id")
        .eq("season", season)
        .eq("postseason", false)
        .order("id")
        .range(from, to)
    ),
  ]);
  if (teamsResult.error) throw new Error(`チーム情報の取得に失敗しました: ${teamsResult.error.message}`);
  if (gamesResult.error) throw new Error(`ボックススコアの取得に失敗しました: ${gamesResult.error.message}`);
  if (scheduledResult.error) throw new Error(`日程の取得に失敗しました: ${scheduledResult.error.message}`);

  const scheduledRegular = new Set(scheduledResult.data.map((g) => matchupKey(g.game_date, g.home_team_id, g.away_team_id)));
  const byMatchup = new Map<string, CountedGame>();
  for (const game of gamesResult.data) {
    if (classifyGame(game, season, scheduledRegular) !== "regular") continue;
    const key = matchupKey(game.game_date, game.home_team_id, game.away_team_id);
    const existing = byMatchup.get(key);
    if (!existing || game.last_imported_at > existing.last_imported_at) byMatchup.set(key, game);
  }
  const games = [...byMatchup.values()];

  const totals: TeamTotalRow[] = [];
  for (let i = 0; i < games.length; i += ID_CHUNK) {
    const ids = games.slice(i, i + ID_CHUNK).map((g) => g.id);
    const { data, error } = await supabase.from("box_score_team_totals").select("*").in("game_id", ids);
    if (error) throw new Error(`チーム合計の取得に失敗しました: ${error.message}`);
    totals.push(...(data ?? []));
  }
  const totalsByGame = new Map<string, { away?: TeamTotalRow; home?: TeamTotalRow }>();
  for (const row of totals) {
    const entry = totalsByGame.get(row.game_id) ?? {};
    entry[row.side as "away" | "home"] = row;
    totalsByGame.set(row.game_id, entry);
  }

  const teams = teamsResult.data ?? [];
  const rowsById = new Map<string, TeamStatsListRow>(
    teams.map((t) => [
      t.id,
      { teamId: t.id, abbreviation: t.abbreviation, nameJa: teamNameJa(t.abbreviation) ?? t.name, games: 0, wins: 0, losses: 0, own: zeroTotals(), opponent: zeroTotals() },
    ])
  );

  let incompleteGames = 0;
  let gamesCounted = 0;
  let lastGameDate: string | null = null;
  for (const game of games) {
    const pair = totalsByGame.get(game.id);
    const home = rowsById.get(game.home_team_id);
    const away = rowsById.get(game.away_team_id);
    if (!pair?.home || !pair.away || !home || !away) {
      incompleteGames++;
      continue;
    }
    gamesCounted++;
    if (!lastGameDate || game.game_date > lastGameDate) lastGameDate = game.game_date;
    const sides: [TeamStatsListRow, TeamTotalRow, TeamTotalRow][] = [
      [home, pair.home, pair.away],
      [away, pair.away, pair.home],
    ];
    for (const [team, own, opp] of sides) {
      team.games++;
      if ((own.pts ?? 0) > (opp.pts ?? 0)) team.wins++;
      else team.losses++;
      addTotals(team.own, own);
      addTotals(team.opponent, opp);
    }
  }

  return { rows: [...rowsById.values()], gamesCounted, lastGameDate, incompleteGames };
}
