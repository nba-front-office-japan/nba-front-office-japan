import type { MouseEventHandler, ReactNode } from "react";
import { COLUMN_BADGE_CLASS, SINGLE_SOURCE_BADGE_CLASS } from "@/lib/news/constants";
import type { RelatedMedia } from "@/lib/news/related-media";
import type { ArticleKind } from "@/lib/supabase/types";
import { ArticleBody } from "./article-body";
import { RelatedMediaSection } from "./related-media";

// ニュース記事の表示(記事の枠・ラベル・見出し・サブ見出し・日付・本文・関連メディア・情報源)。
// 公開ページ(/news/[articleId])と、管理画面の記事下書きのプレビューで同じ部品を使い、文字組み・段落の余白・
// 本文中メディアの表示を一致させる。プレビューは公開ページの本文欄と同じ幅の枠(ARTICLE_PAGE_FRAME_CLASS)の中に置く。

/** 公開ページの本文欄の枠(components/page-shell.tsx の main と同じ横幅・左右の余白) */
export const ARTICLE_PAGE_FRAME_CLASS = "mx-auto w-full max-w-6xl px-4 sm:px-7";

export type ArticleViewSource = { title: string; url: string; mediaName: string };

/** 記事の日付の表示(日本時間。例: 2026年10月16日) */
export function formatArticleDate(iso: string | null): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo", year: "numeric", month: "short", day: "numeric" });
}

export function NewsArticleView({
  articleKind,
  categoryLabel,
  lowConfidence,
  singleSource,
  headline,
  dek,
  dateLabel,
  bodyMarkdown,
  trailingMedia,
  sources,
  footer,
  onInternalLinkClick,
}: {
  articleKind: ArticleKind;
  /** カテゴリのラベル(分からない場合は null で、ラベルを出さない) */
  categoryLabel: string | null;
  lowConfidence: boolean;
  singleSource: boolean;
  headline: string;
  dek: string | null;
  dateLabel: string;
  bodyMarkdown: string;
  /** 本文末の関連メディア(本文中に入れたものを除いたもの) */
  trailingMedia: RelatedMedia[];
  sources: ArticleViewSource[];
  footer?: ReactNode;
  /** 管理画面のプレビュー用(未保存の変更があるときに、本文の内部リンクで画面を離れる前に確認する) */
  onInternalLinkClick?: MouseEventHandler<HTMLAnchorElement>;
}) {
  return (
    <article className="border border-line bg-surface p-6 sm:p-8">
      <div className="mb-3 flex flex-wrap gap-2">
        {/* 自作の解説・コラム記事だけに出す(通常記事には区分ラベルを出さない) */}
        {articleKind === "column" && <span className={COLUMN_BADGE_CLASS}>COLUMN</span>}
        {categoryLabel && (
          <span className="inline-block bg-[#fff0d9] px-1.5 py-1 text-[11px] font-extrabold text-[#ac6811]">{categoryLabel}</span>
        )}
        {lowConfidence && (
          <span className="inline-block bg-[#fde8e8] px-1.5 py-1 text-[11px] font-extrabold text-[#b0392f] dark:bg-red-950 dark:text-red-300">
            未確定情報（噂・未確認）
          </span>
        )}
        {!lowConfidence && singleSource && <span className={`inline-block ${SINGLE_SOURCE_BADGE_CLASS}`}>単独ソース</span>}
      </div>

      <h1 className="mb-2 text-[28px] font-semibold leading-tight sm:text-[31px]">{headline}</h1>
      {dek && <p className="mb-3 text-sm text-muted">{dek}</p>}
      <p className="mb-6 text-xs text-muted">{dateLabel}</p>

      {/* 本文の直後に「構成●NBA Front Office Japan編集部」を自動で表示する(情報源・関連リンクより前) */}
      <ArticleBody bodyMarkdown={bodyMarkdown} articleKind={articleKind} onInternalLinkClick={onInternalLinkClick} />

      {/* 関連メディア(Xポスト・YouTube動画)。本文中に入れたものは除いて表示し、登録がない記事では何も表示しない */}
      <RelatedMediaSection media={trailingMedia} />

      {/* 情報源が登録されていない記事(独自コラムなど)では、「情報源」欄そのものを表示しない */}
      {sources.length > 0 && (
        <div className="border-t border-line pt-5">
          <h2 className="mb-2 text-sm font-bold text-muted">情報源</h2>
          <ul className="space-y-1.5 text-sm">
            {sources.map((source, i) => (
              <li key={i}>
                <a href={source.url} target="_blank" rel="noreferrer noopener" className="font-semibold text-blue hover:underline">
                  {source.title}
                </a>
                <span className="text-muted"> ・ {source.mediaName}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {footer}
    </article>
  );
}
