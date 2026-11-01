import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { fetchAllRows } from "@/lib/supabase/fetch-all";
import { teamNameJa } from "@/lib/team-names-ja";
import { buildStandingRows, type StandingRow } from "@/lib/standings";
import { classifyGame, matchupKey } from "@/lib/team-box-score-stats";

type Client = SupabaseClient<Database>;
type Team = Database["public"]["Tables"]["teams"]["Row"];
type BoxScoreGame = Database["public"]["Tables"]["box_score_games"]["Row"];
type StandingBoxGame = Pick<
  BoxScoreGame,
  "id" | "bref_game_id" | "game_date" | "away_team_id" | "home_team_id" | "away_score" | "home_score" | "last_imported_at"
>;

export type StandingsData = {
  rows: StandingRow[];
  gamesCounted: number;
  lastUpdatedAt: string | null;
};

/**
 * 順位表は、管理画面から取り込んだレギュラーシーズンのボックススコアだけを集計する。
 * これにより、取り込みが完了していない試合を勝手に順位へ反映しない。
 * プレシーズンは preseason_* テーブルで別管理のため、ここには含めない。
 * 試合の判定(レギュラーシーズンだけ・同じ試合の重複は最後に取り込んだ方)は Teams の 2026-27 Stats・選手スタッツ一覧と同じ。
 */
export async function fetchStandings(supabase: Client, season: number): Promise<StandingsData> {
  const seasonStart = `${season}-10-01`;
  // NBAのレギュラーシーズンが終わる5月1日より前だけを対象にする。
  // プレーオフのボックススコアが入っても、レギュラーシーズン順位へ混ざらない。
  const seasonEnd = `${season + 1}-05-01`;

  const [teamsResult, gamesResult, scheduledResult] = await Promise.all([
    supabase.from("teams").select("id, name, abbreviation, conference, division").order("name"),
    fetchAllRows<StandingBoxGame>((from, to) =>
      supabase
        .from("box_score_games")
        .select("id, bref_game_id, game_date, away_team_id, home_team_id, away_score, home_score, last_imported_at")
        .gte("game_date", seasonStart)
        .lt("game_date", seasonEnd)
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
  if (gamesResult.error) {
    if (gamesResult.error.code === "PGRST205" || gamesResult.error.code === "42P01") {
      return { rows: [], gamesCounted: 0, lastUpdatedAt: null };
    }
    throw new Error(`ボックススコアの取得に失敗しました: ${gamesResult.error.message}`);
  }
  if (scheduledResult.error) throw new Error(`日程の取得に失敗しました: ${scheduledResult.error.message}`);

  const scheduledRegular = new Set(scheduledResult.data.map((g) => matchupKey(g.game_date, g.home_team_id, g.away_team_id)));
  // 同じ日付・同じ対戦は1試合として数える(最後に取り込んだ方を使う)。Map の順番は日付の古い順のまま
  const regularByMatchup = new Map<string, StandingBoxGame>();
  for (const game of gamesResult.data) {
    if (classifyGame(game, season, scheduledRegular) !== "regular") continue;
    const key = matchupKey(game.game_date, game.home_team_id, game.away_team_id);
    const existing = regularByMatchup.get(key);
    if (!existing || game.last_imported_at > existing.last_imported_at) regularByMatchup.set(key, game);
  }

  return buildStandings(teamsResult.data ?? [], [...regularByMatchup.values()]);
}

function buildStandings(
  teams: Pick<Team, "id" | "name" | "abbreviation" | "conference" | "division">[],
  games: StandingBoxGame[]
): StandingsData {
  const rows = buildStandingRows(
    teams.map((team) => ({
      teamId: team.id,
      abbreviation: team.abbreviation,
      name: team.name,
      nameJa: teamNameJa(team.abbreviation) ?? team.name,
      conference: team.conference,
      division: team.division,
    })),
    games
  );

  const lastUpdatedAt = games.reduce<string | null>(
    (latest, game) => (!latest || game.last_imported_at > latest ? game.last_imported_at : latest),
    null
  );

  return { rows, gamesCounted: games.length, lastUpdatedAt };
}
