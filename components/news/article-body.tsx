import { Fragment, type MouseEventHandler } from "react";
import Link from "next/link";
import { ARTICLE_CREDIT, showsArticleCredit } from "@/lib/news/credit";
import { splitInlineLinks } from "@/lib/news/inline-links";
import { formatLines } from "@/lib/news/inline-format";
import { toBodySegments } from "@/lib/news/body-media";
import { ARTICLE_BODY_TEXT_CLASS } from "@/lib/news/body-typography";
import { MediaEmbed, MediaScriptLoaders } from "./related-media";
import type { ArticleKind } from "@/lib/supabase/types";

const LINK_CLASS = "font-semibold text-blue underline decoration-blue/40 underline-offset-2 hover:decoration-blue";

// 本文の [文字](URL) を、選択した文字だけのリンクにする(それ以外は文字のまま)。
// 内部リンクは同じタブ、外部リンクは別タブ(rel="noopener noreferrer")で開く。
function LinkedText({ text, onInternalLinkClick }: { text: string; onInternalLinkClick?: MouseEventHandler<HTMLAnchorElement> }) {
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

// 本文の文字の部分。改行・空白は入力したとおりに表示し、行の先頭の「## 」の行を見出し、**文字** を太字にする
// (lib/news/inline-format.ts)。見出しも行の高さは本文と同じにし、段落の間隔(空行)を入力欄とそろえる。
function ParagraphText({ text, onInternalLinkClick }: { text: string; onInternalLinkClick?: MouseEventHandler<HTMLAnchorElement> }) {
  const lines = formatLines(text);
  return (
    <>
      {lines.map((line, i) => {
        const inline = line.parts.map((part, j) =>
          part.bold ? (
            <strong key={j} className="font-bold text-foreground">
              <LinkedText text={part.text} onInternalLinkClick={onInternalLinkClick} />
            </strong>
          ) : (
            <LinkedText key={j} text={part.text} onInternalLinkClick={onInternalLinkClick} />
          )
        );
        return (
          <Fragment key={i}>
            {line.heading ? (
              <strong role="heading" aria-level={2} className="text-[1.125rem] font-extrabold text-foreground">
                {inline}
              </strong>
            ) : (
              inline
            )}
            {i < lines.length - 1 && "\n"}
          </Fragment>
        );
      })}
    </>
  );
}

// ニュース記事・コラム記事の本文と、本文直後のクレジット。
// 本文は、管理画面の本文の入力欄と同じ文字組み(ARTICLE_BODY_TEXT_CLASS)で、改行・空行を入力したとおりに表示する。
// そのため同じ画面幅なら、入力欄・プレビュー・公開ページで本文の折り返し位置と段落(空行)の間隔が一致する。
// 本文中の [[media:URL]] だけの段落(管理画面の「メディア挿入」で入れたもの)は、その位置にX・YouTube・Instagram・TikTokを埋め込む
// (対応する URL のものだけ。それ以外は文字のまま。lib/news/body-media.ts)。
// [[video:URL]] だけの段落(「メディア挿入」でアップロードした MP4)は、その位置に動画を表示する(lib/news/body-video.ts)。
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
  const showCredit = showsArticleCredit(articleKind);
  // 本文の末尾にクレジットを手入力している記事もあるため、二重に表示しないよう末尾の同じ一行は除く(保存データは変更しない)
  const segments = toBodySegments(bodyMarkdown, showCredit ? ARTICLE_CREDIT : null);
  const bodyMedia = segments.flatMap((s) => (s.kind === "media" ? [s.media] : []));

  return (
    <div className="mb-6 min-w-0">
      {segments.length === 0 ? (
        <p className="text-sm text-muted">本文がありません。</p>
      ) : (
        segments.map((segment, i) =>
          segment.kind === "media" ? (
            // メディアは URL を key にする(widgets.js が書き換えた要素を、入力中の再描画で React が作り直さないように)。
            // 上下の余白(32px)は、入力欄でメディアの行の前後に入る空行1行分
            <div key={`media:${segment.media.url}`} className="my-8">
              <MediaEmbed media={segment.media} />
            </div>
          ) : segment.kind === "video" ? (
            // アップロードした MP4 動画。ブラウザ標準の操作(再生/停止・音量・全画面)を出し、幅は本文いっぱい。
            // 縦長の動画が画面より高くならないよう高さは画面の8割まで(余白は黒)。読み込むのは長さなどの情報だけ(preload="metadata")
            <div key={`video:${segment.url}`} className="my-8">
              <video
                src={segment.url}
                controls
                preload="metadata"
                playsInline
                className="block h-auto max-h-[80vh] w-full bg-black object-contain"
              >
                お使いのブラウザでは動画を再生できません。
              </video>
            </div>
          ) : (
            <div key={i} className={`${ARTICLE_BODY_TEXT_CLASS} text-foreground/90`}>
              <ParagraphText text={segment.text} onInternalLinkClick={onInternalLinkClick} />
            </div>
          )
        )
      )}
      <MediaScriptLoaders media={bodyMedia} />
      {showCredit && (
        <p className="mt-5 text-right text-sm font-semibold text-foreground/80">{ARTICLE_CREDIT}</p>
      )}
    </div>
  );
}
