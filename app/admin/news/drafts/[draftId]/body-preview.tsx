"use client";

import type { MouseEventHandler } from "react";
import Link from "next/link";
import { ARTICLE_CREDIT } from "@/lib/news/credit";
import { splitInlineLinks } from "@/lib/news/inline-links";
import { bodyMediaOf, markerUrlOf } from "@/lib/news/body-media";
import { parseRelatedMediaUrl } from "@/lib/news/related-media";

// 本文入力欄とプレビューで共通の文字組み。
// 同じ画面幅なら手入力の改行も自動の折り返しも同じ位置になるよう、幅・余白・フォント・文字サイズ・太さ・
// 文字間隔・行間・改行の扱いをここで揃える(フォントはどちらも本文と同じ body のフォントを引き継ぐ)。
// 入力欄はスクロールバーで幅が変わらないよう、内容に合わせて高さを伸ばす(body-editor.tsx)。
export const BODY_TEXT_CLASS =
  "box-border block w-full border border-line px-3 py-2 text-base font-normal not-italic leading-8 tracking-normal whitespace-pre-wrap break-words [tab-size:4] [word-break:normal] [line-break:auto]";

// リンクの見た目(太さを変えると折り返し位置が変わるため、太字にはしない)
const LINK_CLASS = "text-blue underline decoration-blue/40 underline-offset-2 hover:decoration-blue";

/**
 * 管理画面のプレビュー用の本文。入力欄の文字をそのまま(改行も同じ位置で)表示し、
 * [文字](URL) の部分だけを公開ページと同じ開き方のリンクにする。段落ごとの余白などは加えない。
 * ※ 入力欄では [文字](URL) と表示されるため、リンクを含む行だけは、URLの分だけ折り返し位置が入力欄と異なる。
 */
export function BodyPreview({ body, onInternalLinkClick }: { body: string; onInternalLinkClick?: MouseEventHandler<HTMLAnchorElement> }) {
  // 末尾が改行だけの場合も入力欄と同じく空行を1行分表示する
  const text = body.endsWith("\n") ? `${body}\u200b` : body;
  return (
    <div className={`relative ${BODY_TEXT_CLASS}`}>
      {splitInlineLinks(text).map((seg, i) => {
        if (seg.kind === "text") return <MediaMarkedText key={i} text={seg.text} />;
        if (seg.external) {
          return (
            <a key={i} href={seg.href} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
              {seg.text}
              <span aria-hidden>↗</span>
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
    </div>
  );
}

// 本文中のメディア([[media:URL]])。入力欄と折り返し位置が変わらないよう、文字はそのままで背景色だけを付ける
const MEDIA_MARKER_RE = /(\[\[media:[^\s[\]]+\]\])/;

function isUsableMarker(marker: string): boolean {
  const url = markerUrlOf(marker);
  const media = url ? parseRelatedMediaUrl(url) : null;
  return Boolean(media && media.url === url);
}

function MediaMarkedText({ text }: { text: string }) {
  return (
    <>
      {text.split(MEDIA_MARKER_RE).map((part, i) =>
        i % 2 === 1 ? (
          // 使えない URL の場合は赤くし、保存時にエラーになることを示す
          isUsableMarker(part) ? (
            <mark key={i} className="bg-[#fff0d9] text-foreground dark:bg-[#5a4320]" title="公開ページでは、この位置にXポスト・YouTube動画が表示されます">
              {part}
            </mark>
          ) : (
            <mark key={i} className="bg-[#fde8e8] text-[#b0392f] dark:bg-red-950 dark:text-red-300" title="使えないURLです(保存時にエラーになります)">
              {part}
            </mark>
          )
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

/** 本文中で埋め込まれるメディアの一覧(プレビューの下に表示する) */
export function BodyMediaList({ body }: { body: string }) {
  const media = bodyMediaOf(body);
  if (media.length === 0) return null;
  return (
    <div className="mt-3 border border-line p-3 text-xs">
      <p className="mb-1 font-bold">本文中のメディア（{media.length}件・公開ページでは色付きの行の位置に表示）</p>
      <ol className="list-decimal space-y-0.5 pl-5 text-muted">
        {media.map((m) => (
          <li key={m.url} className="break-all">
            {m.kind === "x" ? `Xポスト（@${m.user}）` : m.shorts ? "YouTube Shorts" : "YouTube動画"}：{m.url}
          </li>
        ))}
      </ol>
    </div>
  );
}

/** 本文の末尾にクレジットを手入力しているか(公開ページでは二重に表示しないよう除かれる) */
export function endsWithCredit(body: string): boolean {
  const paragraphs = body.split(/\r?\n[ \t]*\r?\n/).map((p) => p.trim()).filter(Boolean);
  const compact = (t: string) => t.replace(/\s+/g, "");
  return paragraphs.length > 0 && compact(paragraphs[paragraphs.length - 1]) === compact(ARTICLE_CREDIT);
}
