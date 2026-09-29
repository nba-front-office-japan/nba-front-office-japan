import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/page-shell";
import { TeamDirectory } from "@/components/team-directory";
import { STATS_SEASON, seasonLabel } from "@/lib/seasons";

export default async function TeamsPage() {
  const supabase = createServerSupabaseClient();
  const { data: teams, error } = await supabase
    .from("teams")
    .select("*")
    .order("name");

  return (
    <PageShell>
      <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">
        Team Database · {seasonLabel(STATS_SEASON)} Season
      </p>
      <h1 className="mb-2 text-[36px] font-semibold tracking-tight">Teams</h1>
      <p className="mb-7 text-sm text-muted">
        チーム名から{seasonLabel(STATS_SEASON)}チーム記録へ、その下のリンクから Profile・Stats へ直接進めます。
      </p>
      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400">
          チームデータの取得に失敗しました: {error.message}
        </p>
      ) : (
        <div className="border border-line bg-surface p-6">
          <TeamDirectory teams={teams ?? []} />
        </div>
      )}
    </PageShell>
  );
}
