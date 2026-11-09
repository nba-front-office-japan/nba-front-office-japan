import "server-only";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { GamePreviewLink } from "@/lib/games/types";
import { addDays } from "@/lib/games/date";

// /games の試合カードに出す「プレビューを読む」のリンク。
// 対象試合(article_drafts.target_*)がその試合と一致する公開済み記事のうち、最新の1本(投稿日の新しい順)を選ぶ。
// 表示期限は試合当日(日本時間の表示日 date)の終わりまで。試合の開始・終了後も当日中は付け、翌日(日本時間)になったら付けない。
// (日本の読者は夕方〜夜に見ることが多いため。プレビュー記事は結果に触れないので、結果と並んでもネタバレにならない)
// 開始時刻が未定の試合・プレシーズンには付けない。
// article_drafts は公開側(anon)から読めないため、公開記事の一覧(lib/news/public-articles.ts)と同じく service_role で読み、
// status='published' の記事の id と見出しだけを返す。
export async function fetchGamePreviewLinks(
  date: string,
  games: { gameId: string; awayAbbr: string; homeAbbr: string; tipoffAt: string | null }[],
  now: Date = new Date()
): Promise<Record<string, GamePreviewLink>> {
  // 日本時間で date の翌日 0:00 になったら表示しない
  const expiresAt = new Date(`${addDays(date, 1)}T00:00:00+09:00`).toISOString();
  if (now.getTime() >= Date.parse(expiresAt)) return {};
  const upcoming = games.filter((g) => g.tipoffAt);
  if (upcoming.length === 0) return {};

  const { data, error } = await createAdminSupabaseClient()
    .from("article_drafts")
    .select("id, headline_ja, published_at, target_away_team, target_home_team")
    .eq("status", "published")
    .eq("target_game_date", date)
    .order("published_at", { ascending: false });
  if (error || !data) return {};

  const links: Record<string, GamePreviewLink> = {};
  for (const game of upcoming) {
    // 投稿日の新しい順に並んでいるため、最初に一致した記事が最新
    const article = data.find((a) => a.target_away_team === game.awayAbbr && a.target_home_team === game.homeAbbr);
    if (article) {
      links[game.gameId] = { articleId: article.id, headline: article.headline_ja, expiresAt };
    }
  }
  return links;
}
