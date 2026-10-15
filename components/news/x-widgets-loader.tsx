"use client";

import { useEffect } from "react";

// X公式の埋め込みスクリプト(widgets.js)を、Xポストがある記事でだけ読み込む。
// 読み込み済み(別の記事から画面遷移してきた場合など)のときは、ページ内の未変換のポストを変換し直す。
// 読み込みに失敗した場合や、ポストが削除・非公開の場合は何もしない(通常のリンクがそのまま残る)。

const SCRIPT_SRC = "https://platform.twitter.com/widgets.js";

type TwttrWindow = Window & { twttr?: { widgets?: { load: (el?: Element) => void } } };

// watch(表示中のXポストの URL を並べた文字列)が変わったときは、新しく出たポストを変換し直す
// (管理画面のプレビューで、入力中にポストを追加した場合など)。
export function XWidgetsLoader({ watch = "" }: { watch?: string }) {
  useEffect(() => {
    const w = window as TwttrWindow;
    if (w.twttr?.widgets) {
      w.twttr.widgets.load();
      return;
    }
    if (document.querySelector(`script[src="${SCRIPT_SRC}"]`)) return;
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.charset = "utf-8";
    document.body.appendChild(script);
  }, [watch]);
  return null;
}
