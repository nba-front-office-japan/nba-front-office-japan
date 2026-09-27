import Link from "next/link";
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
      <h1 className="mb-4 text-[36px] font-semibold tracking-tight">Teams</h1>
      <Link
        href="/teams/valuations"
        className="mb-8 inline-flex items-center gap-2 border border-line bg-surface px-4 py-3 text-sm font-semibold hover:border-blue hover:text-blue"
      >
        チーム資産価値ランキング（CNBC推計）→
      </Link>
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
