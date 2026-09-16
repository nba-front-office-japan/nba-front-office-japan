import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/page-shell";
import { TeamDirectory } from "@/components/team-directory";

export default async function TeamsPage() {
  const supabase = createServerSupabaseClient();
  const { data: teams, error } = await supabase
    .from("teams")
    .select("*")
    .order("name");

  return (
    <PageShell>
      <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">
        Team Database · 2026 Season
      </p>
      <h1 className="mb-8 text-[36px] font-semibold tracking-tight">Teams</h1>
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
