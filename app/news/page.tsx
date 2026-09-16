import Link from "next/link";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { fetchPublishedArticles } from "@/lib/news/public-articles";
import {
  CATEGORY_OPTIONS,
  isRumorOrUnverified,
  isSingleSource,
  SINGLE_SOURCE_BADGE_CLASS,
} from "@/lib/news/constants";
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

export default async function NewsPage() {
  const supabase = createAdminSupabaseClient();
  const articles = await fetchPublishedArticles(supabase);

  return (
    <PageShell>
      <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">
        Latest Intelligence
      </p>
      <h1 className="mb-2 text-[36px] font-semibold tracking-tight">News</h1>
      <p className="mb-7 text-sm text-muted">
        契約とチーム編成への影響まで解説する分析記事。
      </p>

      {articles.length === 0 ? (
        <p className="border border-line bg-surface p-6 text-sm text-muted">
          まだ公開されている記事がありません。
        </p>
      ) : (
        <div className="space-y-3">
          {articles.map((article) => {
            const lowConfidence = isRumorOrUnverified(article.verificationStatus);
            return (
              <article
                key={article.id}
                className="border border-line bg-surface p-6"
              >
                <div className="mb-2 flex flex-wrap gap-2">
                  <span className="inline-block bg-[#fff0d9] px-1.5 py-1 text-[11px] font-extrabold text-[#ac6811]">
                    {CATEGORY_LABEL[article.category] ?? article.category}
                  </span>
                  {lowConfidence && (
                    <span className="inline-block bg-[#fde8e8] px-1.5 py-1 text-[11px] font-extrabold text-[#b0392f] dark:bg-red-950 dark:text-red-300">
                      未確定情報
                    </span>
                  )}
                  {!lowConfidence && isSingleSource(article.verificationStatus) && (
                    <span className={`inline-block ${SINGLE_SOURCE_BADGE_CLASS}`}>
                      単独ソース
                    </span>
                  )}
                </div>
                <h2 className="mb-2 text-xl font-semibold">
                  <Link href={`/news/${article.id}`} className="hover:underline">
                    {article.headlineJa}
                  </Link>
                </h2>
                {article.dekJa && (
                  <p className="mb-3 text-sm text-muted">{article.dekJa}</p>
                )}
                <p className="mb-3 text-xs text-muted">
                  {formatDate(article.publishedAt)}
                </p>
                <Link
                  href={`/news/${article.id}`}
                  className="text-sm font-extrabold text-blue"
                >
                  続きを読む →
                </Link>
              </article>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
