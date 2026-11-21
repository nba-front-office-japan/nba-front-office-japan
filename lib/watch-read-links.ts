import type { createServerSupabaseClient } from "@/lib/supabase/server";
import { fetchFeaturedPlayerLinks } from "@/lib/featured-player-links";
import { legendBySlug } from "@/lib/legends/data";
import { WORKS, workPlayers, type WorkPlayer } from "@/lib/watch-read";

const plain = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/**
 * 「観る・読むNBA」の紹介文に出てくる選手 → リンク先(表記 ja をキーにする)。
 * 人気選手の選手ページ → 選手名鑑(英語名で1人に決まる場合だけ) → レジェンドページの順に探し、見つからない選手はリンクしない。
 */
export async function fetchWorkPlayerHrefs(supabase: ReturnType<typeof createServerSupabaseClient>): Promise<Record<string, string>> {
  const players = new Map<string, WorkPlayer>();
  for (const w of WORKS) for (const p of workPlayers(w)) players.set(p.ja, p);

  const featured = await fetchFeaturedPlayerLinks(supabase).catch(() => []);
  const featuredIds = new Map(featured.map((l) => [l.featured.name, l.id]));

  const dbNames = [...players.values()].flatMap((p) => p.db ?? []);
  const dbIds = new Map<string, string>();
  if (dbNames.length > 0) {
    const { data } = await supabase
      .from("players")
      .select("id, full_name")
      .in("full_name", [...new Set(dbNames.flatMap((n) => [n, n.normalize("NFD").replace(/[̀-ͯ]/g, "")]))]);
    for (const p of players.values()) {
      if (!p.db) continue;
      const wanted = new Set(p.db.map(plain));
      const ids = [...new Set((data ?? []).filter((r) => wanted.has(plain(r.full_name))).map((r) => r.id))];
      if (ids.length === 1) dbIds.set(p.ja, ids[0]);
    }
  }

  const result: Record<string, string> = {};
  for (const p of players.values()) {
    const featuredId = p.featured ? featuredIds.get(p.featured) : undefined;
    const dbId = dbIds.get(p.ja);
    if (featuredId) result[p.ja] = `/players/${featuredId}`;
    else if (dbId) result[p.ja] = `/players/${dbId}`;
    else if (p.legend && legendBySlug(p.legend)) result[p.ja] = `/legends/${p.legend}`;
  }
  return result;
}
