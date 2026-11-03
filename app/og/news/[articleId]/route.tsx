import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { fetchPublishedArticleById } from "@/lib/news/public-articles";
import { shareImageCategory } from "@/lib/news/share-image";
import { renderShareCard } from "@/lib/og/share-card";

// 記事ごとのシェア用画像(1200×630 PNG)。記事ページの og:image / twitter:image から参照される。
// URLには内容のバージョン(?v=)が付くので、同じURLの画像は内容が変わらない。
// そのため配信網(Vercel CDN)とSNS側に長くキャッシュさせ、毎回は作り直さない。
const CACHE_HEADERS = {
  "Cache-Control": "public, max-age=86400, s-maxage=31536000, stale-while-revalidate=86400",
};

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export async function GET(_request: Request, ctx: RouteContext<"/og/news/[articleId]">) {
  const { articleId } = await ctx.params;
  const article = await fetchPublishedArticleById(createAdminSupabaseClient(), articleId);

  // 非公開・存在しない記事は、サイト名だけの画像を短い時間だけキャッシュして返す
  if (!article) {
    return renderShareCard({}, { headers: { "Cache-Control": "public, max-age=300, s-maxage=300" } });
  }

  return renderShareCard(
    {
      category: shareImageCategory(article),
      headline: article.headlineJa,
      dateLabel: formatDate(article.publishedAt),
    },
    { headers: CACHE_HEADERS }
  );
}
