import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { NEWS_ARTICLES } from "@/lib/news-data";

const CATEGORIES = [
  "Breaking",
  "Trade Rumors",
  "Free Agency",
  "Contract",
  "Injury",
  "Analysis",
];

export default function NewsPage() {
  return (
    <PageShell>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[2fr_1fr]">
        <div>
          <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">
            Latest Intelligence
          </p>
          <h1 className="mb-2 text-[36px] font-semibold tracking-tight">News</h1>
          <p className="mb-7 text-sm text-muted">
            契約とチーム編成への影響まで解説する分析記事。
          </p>

          <div className="mb-4 border border-line bg-[#eaf1ff] p-4 text-[13px] leading-6 text-[#264c8a] dark:bg-white/[.06]">
            以下はNewsページのデザイン確認用サンプル記事です。実際の球団・選手の契約状況を報じるものではありません。
          </div>

          <div className="space-y-3">
            {NEWS_ARTICLES.map((article) => (
              <article
                key={article.slug}
                className="border border-line bg-surface p-6"
              >
                <span className="mb-2 inline-block bg-[#fff0d9] px-1.5 py-1 text-[11px] font-extrabold text-[#ac6811]">
                  {article.tag}
                </span>
                <h2 className="mb-2 text-xl font-semibold">{article.title}</h2>
                <p className="mb-3 text-sm text-muted">{article.summary}</p>
                <Link
                  href={`/news/${article.slug}`}
                  className="border-0 bg-transparent text-sm font-extrabold text-blue"
                >
                  続きを読む →
                </Link>
              </article>
            ))}
          </div>
        </div>

        <aside className="space-y-5">
          <div className="border border-line bg-surface p-6">
            <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">
              Categories
            </p>
            <h2 className="mb-3 text-lg font-semibold">News</h2>
            <p className="whitespace-pre-line text-sm leading-8 text-muted">
              {CATEGORIES.join("\n")}
            </p>
          </div>
          <div className="border border-line bg-surface p-6">
            <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">
              Sample Articles
            </p>
            {NEWS_ARTICLES.map((article) => (
              <div key={article.slug} className="mb-3 last:mb-0">
                <Link
                  href={`/news/${article.slug}`}
                  className="text-sm font-bold hover:text-blue"
                >
                  {article.title}
                </Link>
                <p className="text-xs text-muted">{article.updatedLabel}</p>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </PageShell>
  );
}
