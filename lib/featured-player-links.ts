import type { createServerSupabaseClient } from "@/lib/supabase/server";
import { ALL_FEATURED_PLAYERS, featuredPlayerFor, type FeaturedPlayer } from "@/lib/featured-players";

export type FeaturedPlayerLink = { id: string; featured: FeaturedPlayer };

// 人気選手(lib/featured-players.ts)と選手ページのIDの対応。DBの英語名はアクセント記号の有無が揺れるので、両方の表記で探す
export async function fetchFeaturedPlayerLinks(
  supabase: ReturnType<typeof createServerSupabaseClient>,
): Promise<FeaturedPlayerLink[]> {
  const names = ALL_FEATURED_PLAYERS.flatMap((p) =>
    [p.name, ...(p.aliases ?? [])].flatMap((n) => [n, n.normalize("NFD").replace(/[̀-ͯ]/g, "")]),
  );
  const { data: rows } = await supabase
    .from("players")
    .select("id, full_name, is_active")
    .in("full_name", [...new Set(names)]);
  return ALL_FEATURED_PLAYERS.flatMap((fp) => {
    const matched = (rows ?? []).filter((r) => featuredPlayerFor(r.full_name) === fp);
    const row = matched.find((r) => r.is_active) ?? matched[0];
    return row ? [{ id: row.id, featured: fp }] : [];
  });
}
