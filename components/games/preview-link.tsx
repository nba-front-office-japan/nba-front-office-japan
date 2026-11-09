"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { GamePreviewLink } from "@/lib/games/types";

// setTimeout で待てる最長の時間(約24.8日)
const MAX_TIMEOUT_MS = 2 ** 31 - 1;

// 試合プレビュー記事へのリンク(「プレビューを読む」ボタンと記事の見出し)。
// サーバーは試合当日(日本時間)が終わるまでの試合にだけ渡す。ページを開いたまま翌日0:00(日本時間)を過ぎたら、ここで消す。
export function PreviewLink({ preview, className = "" }: { preview: GamePreviewLink; className?: string }) {
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const wait = Date.parse(preview.expiresAt) - Date.now();
    if (wait <= 0) {
      const id = setTimeout(() => setExpired(true), 0);
      return () => clearTimeout(id);
    }
    if (wait > MAX_TIMEOUT_MS) return;
    const id = setTimeout(() => setExpired(true), wait);
    return () => clearTimeout(id);
  }, [preview.expiresAt]);

  if (expired) return null;
  return (
    <div className={`flex min-w-0 items-center gap-2 text-left ${className}`}>
      <Link
        href={`/news/${preview.articleId}`}
        className="selection-button selection-gold np-ink-navy shrink-0 border-2 border-[var(--np-navy)] px-2.5 py-1 text-[11px] font-extrabold sm:text-xs"
      >
        プレビューを読む
      </Link>
      <Link href={`/news/${preview.articleId}`} className="min-w-0 text-[12px] font-bold leading-snug text-foreground hover:text-blue hover:underline sm:text-[13px]">
        {preview.headline}
      </Link>
    </div>
  );
}
