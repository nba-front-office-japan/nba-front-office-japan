import { createServerSupabaseClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";
import { TeamList } from "@/components/team-list";

export default async function TeamsPage() {
  const supabase = createServerSupabaseClient();
  const { data: teams, error } = await supabase
    .from("teams")
    .select("*")
    .order("name");

  return (
    <div className="flex flex-1 flex-col bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
        <h1 className="mb-6 text-2xl font-semibold">Teams</h1>
        {error ? (
          <p className="text-sm text-red-600 dark:text-red-400">
            チームデータの取得に失敗しました: {error.message}
          </p>
        ) : (
          <TeamList teams={teams ?? []} />
        )}
      </main>
    </div>
  );
}
