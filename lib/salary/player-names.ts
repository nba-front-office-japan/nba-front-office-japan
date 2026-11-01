import "server-only";
import { normalizeName } from "@/lib/featured-players";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { fetchAllRows } from "@/lib/supabase/fetch-all";

// サラリーデータの英語名に、選手ページと同じ日本語名(players.full_name_ja)を対応付ける。
// 同じ名前で日本語名が分かれる場合は別人の可能性があるため使わず、英語名のまま表示する。

function withoutSuffix(name: string): string {
  return name
    .replace(/\./g, "")
    .replace(/\s+(jr|sr|ii|iii|iv)$/, "")
    .trim();
}

function uniqueNames(pairs: [string, string][]): Map<string, string> {
  const names = new Map<string, string | null>();
  for (const [key, ja] of pairs) {
    names.set(key, names.has(key) && names.get(key) !== ja ? null : ja);
  }
  return new Map([...names].filter((entry): entry is [string, string] => entry[1] !== null));
}

/** 英語名から日本語名を返す関数を作る。日本語名が分からない選手は null。取得に失敗したら全員 null */
export async function salaryJapaneseNameLookup(): Promise<(name: string) => string | null> {
  const supabase = createServerSupabaseClient();
  const [players, aliases] = await Promise.all([
    fetchAllRows((from, to) => supabase.from("players").select("id, full_name, full_name_ja").order("id").range(from, to)),
    fetchAllRows((from, to) => supabase.from("player_name_aliases").select("player_id, alias_full_name").order("id").range(from, to)),
  ]);
  if (players.error || aliases.error) return () => null;

  const jaById = new Map(players.data.flatMap((p) => (p.full_name_ja ? [[p.id, p.full_name_ja] as const] : [])));
  const pairs: [string, string][] = [
    ...players.data.flatMap((p): [string, string][] => (p.full_name_ja ? [[normalizeName(p.full_name), p.full_name_ja]] : [])),
    ...aliases.data.flatMap((a): [string, string][] => {
      const ja = jaById.get(a.player_id);
      return ja ? [[normalizeName(a.alias_full_name), ja]] : [];
    }),
  ];
  const exact = uniqueNames(pairs);
  // Jr. などの有無だけが違う表記は、対応先が1人に決まるときだけ同じ選手として扱う
  const loose = uniqueNames(pairs.map(([key, ja]) => [withoutSuffix(key), ja]));

  return (name) => {
    const key = normalizeName(name);
    return exact.get(key) ?? loose.get(withoutSuffix(key)) ?? null;
  };
}
