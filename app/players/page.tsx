import { createServerSupabaseClient } from "@/lib/supabase/server";
import { fetchAllRows } from "@/lib/supabase/fetch-all";
import { PageShell } from "@/components/page-shell";
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
    <PageShell>
      <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">
        Player Database · 2026 Season
      </p>
      <h1 className="mb-7 text-[36px] font-semibold tracking-tight">
        Players
      </h1>
      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400">
          選手データの取得に失敗しました: {error.message}
        </p>
      ) : (
        <PlayerSearchList players={items} />
      )}
    </PageShell>
  );
}
