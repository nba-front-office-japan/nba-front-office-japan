import type { createServerSupabaseClient } from "@/lib/supabase/server";
import { LEGENDS, type Legend } from "@/lib/legends/data";

const plain = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");

// 現役のレジェンド(カリー・レブロンなど)は、今季成績・Game Log のある既存の選手ページ(/players/{id})へ案内する。
// 選手名鑑の英語名(アクセント記号の有無が揺れる)で照合し、見つかった選手だけ slug → 選手ID を返す。
export async function fetchActiveLegendPlayerIds(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  legends: Legend[] = LEGENDS.filter((l) => l.isActive),
): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  if (legends.length === 0) return result;
  const names = [...new Set(legends.flatMap((l) => [l.name, plain(l.name)]))];
  const { data } = await supabase.from("players").select("id, full_name, is_active").in("full_name", names);
  for (const legend of legends) {
    const matched = (data ?? []).filter((r) => plain(r.full_name) === plain(legend.name));
    const row = matched.find((r) => r.is_active) ?? matched[0];
    if (row) result.set(legend.slug, row.id);
  }
  return result;
}
