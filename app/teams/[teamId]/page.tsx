import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";
import { TeamHeader } from "@/components/team-header";
import { TeamRoster } from "@/components/team-roster";

export default async function TeamDetailPage({
  params,
}: PageProps<"/teams/[teamId]">) {
  const { teamId } = await params;
  const supabase = createServerSupabaseClient();

  const { data: team, error: teamError } = await supabase
    .from("teams")
    .select("*")
    .eq("id", teamId)
    .single();

  if (teamError || !team) {
    notFound();
  }

  const { data: history, error: historyError } = await supabase
    .from("player_team_history")
    .select("player_id")
    .eq("team_id", teamId)
    .is("end_date", null);

  const playerIds = (history ?? []).map((row) => row.player_id);

  const { data: players, error: playersError } =
    playerIds.length > 0
      ? await supabase.from("players").select("*").in("id", playerIds)
      : { data: [], error: null };

  return (
    <div className="flex flex-1 flex-col bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
        <TeamHeader team={team} />
        <h2 className="mb-4 text-lg font-semibold">Roster</h2>
        {historyError || playersError ? (
          <p className="text-sm text-red-600 dark:text-red-400">
            在籍選手データの取得に失敗しました:{" "}
            {historyError?.message ?? playersError?.message}
          </p>
        ) : (
          <TeamRoster players={players ?? []} />
        )}
      </main>
    </div>
  );
}
