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
import { fetchArticlePlayers } from "@/lib/news/player-articles";

export const dynamic = "force-dynamic";

const CATEGORY_LABEL = Object.fromEntries(
  CATEGORY_OPTIONS.map((o) => [o.value, o.label])
);

// generateMetadata とページ本体で共通の取得(1回のリクエストにつきDBへの問い合わせは1回)
const fetchArticle = cache((articleId: string) => fetchPublishedArticleById(createAdminSupabaseClient(), articleId));

/** 本文(Markdown)の冒頭約110文字。見出し・リンク・画像などの記号を除いた文章にする */
function bodyExcerpt(markdown: string): string | undefined {
  const text = markdown
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/^\s*(#{1,6}|>|[-*+]|\d+\.)\s+/gm, "")
    .replace(/[*_`~|]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return undefined;
  return text.length > 110 ? `${text.slice(0, 110)}…` : text;
}

export async function generateMetadata({ params }: PageProps<"/news/[articleId]">): Promise<Metadata> {
  const { articleId } = await params;
  const article = await fetchArticle(articleId);
  if (!article) return {};
  // サイト名はGoogleが別に表示するため付けない(長い見出しが途中で切れないようにする)
  const title = article.headlineJa;
  // リード文(dek)が無い記事は、本文の冒頭を説明文にする(説明文が無いと検索結果に関係の薄い文が出てしまう)
  const description = article.dekJa ?? bodyExcerpt(article.bodyMarkdown);
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

  // この記事の選手: タイトル・本文に日本語名が出てくる選手の選手ページへのリンク(lib/news/player-articles.ts)
  const players = await fetchArticlePlayers(createAdminSupabaseClient(), `${article.headlineJa}\n${article.bodyMarkdown}`);

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
          <>
            {players.length > 0 && (
              <div className="border-t border-line pt-5">
                <h2 className="mb-3 text-sm font-extrabold">この記事の選手（身長・成績・スタッツ）</h2>
                <ul className="flex flex-wrap gap-2">
                  {players.map((p) => (
                    <li key={p.id}>
                      <Link
                        href={`/players/${p.id}`}
                        className="inline-block rounded-lg border border-line px-3 py-1.5 text-sm font-semibold text-blue hover:bg-surface"
                      >
                        {p.nameJa}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <Link href="/news" className="mt-6 inline-block text-sm font-extrabold text-blue">
              ← News一覧に戻る
            </Link>
          </>
        }
      />
    </PageShell>
  );
}
