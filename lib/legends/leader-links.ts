import "server-only";
import { unstable_cache } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { LEADER_PLAYERS } from "@/lib/legends/leaders";

const plain = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");

export type LeaderPlayerInfo = {
  /** 現役選手の Basketball-Reference ID → 選手ページID */
  links: Record<string, string>;
  /** Basketball-Reference ID → 日本語名(選手名鑑の full_name_ja。同じ英語名で日本語名が分かれる場合は使わない) */
  namesJa: Record<string, string>;
};

// ランキングに出てくる選手を選手名鑑(英語名)で照合し、選手ページID(現役のみ)と日本語名を返す。1日キャッシュ。
// 取得に失敗した選手はリンクなし・英語名のまま表示する。
export const fetchLeaderPlayerInfo = unstable_cache(
  async (): Promise<LeaderPlayerInfo> => {
    const entries = Object.entries(LEADER_PLAYERS);
    const names = [...new Set(entries.flatMap(([, p]) => [p.name, plain(p.name)]))];
    const supabase = createServerSupabaseClient();
    const rows: { id: string; full_name: string; full_name_ja: string | null; is_active: boolean | null }[] = [];
    // URL が長くなりすぎないよう分けて取得する
    for (let i = 0; i < names.length; i += 150) {
      const { data, error } = await supabase
        .from("players")
        .select("id, full_name, full_name_ja, is_active")
        .in("full_name", names.slice(i, i + 150));
      if (error) throw error;
      rows.push(...(data ?? []));
    }
    const byName = new Map<string, typeof rows>();
    for (const r of rows) {
      const key = plain(r.full_name);
      byName.set(key, [...(byName.get(key) ?? []), r]);
    }
    const links: Record<string, string> = {};
    const namesJa: Record<string, string> = {};
    for (const [id, p] of entries) {
      const matched = byName.get(plain(p.name)) ?? [];
      if (p.active) {
        const row = matched.find((r) => r.is_active) ?? matched[0];
        if (row) links[id] = row.id;
        if (row?.full_name_ja) namesJa[id] = row.full_name_ja;
        continue;
      }
      const ja = [...new Set(matched.map((r) => r.full_name_ja).filter((v): v is string => !!v))];
      if (ja.length === 1) namesJa[id] = ja[0];
    }
    return { links, namesJa };
  },
  ["legend-leader-player-info"],
  { revalidate: 86400 },
);
