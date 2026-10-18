"use client";

import { useEffect } from "react";

// Instagram 公式の埋め込みスクリプト(embed.js)を、Instagram の投稿・リールがある記事でだけ読み込む。
// 読み込み済み(別の記事から画面遷移してきた場合・管理画面のプレビューで投稿を追加した場合など)のときは、
// ページ内の未変換の投稿を変換し直す。読み込みに失敗した場合は何もしない(通常のリンクがそのまま残る)。

const SCRIPT_SRC = "https://www.instagram.com/embed.js";

type InstgrmWindow = Window & { instgrm?: { Embeds?: { process: () => void } } };

export function InstagramEmbedLoader({ watch = "" }: { watch?: string }) {
  useEffect(() => {
    const w = window as InstgrmWindow;
    if (w.instgrm?.Embeds) {
      w.instgrm.Embeds.process();
      return;
    }
    if (document.querySelector(`script[src="${SCRIPT_SRC}"]`)) return;
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    document.body.appendChild(script);
  }, [watch]);
  return null;
}
