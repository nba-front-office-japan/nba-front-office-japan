import { createServerSupabaseClient } from "@/lib/supabase/server";
import { fetchAllRows } from "@/lib/supabase/fetch-all";
import { SiteHeader } from "@/components/site-header";
import {
  PlayerSearchList,
  type PlayerListItem,
} from "@/components/player-search-list";

export default async function PlayersPage() {
  const supabase = createServerSupabaseClient();
  const { data: players, error } = await fetchAllRows((from, to) =>
    supabase
      .from("players")
      .select("id, full_name, position")
      .order("last_name")
      .range(from, to)
  );

  const items: PlayerListItem[] = (players ?? []).map((p) => ({
    id: p.id,
    fullName: p.full_name,
    position: p.position,
  }));

  return (
    <div className="flex flex-1 flex-col bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
        <h1 className="mb-6 text-2xl font-semibold">Players</h1>
        {error ? (
          <p className="text-sm text-red-600 dark:text-red-400">
            選手データの取得に失敗しました: {error.message}
          </p>
        ) : (
          <PlayerSearchList players={items} />
        )}
      </main>
    </div>
  );
}
