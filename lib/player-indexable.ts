// 選手ページを検索エンジンに載せるかどうかの判定(選手ページの noindex と sitemap で共通)。
//
// players には歴代の全選手(約6,000人)が is_active = true で入っていて、その大半は
// 日本語名・生年月日・成績が無い空に近いページになる。こうしたページが sitemap に大量に
// 載ると、サイト全体が「中身の薄いページの多いサイト」と評価されて検索順位が下がるため、
// 次のどれにも当てはまらない選手は noindex にし、sitemap にも載せない(ページ自体は残す)。
//   ・人気選手の詳しい解説がある(lib/featured-players.ts)
//   ・今季(ROSTER_SEASON)のロスターに入っている
//   ・今季の試合に出場している(box_score_players)
//   ・過去のシーズン成績がある(player_stats)
import "server-only";
import { cache } from "react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { fetchAllRows } from "@/lib/supabase/fetch-all";
import { featuredPlayerFor } from "@/lib/featured-players";
import { ROSTER_SEASON } from "@/lib/seasons";

/** 選手ページ1件を検索に載せるか。ロスター・今季出場は選手ページで取得済みの値を渡す */
export async function isPlayerPageIndexable(args: {
  playerId: string;
  fullName: string;
  onCurrentRoster: boolean;
  playedThisSeason: boolean;
}): Promise<boolean> {
  if (featuredPlayerFor(args.fullName) || args.onCurrentRoster || args.playedThisSeason) return true;
  const { count, error } = await createServerSupabaseClient()
    .from("player_stats")
    .select("id", { count: "exact", head: true })
    .eq("player_id", args.playerId);
  // 取得に失敗したときは、誤って検索から外さないよう載せる側に倒す
  if (error) return true;
  return (count ?? 0) > 0;
}

/** sitemap に載せる選手のID(上の判定と同じ条件)。取得に失敗した条件は空として扱う */
export const fetchIndexablePlayerIds = cache(async (): Promise<string[]> => {
  const supabase = createServerSupabaseClient();
  const [players, rosters, boxRows, statRows] = await Promise.all([
    fetchAllRows<{ id: string; full_name: string }>((from, to) =>
      supabase.from("players").select("id, full_name").eq("is_active", true).order("id").range(from, to)
    ),
    fetchAllRows<{ id: string; player_id: string }>((from, to) =>
      supabase.from("player_season_rosters").select("id, player_id").eq("season", ROSTER_SEASON).order("id").range(from, to)
    ),
    fetchAllRows<{ id: string; player_id: string | null }>((from, to) =>
      supabase.from("box_score_players").select("id, player_id").neq("role", "dnp").order("id").range(from, to)
    ),
    fetchAllRows<{ id: string; player_id: string }>((from, to) =>
      supabase.from("player_stats").select("id, player_id").order("id").range(from, to)
    ),
  ]);
  if (players.error) return [];

  const withData = new Set<string>();
  if (!rosters.error) for (const r of rosters.data) withData.add(r.player_id);
  if (!boxRows.error) for (const b of boxRows.data) if (b.player_id) withData.add(b.player_id);
  if (!statRows.error) for (const s of statRows.data) withData.add(s.player_id);

  return players.data
    .filter((p) => withData.has(p.id) || featuredPlayerFor(p.full_name))
    .map((p) => p.id);
});
