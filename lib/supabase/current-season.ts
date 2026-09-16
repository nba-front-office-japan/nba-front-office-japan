import "server-only";
import type { createServerSupabaseClient } from "@/lib/supabase/server";

// player_statsに実際にデータが入っている最新シーズンを、ダッシュボード系の
// 集計（チームPPG等）の基準シーズンとして使う。
export async function getLatestSeason(
  supabase: ReturnType<typeof createServerSupabaseClient>
): Promise<number | null> {
  const { data } = await supabase
    .from("player_stats")
    .select("season")
    .order("season", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.season ?? null;
}
