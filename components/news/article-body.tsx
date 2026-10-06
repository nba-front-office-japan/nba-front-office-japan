import type { MouseEventHandler } from "react";
import Link from "next/link";
import { ARTICLE_CREDIT, showsArticleCredit } from "@/lib/news/credit";
import { splitInlineLinks } from "@/lib/news/inline-links";
import type { ArticleKind } from "@/lib/supabase/types";

const LINK_CLASS = "font-semibold text-blue underline decoration-blue/40 underline-offset-2 hover:decoration-blue";

// 段落の中の [文字](URL) を、選択した文字だけのリンクにする(それ以外は文字のまま)。
// 内部リンクは同じタブ、外部リンクは別タブ(rel="noopener noreferrer")で開く。
function ParagraphText({ text, onInternalLinkClick }: { text: string; onInternalLinkClick?: MouseEventHandler<HTMLAnchorElement> }) {
  return (
    <>
      {splitInlineLinks(text).map((seg, i) => {
        if (seg.kind === "text") return <span key={i}>{seg.text}</span>;
        if (seg.external) {
          return (
            <a key={i} href={seg.href} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
              {seg.text}
              <span aria-hidden className="ml-0.5 text-[0.85em]">
                ↗
              </span>
              <span className="sr-only">（別タブで開きます）</span>
            </a>
          );
        }
        return (
          <Link key={i} href={seg.href} className={LINK_CLASS} onClick={onInternalLinkClick}>
            {seg.text}
          </Link>
        );
      })}
    </>
  );
}

// ニュース記事・コラム記事の本文と、本文直後のクレジット。
// 公開ページ(/news/[articleId])と管理画面の記事プレビューで同じ表示にするため、この部品を共通で使う。
// onInternalLinkClick は管理画面のプレビュー用(未保存の変更があるときに、内部リンクで画面を離れる前に確認する)。
export function ArticleBody({
  bodyMarkdown,
  articleKind,
  onInternalLinkClick,
}: {
  bodyMarkdown: string;
  articleKind: ArticleKind;
  onInternalLinkClick?: MouseEventHandler<HTMLAnchorElement>;
}) {
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
            <ParagraphText text={paragraph} onInternalLinkClick={onInternalLinkClick} />
          </p>
        ))
      )}
      {showCredit && (
        <p className="mt-5 text-right text-sm font-semibold text-foreground/80">{ARTICLE_CREDIT}</p>
      )}
    </div>
  );
}
