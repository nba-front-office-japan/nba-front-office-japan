import "server-only";
import { unstable_cache } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { fetchAllRows } from "@/lib/supabase/fetch-all";
import type { DraftPick } from "@/lib/draft/draft-2026-picks";
import {
  buildDraftPlayerIndex,
  matchDraftYear,
  type DraftMatchAlias,
  type DraftMatchPlayer,
} from "@/lib/draft/draft-player-match";

// 選手名鑑の全選手(照合に使う列だけ)。全ドラフト年のページと用語辞典(lib/glossary-player-links.ts)で共有するため1日キャッシュする
export const loadDraftMatchData = unstable_cache(
  async (): Promise<{ players: DraftMatchPlayer[]; aliases: DraftMatchAlias[] } | null> => {
    const supabase = createServerSupabaseClient();
    const [players, aliases] = await Promise.all([
      fetchAllRows((from, to) =>
        supabase.from("players").select("id, full_name, last_name, draft_year, draft_pick").order("id").range(from, to),
      ),
      fetchAllRows((from, to) =>
        supabase.from("player_name_aliases").select("player_id, alias_full_name").order("id").range(from, to),
      ),
    ]);
    if (players.error || aliases.error) return null;
    return { players: players.data, aliases: aliases.data };
  },
  ["draft-player-match-data"],
  { revalidate: 86400 },
);

/** ドラフト指名(全体順位) → 選手ページの選手ID。名鑑で見つからない選手は含まない。取得に失敗したら空 */
export async function fetchDraftPlayerIds(year: number, picks: DraftPick[]): Promise<Record<number, string>> {
  const data = await loadDraftMatchData();
  if (!data) return {};
  return matchDraftYear(buildDraftPlayerIndex(data.players, data.aliases), year, picks);
}
