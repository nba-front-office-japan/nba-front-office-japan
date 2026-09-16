import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/page-shell";
import { PlayerHeader, type PlayerSnapshot } from "@/components/player-header";
import {
  PlayerSeasonStats,
  type PlayerStatRow,
} from "@/components/player-season-stats";
import { deriveStats, toRawStatTotals } from "@/lib/stats";

export default async function PlayerDetailPage({
  params,
}: PageProps<"/players/[playerId]">) {
  const { playerId } = await params;
  const supabase = createServerSupabaseClient();

  const { data: player, error: playerError } = await supabase
    .from("players")
    .select("*")
    .eq("id", playerId)
    .single();

  if (playerError || !player) {
    notFound();
  }

  const { data: history } = await supabase
    .from("player_team_history")
    .select("team_id")
    .eq("player_id", playerId)
    .is("end_date", null)
    .limit(1)
    .maybeSingle();

  const { data: currentTeam } = history
    ? await supabase
        .from("teams")
        .select("*")
        .eq("id", history.team_id)
        .single()
    : { data: null };

  const { data: stats, error: statsError } = await supabase
    .from("player_stats")
    .select("*")
    .eq("player_id", playerId);

  const teamIds = [
    ...new Set(
      (stats ?? [])
        .map((s) => s.team_id)
        .filter((id): id is string => id !== null)
    ),
  ];

  const { data: statTeams } =
    teamIds.length > 0
      ? await supabase.from("teams").select("id, abbreviation").in("id", teamIds)
      : { data: [] as { id: string; abbreviation: string }[] };

  const teamAbbrById = new Map(
    (statTeams ?? []).map((t) => [t.id, t.abbreviation])
  );

  const statRows: PlayerStatRow[] = (stats ?? []).map((s) => ({
    id: s.id,
    season: s.season,
    teamLabel: s.team_id ? teamAbbrById.get(s.team_id) ?? "-" : "TOT",
    seasonType: s.season_type,
    gamesPlayed: s.games_played,
    points: s.points,
    reboundsTotal: s.rebounds_total,
    assists: s.assists,
    fieldGoalsMade: s.field_goals_made,
    fieldGoalsAttempted: s.field_goals_attempted,
    threePointersMade: s.three_pointers_made,
    threePointersAttempted: s.three_pointers_attempted,
    freeThrowsAttempted: s.free_throws_attempted,
  }));

  const regularSeasonRows = (stats ?? []).filter(
    (s) => s.season_type === "regular_season"
  );
  const latestSeason = regularSeasonRows.length
    ? Math.max(...regularSeasonRows.map((s) => s.season))
    : null;
  const latestSeasonRows = regularSeasonRows.filter(
    (s) => s.season === latestSeason
  );
  // トレードがあった場合はTOT行(team_id=NULL)を優先し、無ければ単独チーム分の行を使う。
  const snapshotRow =
    latestSeasonRows.find((s) => s.team_id === null) ?? latestSeasonRows[0];

  const snapshot: PlayerSnapshot | null = snapshotRow
    ? {
        ...deriveStats(toRawStatTotals(snapshotRow)),
        mpg: snapshotRow.games_played
          ? snapshotRow.minutes_played / snapshotRow.games_played
          : null,
      }
    : null;

  return (
    <PageShell>
      <PlayerHeader
        player={player}
        currentTeam={currentTeam ?? null}
        snapshot={snapshot}
      />
      <div className="mt-8 border border-line bg-surface p-6">
        <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">
          Season Stats
        </p>
        <h2 className="mb-4 text-lg font-semibold">Stats</h2>
        {statsError ? (
          <p className="text-sm text-red-600 dark:text-red-400">
            スタッツデータの取得に失敗しました: {statsError.message}
          </p>
        ) : (
          <PlayerSeasonStats rows={statRows} />
        )}
      </div>
    </PageShell>
  );
}
