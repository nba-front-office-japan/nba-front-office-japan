import { ARTICLE_CREDIT, showsArticleCredit } from "@/lib/news/credit";
import type { ArticleKind } from "@/lib/supabase/types";

// ニュース記事・コラム記事の本文と、本文直後のクレジット。
// 公開ページ(/news/[articleId])と管理画面の記事プレビューで同じ表示にするため、この部品を共通で使う。
export function ArticleBody({ bodyMarkdown, articleKind }: { bodyMarkdown: string; articleKind: ArticleKind }) {
  const paragraphs = bodyMarkdown
    // Windows の CRLF 改行でも、空行を段落区切りとして扱う。
    .split(/\r?\n[ \t]*\r?\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const showCredit = showsArticleCredit(articleKind);
  // 本文の末尾にクレジットを手入力している記事もあるため、二重に表示しないよう末尾の同じ一行は除く(保存データは変更しない)
  if (showCredit) {
    const compact = (text: string) => text.replace(/\s+/g, "");
    while (paragraphs.length > 0 && compact(paragraphs[paragraphs.length - 1]) === compact(ARTICLE_CREDIT)) paragraphs.pop();
  }

  return (
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
      {showCredit && (
        <p className="mt-5 text-right text-sm font-semibold text-foreground/80">{ARTICLE_CREDIT}</p>
      )}
    </div>
  );
}
