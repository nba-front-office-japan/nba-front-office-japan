import type { Metadata } from "next";
import Link from "next/link";
import { cache } from "react";
import { notFound } from "next/navigation";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { fetchPublishedArticleById } from "@/lib/news/public-articles";
import { CATEGORY_OPTIONS, isRumorOrUnverified, isSingleSource } from "@/lib/news/constants";
import { PageShell } from "@/components/page-shell";
import { NewsArticleView, formatArticleDate } from "@/components/news/article-view";
import { trailingRelatedMedia } from "@/lib/news/body-media";

export const dynamic = "force-dynamic";

const CATEGORY_LABEL = Object.fromEntries(
  CATEGORY_OPTIONS.map((o) => [o.value, o.label])
);

// generateMetadata とページ本体で共通の取得(1回のリクエストにつきDBへの問い合わせは1回)
const fetchArticle = cache((articleId: string) => fetchPublishedArticleById(createAdminSupabaseClient(), articleId));

export async function generateMetadata({ params }: PageProps<"/news/[articleId]">): Promise<Metadata> {
  const { articleId } = await params;
  const article = await fetchArticle(articleId);
  if (!article) return {};
  const title = `${article.headlineJa} | NBA Front Office Japan`;
  const description = article.dekJa ?? undefined;
  const canonical = `/news/${articleId}`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: "article" },
  };
}

export default async function NewsArticlePage({
  params,
}: PageProps<"/news/[articleId]">) {
  const { articleId } = await params;
  const article = await fetchArticle(articleId);

  if (!article) {
    notFound();
  }

  const lowConfidence = isRumorOrUnverified(article.verificationStatus);
  return (
    <PageShell>
      <NewsArticleView
        articleKind={article.articleKind}
        categoryLabel={CATEGORY_LABEL[article.category] ?? article.category}
        lowConfidence={lowConfidence}
        singleSource={isSingleSource(article.verificationStatus)}
        headline={article.headlineJa}
        dek={article.dekJa}
        dateLabel={formatArticleDate(article.publishedAt)}
        bodyMarkdown={article.bodyMarkdown}
        trailingMedia={trailingRelatedMedia(article.bodyMarkdown, article.relatedMediaUrls)}
        sources={article.sources}
        footer={
          <Link href="/news" className="mt-6 inline-block text-sm font-extrabold text-blue">
            ← News一覧に戻る
          </Link>
        }
      />
    </PageShell>
  );
}
