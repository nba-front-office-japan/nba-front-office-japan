import Link from "next/link";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { fetchPublishedArticles } from "@/lib/news/public-articles";
import {
  CATEGORY_OPTIONS,
  COLUMN_BADGE_CLASS,
  isRumorOrUnverified,
  isSingleSource,
  SINGLE_SOURCE_BADGE_CLASS,
} from "@/lib/news/constants";
import { PageShell } from "@/components/page-shell";

export const dynamic = "force-dynamic";

const CATEGORY_LABEL = Object.fromEntries(
  CATEGORY_OPTIONS.map((o) => [o.value, o.label]),
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

// 検索語の上限(長すぎる入力は切り詰める)
const MAX_QUERY_LENGTH = 100;

// NEWS の記事一覧。右側(スマホでは上)の検索欄から ?q= で、NEWS の公開記事のタイトル・本文を部分一致で絞り込む。
// 検索の対象は NEWS の記事だけ(選手・チーム・ガイドなどほかのページは対象にしない)。空欄のときは通常の一覧。
export default async function NewsPage({ searchParams }: PageProps<"/news">) {
  const { q } = await searchParams;
  const query = (Array.isArray(q) ? q[0] : (q ?? ""))
    .trim()
    .slice(0, MAX_QUERY_LENGTH);
  const supabase = createAdminSupabaseClient();
  const articles = await fetchPublishedArticles(supabase, { query });

  return (
    <PageShell>
      <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">
        Latest Intelligence
      </p>
      {/* 見出しの右横(スマホでは見出しの下に横幅いっぱい)に検索欄 */}
      <div className="mb-2 flex flex-col gap-3 md:flex-row md:items-end md:justify-between md:gap-6">
        <h1 className="text-[36px] font-semibold tracking-tight">News</h1>
        <form role="search" action="/news" method="get" className="w-full md:w-[380px] md:shrink-0">
          <label htmlFor="news-search" className="sr-only">
            NEWS の記事を検索
          </label>
          <div className="flex gap-2">
            <input
              id="news-search"
              type="search"
              name="q"
              defaultValue={query}
              maxLength={MAX_QUERY_LENGTH}
              placeholder="NEWS を検索（タイトル・本文）"
              className="min-h-10 w-full min-w-0 rounded-lg border border-line bg-surface px-3 text-sm"
            />
            <button
              type="submit"
              className="min-h-10 shrink-0 rounded-lg bg-blue px-4 text-sm font-bold text-white transition-colors hover:bg-[#184fcf]"
            >
              検索
            </button>
          </div>
        </form>
      </div>
      <p className="mb-7 text-sm text-muted">
        契約とチーム編成への影響まで解説する分析記事。
      </p>

      <div className="min-w-0">
        {query && (
          <p
            className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm"
            aria-live="polite"
          >
            <span>
              「<b className="break-all">{query}</b>」の検索結果：
              <b>{articles.length}件</b>
            </span>
            <Link
              href="/news"
              className="text-xs font-bold text-blue underline underline-offset-2 hover:no-underline"
            >
              解除
            </Link>
          </p>
        )}
        {articles.length === 0 ? (
          query ? (
            <div className="rounded-xl border border-line bg-surface p-6 text-sm">
              <p className="font-bold">
                「<span className="break-all">{query}</span>
                」に一致する記事はありません。
              </p>
              <p className="mt-2 text-muted">
                別のキーワードで検索するか、検索語を解除してください。
              </p>
              <Link
                href="/news"
                className="mt-3 inline-block font-bold text-blue underline underline-offset-2 hover:no-underline"
              >
                すべての記事を表示 →
              </Link>
            </div>
          ) : (
            <p className="rounded-xl border border-line bg-surface p-6 text-sm text-muted">
              まだ公開されている記事がありません。
            </p>
          )
        ) : (
          <div className="space-y-3">
            {articles.map((article) => {
              const lowConfidence = isRumorOrUnverified(
                article.verificationStatus,
              );
              return (
                <article
                  key={article.id}
                  className="group rounded-xl border border-line bg-surface p-6 transition-all duration-200 hover:-translate-y-1 hover:scale-[1.025] hover:border-blue hover:bg-blue hover:text-white hover:shadow-lg focus-within:-translate-y-1 focus-within:scale-[1.025] focus-within:border-blue focus-within:bg-blue focus-within:text-white focus-within:shadow-lg active:translate-y-1 active:scale-[0.93]"
                >
                  <div className="mb-2 flex flex-wrap gap-2">
                    {/* 自作の解説・コラム記事だけに出す(通常記事には区分ラベルを出さない) */}
                    {article.articleKind === "column" && (
                      <span className={COLUMN_BADGE_CLASS}>COLUMN</span>
                    )}
                    <span className="inline-block bg-[#fff0d9] px-1.5 py-1 text-[11px] font-extrabold text-[#ac6811]">
                      {CATEGORY_LABEL[article.category] ?? article.category}
                    </span>
                    {lowConfidence && (
                      <span className="inline-block bg-[#fde8e8] px-1.5 py-1 text-[11px] font-extrabold text-[#b0392f] dark:bg-red-950 dark:text-red-300">
                        未確定情報
                      </span>
                    )}
                    {!lowConfidence &&
                      isSingleSource(article.verificationStatus) && (
                        <span
                          className={`inline-block ${SINGLE_SOURCE_BADGE_CLASS}`}
                        >
                          単独ソース
                        </span>
                      )}
                  </div>
                  <h2 className="mb-2 text-xl font-semibold">
                    <Link
                      href={`/news/${article.id}`}
                      className="transition-colors group-hover:text-white focus-visible:text-white focus-visible:outline-none focus-visible:underline"
                    >
                      {article.headlineJa}
                    </Link>
                  </h2>
                  {article.dekJa && (
                    <p className="mb-3 text-sm text-muted transition-colors group-hover:text-white/85">{article.dekJa}</p>
                  )}
                  <p className="mb-3 text-xs text-muted transition-colors group-hover:text-white/80">
                    {formatDate(article.publishedAt)}
                  </p>
                  <Link
                    href={`/news/${article.id}`}
                    className="text-sm font-extrabold text-blue transition-all group-hover:translate-x-0.5 group-hover:text-gold"
                  >
                    続きを読む →
                  </Link>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </PageShell>
  );
}
