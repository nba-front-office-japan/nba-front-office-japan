import { notFound } from "next/navigation";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { getNewsArticle } from "@/lib/news-data";

export default async function NewsArticlePage({
  params,
}: PageProps<"/news/[slug]">) {
  const { slug } = await params;
  const article = getNewsArticle(slug);

  if (!article) {
    notFound();
  }

  return (
    <PageShell>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[2fr_1fr]">
        <article className="border border-line bg-surface p-6 sm:p-8">
          <span className="mb-3 inline-block bg-[#fff0d9] px-1.5 py-1 text-[11px] font-extrabold text-[#ac6811]">
            {article.tag}
          </span>
          <div className="mb-3 border border-line bg-[#eaf1ff] p-3 text-xs leading-6 text-[#264c8a] dark:bg-white/[.06]">
            {article.updatedLabel}
            ・このページはNewsデザイン確認用のサンプルコンテンツです。実際の球団・選手の契約状況を報じるものではありません。
          </div>
          <h1 className="mb-2 text-[28px] font-semibold leading-tight sm:text-[31px]">
            {article.title}
          </h1>
          <p className="mb-5 text-sm text-muted">情報元: {article.source}</p>

          {article.sections.map((section) => (
            <div key={section.heading} className="border-t border-line pt-5 first:border-t-0 first:pt-0">
              <h2 className="mb-2 text-lg font-semibold">{section.heading}</h2>
              {section.paragraphs.map((paragraph, i) => (
                <p key={i} className="mb-3 text-sm leading-8 text-foreground/90">
                  {paragraph}
                </p>
              ))}
            </div>
          ))}

          <Link href="/news" className="mt-4 inline-block text-sm font-extrabold text-blue">
            ← News一覧に戻る
          </Link>
        </article>

        <aside>
          <div className="border border-line bg-surface p-6">
            <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">
              Categories
            </p>
            <h2 className="mb-3 text-lg font-semibold">News</h2>
            <p className="whitespace-pre-line text-sm leading-8 text-muted">
              {["Breaking", "Trade Rumors", "Free Agency", "Contract", "Injury", "Analysis"].join(
                "\n"
              )}
            </p>
          </div>
        </aside>
      </div>
    </PageShell>
  );
}
