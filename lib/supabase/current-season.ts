import "server-only";
import { ROSTER_SEASON } from "@/lib/seasons";
import type { createServerSupabaseClient } from "@/lib/supabase/server";

// トップページの DATA UPDATE に出すシーズン。今季は試合データ(box_score_games)が取り込まれていれば今季とし、
// まだ無ければ player_stats に確定成績がある最新シーズンにする。
export async function getLatestSeason(
  supabase: ReturnType<typeof createServerSupabaseClient>
): Promise<number | null> {
  const { data: currentGame } = await supabase
    .from("box_score_games")
    .select("id")
    .gte("game_date", `${ROSTER_SEASON}-08-01`)
    .lt("game_date", `${ROSTER_SEASON + 1}-08-01`)
    .limit(1)
    .maybeSingle();
  if (currentGame) return ROSTER_SEASON;

  const { data } = await supabase
    .from("player_stats")
    .select("season")
    .lt("season", ROSTER_SEASON)
    .order("season", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.season ?? null;
}
