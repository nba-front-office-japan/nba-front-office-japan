import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { fetchPublishedArticleById } from "@/lib/news/public-articles";
import {
  CATEGORY_OPTIONS,
  COLUMN_BADGE_CLASS,
  isRumorOrUnverified,
  isSingleSource,
  SINGLE_SOURCE_BADGE_CLASS,
} from "@/lib/news/constants";
import { PageShell } from "@/components/page-shell";
import { ArticleBody } from "@/components/news/article-body";

export const dynamic = "force-dynamic";

const CATEGORY_LABEL = Object.fromEntries(
  CATEGORY_OPTIONS.map((o) => [o.value, o.label])
);

function formatDate(iso: string | null): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function NewsArticlePage({
  params,
}: PageProps<"/news/[articleId]">) {
  const { articleId } = await params;
  const supabase = createAdminSupabaseClient();
  const article = await fetchPublishedArticleById(supabase, articleId);

  if (!article) {
    notFound();
  }

  const lowConfidence = isRumorOrUnverified(article.verificationStatus);
  return (
    <PageShell>
      <article className="border border-line bg-surface p-6 sm:p-8">
        <div className="mb-3 flex flex-wrap gap-2">
          {/* 自作の解説・コラム記事だけに出す(通常記事には区分ラベルを出さない) */}
          {article.articleKind === "column" && (
            <span className={COLUMN_BADGE_CLASS}>COLUMN</span>
          )}
          <span className="inline-block bg-[#fff0d9] px-1.5 py-1 text-[11px] font-extrabold text-[#ac6811]">
            {CATEGORY_LABEL[article.category] ?? article.category}
          </span>
          {lowConfidence && (
            <span className="inline-block bg-[#fde8e8] px-1.5 py-1 text-[11px] font-extrabold text-[#b0392f] dark:bg-red-950 dark:text-red-300">
              未確定情報（噂・未確認）
            </span>
          )}
          {!lowConfidence && isSingleSource(article.verificationStatus) && (
            <span className={`inline-block ${SINGLE_SOURCE_BADGE_CLASS}`}>
              単独ソース
            </span>
          )}
        </div>

        <h1 className="mb-2 text-[28px] font-semibold leading-tight sm:text-[31px]">
          {article.headlineJa}
        </h1>
        {article.dekJa && <p className="mb-3 text-sm text-muted">{article.dekJa}</p>}
        <p className="mb-6 text-xs text-muted">{formatDate(article.publishedAt)}</p>

        {/* 本文の直後に「構成●NBA Front Office Japan編集部」を自動で表示する(情報源・関連リンクより前) */}
        <ArticleBody bodyMarkdown={article.bodyMarkdown} articleKind={article.articleKind} />

        {/* 情報源が登録されていない記事(独自コラムなど)では、「情報源」欄そのものを表示しない */}
        {article.sources.length > 0 && (
          <div className="border-t border-line pt-5">
            <h2 className="mb-2 text-sm font-bold text-muted">情報源</h2>
            <ul className="space-y-1.5 text-sm">
              {article.sources.map((source, i) => (
                <li key={i}>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="font-semibold text-blue hover:underline"
                  >
                    {source.title}
                  </a>
                  <span className="text-muted"> ・ {source.mediaName}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <Link href="/news" className="mt-6 inline-block text-sm font-extrabold text-blue">
          ← News一覧に戻る
        </Link>
      </article>
    </PageShell>
  );
}
