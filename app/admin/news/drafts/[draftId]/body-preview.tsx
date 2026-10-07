"use client";

import type { MouseEventHandler } from "react";
import Link from "next/link";
import { ARTICLE_CREDIT } from "@/lib/news/credit";
import { splitInlineLinks } from "@/lib/news/inline-links";

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
        if (seg.kind === "text") return <span key={i}>{seg.text}</span>;
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

/** 本文の末尾にクレジットを手入力しているか(公開ページでは二重に表示しないよう除かれる) */
export function endsWithCredit(body: string): boolean {
  const paragraphs = body.split(/\r?\n[ \t]*\r?\n/).map((p) => p.trim()).filter(Boolean);
  const compact = (t: string) => t.replace(/\s+/g, "");
  return paragraphs.length > 0 && compact(paragraphs[paragraphs.length - 1]) === compact(ARTICLE_CREDIT);
}
