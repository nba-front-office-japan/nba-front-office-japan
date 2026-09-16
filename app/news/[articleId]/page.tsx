import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { fetchPublishedArticleById } from "@/lib/news/public-articles";
import { CATEGORY_OPTIONS, isRumorOrUnverified } from "@/lib/news/constants";
import { PageShell } from "@/components/page-shell";

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
  const paragraphs = article.bodyMarkdown
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <PageShell>
      <article className="border border-line bg-surface p-6 sm:p-8">
        <div className="mb-3 flex flex-wrap gap-2">
          <span className="inline-block bg-[#fff0d9] px-1.5 py-1 text-[11px] font-extrabold text-[#ac6811]">
            {CATEGORY_LABEL[article.category] ?? article.category}
          </span>
          {lowConfidence && (
            <span className="inline-block bg-[#fde8e8] px-1.5 py-1 text-[11px] font-extrabold text-[#b0392f] dark:bg-red-950 dark:text-red-300">
              未確定情報（噂・未確認）
            </span>
          )}
        </div>

        <h1 className="mb-2 text-[28px] font-semibold leading-tight sm:text-[31px]">
          {article.headlineJa}
        </h1>
        {article.dekJa && <p className="mb-3 text-sm text-muted">{article.dekJa}</p>}
        <p className="mb-6 text-xs text-muted">{formatDate(article.publishedAt)}</p>

        <div className="mb-6">
          {paragraphs.length === 0 ? (
            <p className="text-sm text-muted">本文がありません。</p>
          ) : (
            paragraphs.map((paragraph, i) => (
              <p key={i} className="mb-3 text-sm leading-8 text-foreground/90">
                {paragraph}
              </p>
            ))
          )}
        </div>

        <div className="border-t border-line pt-5">
          <h2 className="mb-2 text-sm font-bold text-muted">情報源</h2>
          {article.sources.length === 0 ? (
            <p className="text-sm text-muted">情報源が登録されていません。</p>
          ) : (
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
          )}
        </div>

        <Link href="/news" className="mt-6 inline-block text-sm font-extrabold text-blue">
          ← News一覧に戻る
        </Link>
      </article>
    </PageShell>
  );
}
