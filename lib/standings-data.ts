import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { teamNameJa } from "@/lib/team-names-ja";
import type { StandingRow } from "@/lib/standings";

type Client = SupabaseClient<Database>;
type Team = Database["public"]["Tables"]["teams"]["Row"];
type BoxScoreGame = Database["public"]["Tables"]["box_score_games"]["Row"];

export type StandingsData = {
  rows: StandingRow[];
  gamesCounted: number;
  lastUpdatedAt: string | null;
};

/**
 * 順位表は、管理画面から取り込んだレギュラーシーズンのボックススコアだけを集計する。
 * これにより、取り込みが完了していない試合を勝手に順位へ反映しない。
 * プレシーズンは preseason_* テーブルで別管理のため、ここには含めない。
 */
export async function fetchStandings(supabase: Client, season: number): Promise<StandingsData> {
  const seasonStart = `${season}-10-01`;
  // NBAのレギュラーシーズンが終わる5月1日より前だけを対象にする。
  // プレーオフのボックススコアが入っても、レギュラーシーズン順位へ混ざらない。
  const seasonEnd = `${season + 1}-05-01`;

  const [teamsResult, gamesResult] = await Promise.all([
    supabase.from("teams").select("id, name, abbreviation, conference, division").order("name"),
    supabase
      .from("box_score_games")
      .select("away_team_id, home_team_id, away_score, home_score, last_imported_at")
      .gte("game_date", seasonStart)
      .lt("game_date", seasonEnd),
  ]);

  if (teamsResult.error) throw new Error(`チーム情報の取得に失敗しました: ${teamsResult.error.message}`);
  if (gamesResult.error) {
    if (gamesResult.error.code === "PGRST205" || gamesResult.error.code === "42P01") {
      return { rows: [], gamesCounted: 0, lastUpdatedAt: null };
    }
    throw new Error(`ボックススコアの取得に失敗しました: ${gamesResult.error.message}`);
  }

  return buildStandings(teamsResult.data ?? [], gamesResult.data ?? []);
}

function buildStandings(
  teams: Pick<Team, "id" | "name" | "abbreviation" | "conference" | "division">[],
  games: Pick<BoxScoreGame, "away_team_id" | "home_team_id" | "away_score" | "home_score" | "last_imported_at">[]
): StandingsData {
  const recordByTeam = new Map(teams.map((team) => [team.id, { wins: 0, losses: 0 }]));
  let lastUpdatedAt: string | null = null;

  for (const game of games) {
    if (game.home_score === game.away_score) continue;
    const home = recordByTeam.get(game.home_team_id);
    const away = recordByTeam.get(game.away_team_id);
    if (!home || !away) continue;
    if (game.home_score > game.away_score) {
      home.wins += 1;
      away.losses += 1;
    } else {
      away.wins += 1;
      home.losses += 1;
    }
    if (!lastUpdatedAt || game.last_imported_at > lastUpdatedAt) lastUpdatedAt = game.last_imported_at;
  }

  const rows = teams.map((team) => {
    const record = recordByTeam.get(team.id) ?? { wins: 0, losses: 0 };
    const gamesPlayed = record.wins + record.losses;
    return {
      teamId: team.id,
      abbreviation: team.abbreviation,
      name: team.name,
      nameJa: teamNameJa(team.abbreviation) ?? team.name,
      conference: team.conference,
      division: team.division,
      wins: record.wins,
      losses: record.losses,
      winPct: gamesPlayed === 0 ? null : record.wins / gamesPlayed,
      gamesBack: null,
    } satisfies StandingRow;
  });

  return { rows, gamesCounted: games.length, lastUpdatedAt };
}
