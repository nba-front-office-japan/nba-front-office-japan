import { createServerSupabaseClient } from "@/lib/supabase/server";
import { fetchAllRows } from "@/lib/supabase/fetch-all";
import { SiteHeader } from "@/components/site-header";
import { StatsTable, type StatRow } from "@/components/stats-table";

export default async function StatsPage() {
  const supabase = createServerSupabaseClient();

  const { data: stats, error } = await fetchAllRows((from, to) =>
    supabase.from("player_stats").select("*").range(from, to)
  );

  if (error) {
    return (
      <div className="flex flex-1 flex-col bg-background text-foreground">
        <SiteHeader />
        <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
          <h1 className="mb-6 text-2xl font-semibold">Stats Lab</h1>
          <p className="text-sm text-red-600 dark:text-red-400">
            スタッツデータの取得に失敗しました: {error.message}
          </p>
        </main>
      </div>
    );
  }

  // player_statsの選手数はteamsと違って多くなり得るため、.in()でIDを直接渡すと
  // URLが長くなりすぎて失敗することがある（実際に発生した不具合）。
  // players全件を取得してMapで引く方式にする。
  const [{ data: players, error: playersError }, { data: teams, error: teamsError }] =
    await Promise.all([
      fetchAllRows((from, to) =>
        supabase.from("players").select("id, full_name").range(from, to)
      ),
      fetchAllRows((from, to) =>
        supabase.from("teams").select("id, abbreviation").range(from, to)
      ),
    ]);

  if (playersError || teamsError) {
    return (
      <div className="flex flex-1 flex-col bg-background text-foreground">
        <SiteHeader />
        <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
          <h1 className="mb-6 text-2xl font-semibold">Stats Lab</h1>
          <p className="text-sm text-red-600 dark:text-red-400">
            選手・チームデータの取得に失敗しました:{" "}
            {playersError?.message ?? teamsError?.message}
          </p>
        </main>
      </div>
    );
  }

  const playerNameById = new Map(players.map((p) => [p.id, p.full_name]));
  const teamAbbrById = new Map(teams.map((t) => [t.id, t.abbreviation]));

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
