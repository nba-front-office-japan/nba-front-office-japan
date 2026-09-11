import { createServerSupabaseClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";
import { StatsTable, type StatRow } from "@/components/stats-table";

export default async function StatsPage() {
  const supabase = createServerSupabaseClient();

  const { data: stats, error } = await supabase.from("player_stats").select("*");

  if (error || !stats) {
    return (
      <div className="flex flex-1 flex-col bg-background text-foreground">
        <SiteHeader />
        <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
          <h1 className="mb-6 text-2xl font-semibold">Stats Lab</h1>
          <p className="text-sm text-red-600 dark:text-red-400">
            スタッツデータの取得に失敗しました: {error?.message}
          </p>
        </main>
      </div>
    );
  }

  const playerIds = [...new Set(stats.map((s) => s.player_id))];
  const teamIds = [
    ...new Set(
      stats
        .map((s) => s.team_id)
        .filter((id): id is string => id !== null)
    ),
  ];

  const [{ data: players }, { data: teams }] = await Promise.all([
    playerIds.length > 0
      ? supabase.from("players").select("id, full_name").in("id", playerIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string }[] }),
    teamIds.length > 0
      ? supabase.from("teams").select("id, abbreviation").in("id", teamIds)
      : Promise.resolve({ data: [] as { id: string; abbreviation: string }[] }),
  ]);

  const playerNameById = new Map(
    (players ?? []).map((p) => [p.id, p.full_name])
  );
  const teamAbbrById = new Map(
    (teams ?? []).map((t) => [t.id, t.abbreviation])
  );

  const rows: StatRow[] = stats.map((s) => ({
    id: s.id,
    playerName: playerNameById.get(s.player_id) ?? "不明な選手",
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

  return (
    <div className="flex flex-1 flex-col bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
        <h1 className="mb-6 text-2xl font-semibold">Stats Lab</h1>
        <StatsTable rows={rows} />
      </main>
    </div>
  );
}
