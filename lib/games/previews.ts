import "server-only";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { GamePreviewLink } from "@/lib/games/types";

// /games の試合カードに出す「プレビューを読む」のリンク。
// 対象試合(article_drafts.target_*)がその試合と一致する公開済み記事のうち、最新の1本(投稿日の新しい順)を選ぶ。
// 試合開始前(現在時刻 < 開始日時)の試合だけを返す。開始時刻が未定の試合・プレシーズン・開始後の試合には付けない。
// article_drafts は公開側(anon)から読めないため、公開記事の一覧(lib/news/public-articles.ts)と同じく service_role で読み、
// status='published' の記事の id と見出しだけを返す。
export async function fetchGamePreviewLinks(
  date: string,
  games: { gameId: string; awayAbbr: string; homeAbbr: string; tipoffAt: string | null }[],
  now: Date = new Date()
): Promise<Record<string, GamePreviewLink>> {
  const upcoming = games.filter((g) => g.tipoffAt && Date.parse(g.tipoffAt) > now.getTime());
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
    if (article && game.tipoffAt) {
      links[game.gameId] = { articleId: article.id, headline: article.headline_ja, tipoffAt: game.tipoffAt };
    }
  }
  return links;
}
