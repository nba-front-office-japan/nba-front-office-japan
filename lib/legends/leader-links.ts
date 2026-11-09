import "server-only";
import { unstable_cache } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { LEADER_PLAYERS } from "@/lib/legends/leaders";

const plain = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");

// 現役選手(ランキングに出てくる人だけ)の英語名 → 選手ページID。選手名鑑の英語名で照合し、1日キャッシュする。
// 同名が複数いれば現役を優先。見つからない選手・取得失敗は含めない(リンクなしで表示)。
export const fetchActiveLeaderPlayerIds = unstable_cache(
  async (): Promise<Record<string, string>> => {
    const active = Object.entries(LEADER_PLAYERS).filter(([, p]) => p.active);
    const names = [...new Set(active.flatMap(([, p]) => [p.name, plain(p.name)]))];
    if (names.length === 0) return {};
    const { data, error } = await createServerSupabaseClient()
      .from("players")
      .select("id, full_name, is_active")
      .in("full_name", names);
    if (error || !data) return {};
    const result: Record<string, string> = {};
    for (const [id, p] of active) {
      const matched = data.filter((r) => plain(r.full_name) === plain(p.name));
      const row = matched.find((r) => r.is_active) ?? matched[0];
      if (row) result[id] = row.id;
    }
    return result;
  },
  ["legend-leader-player-ids"],
  { revalidate: 86400 },
);
