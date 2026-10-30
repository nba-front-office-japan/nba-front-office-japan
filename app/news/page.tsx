import type { Metadata } from "next";
import Link from "next/link";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { fetchPublishedArticles, type PublicArticleSummary } from "@/lib/news/public-articles";
import { CATEGORY_OPTIONS, isRumorOrUnverified, isSingleSource } from "@/lib/news/constants";
import { PageShell } from "@/components/page-shell";
import styles from "./news.module.css";

export const dynamic = "force-dynamic";

const CATEGORY_LABEL = Object.fromEntries(CATEGORY_OPTIONS.map((o) => [o.value, o.label]));

// 検索語の上限(長すぎる入力は切り詰める)
const MAX_QUERY_LENGTH = 100;

// NEWS の記事一覧。検索欄から ?q= で公開記事のタイトル・本文を部分一致で絞り込み、?category= でカテゴリを絞り込む。
// 検索の対象は NEWS の記事だけ(選手・チーム・ガイドなどほかのページは対象にしない)。空欄のときは通常の一覧。
export const metadata: Metadata = {
  title: "NBAニュース・トレード速報 | NBA Front Office Japan",
  description: "NBAのトレード・移籍・契約のニュースを日本語で。情報源と確度を明記して毎日更新しています。",
  alternates: { canonical: "/news" },
};

function getSingle(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function formatDate(value: string | null) {
  if (!value) return "DATE UNKNOWN";
  return new Date(value).toLocaleDateString("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function newsHref(query: string, category?: string) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (category) params.set("category", category);
  const suffix = params.toString();
  return suffix ? `/news?${suffix}` : "/news";
}

// 記事の区分・カテゴリ・確度の表示。未確定情報と単独ソースは、どのデザインの枠でも必ず見えるようにする
function articleLabels(article: PublicArticleSummary): string {
  const labels = [CATEGORY_LABEL[article.category] ?? article.category];
  // 自作の解説・コラム記事だけに出す(通常記事には区分ラベルを出さない)
  if (article.articleKind === "column") labels.unshift("COLUMN");
  if (isRumorOrUnverified(article.verificationStatus)) labels.push("未確定情報");
  else if (isSingleSource(article.verificationStatus)) labels.push("単独ソース");
  return labels.join(" ／ ");
}

export default async function NewsPage({ searchParams }: PageProps<"/news">) {
  const params = await searchParams;
  const query = (getSingle(params.q) ?? "").trim().slice(0, MAX_QUERY_LENGTH);
  const requestedCategory = getSingle(params.category);
  const category = CATEGORY_OPTIONS.some((item) => item.value === requestedCategory) ? requestedCategory : undefined;
  const supabase = createAdminSupabaseClient();
  const allArticles = await fetchPublishedArticles(supabase);
  const articles = query ? await fetchPublishedArticles(supabase, { query }) : allArticles;
  // 公開記事が一件でもあるカテゴリだけをタブに出す。空の分類を並べない。
  const activeCategories = CATEGORY_OPTIONS.filter((item) => allArticles.some((article) => article.category === item.value));
  const filteredArticles = category ? articles.filter((article) => article.category === category) : articles;
  const [leadArticle, ...remainingArticles] = filteredArticles;

  return (
    <PageShell>
      <div className={styles.page}>
        <header className={styles.masthead}>
          <div><p className={styles.kicker}>NBA FRONT OFFICE JAPAN</p><h1>THE<br />BREAK</h1></div>
          <p className={styles.issue}>NEWS THAT MOVES<br />THE LEAGUE.</p>
        </header>

        <section className={styles.controlBar} aria-label="NEWSの絞り込み">
          <form action="/news" method="get" className={styles.searchForm} role="search">
            {category && <input type="hidden" name="category" value={category} />}
            <label htmlFor="news-search">SEARCH THE BREAK</label>
            <div><input id="news-search" name="q" type="search" defaultValue={query} maxLength={MAX_QUERY_LENGTH} placeholder="記事タイトル・本文を検索" /><button type="submit">SEARCH →</button></div>
          </form>
          <nav className={styles.categoryNav} aria-label="記事カテゴリ">
            <Link className={!category ? styles.categoryActive : undefined} href={newsHref(query)}>ALL</Link>
            {activeCategories.map((item) => (
              <Link key={item.value} className={category === item.value ? styles.categoryActive : undefined} href={newsHref(query, item.value)}>
                {item.label}
              </Link>
            ))}
          </nav>
        </section>

        {query && (
          <p className={styles.resultNote} aria-live="polite">
            「{query}」の検索結果：<b>{filteredArticles.length}件</b>
            <Link href={newsHref("", category)}>検索を解除</Link>
          </p>
        )}

        {leadArticle ? (
          <>
            <section className={styles.layout}>
              <article className={styles.leadArticle}>
                <div className={styles.tape}>FEATURED STORY</div>
                <p className={styles.meta}>{articleLabels(leadArticle)} ／ {formatDate(leadArticle.publishedAt)}</p>
                <h2><Link href={`/news/${leadArticle.id}`}>{leadArticle.headlineJa}</Link></h2>
                {leadArticle.dekJa && <p className={styles.leadDek}>{leadArticle.dekJa}</p>}
                <Link className={styles.readButton} href={`/news/${leadArticle.id}`}>READ THE STORY <span>→</span></Link>
              </article>
              <aside className={styles.sideRail}>
                <p>JUST IN</p>
                {remainingArticles.slice(0, 3).map((article) => (
                  <article key={article.id} className={styles.railStory}>
                    <p>{articleLabels(article)}</p>
                    <h3><Link href={`/news/${article.id}`}>{article.headlineJa}</Link></h3>
                    <Link href={`/news/${article.id}`}>READ →</Link>
                  </article>
                ))}
              </aside>
            </section>
            {remainingArticles.length > 3 && (
              <section className={styles.storyGrid} aria-label="NEWS記事一覧">
                {remainingArticles.slice(3).map((article, index) => (
                  <article key={article.id} className={styles.storyCard}>
                    <div className={styles.cardTop}><span>STORY {String(index + 4).padStart(2, "0")}</span><span>{articleLabels(article)}</span></div>
                    <h2><Link href={`/news/${article.id}`}>{article.headlineJa}</Link></h2>
                    {article.dekJa && <p>{article.dekJa}</p>}
                    <footer><time>{formatDate(article.publishedAt)}</time><Link href={`/news/${article.id}`}>OPEN ↗</Link></footer>
                  </article>
                ))}
              </section>
            )}
          </>
        ) : (
          <section className={styles.emptyState}>
            <p>NO STORIES FOUND</p>
            <h2>{query || category ? "条件に一致する公開記事がありません。" : "まだ公開されている記事がありません。"}</h2>
            {(query || category) && <Link href="/news">すべての記事を表示 →</Link>}
          </section>
        )}
        <footer className={styles.zineFooter}>AN INDEPENDENT BASKETBALL MAGAZINE ／ ALL NEWS SEARCHABLE</footer>
      </div>
    </PageShell>
  );
}
