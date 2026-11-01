"use client";

import { useLayoutEffect } from "react";

const HISTORY_STATE_KEY = "newsListScrollY";
const SAVE_DELAY_MS = 150;

// 記事から「戻る」で一覧へ帰ったときに、元のスクロール位置へ戻す(表示は何も出さない)。
// 一覧のデータが手元に残っていないと、再取得の間は記事が表示されたままになる。記事を最後まで読んでいると
// フッターを基準に位置が保たれ、一覧に切り替わった瞬間に一番下へ飛んでしまうため、位置を履歴ごとに控えて戻す。
// タブやヘッダーのリンクで開いた一覧は新しい履歴なので控えがなく、通常どおり一番上から表示する。
export function NewsScrollRestore() {
  useLayoutEffect(() => {
    const savedY: unknown = window.history.state?.[HISTORY_STATE_KEY];
    if (typeof savedY === "number") window.scrollTo(0, savedY);

    let timer: ReturnType<typeof setTimeout> | undefined;
    const save = () => {
      clearTimeout(timer);
      // 履歴の移動中は別ページの履歴を指していることがあるので、一覧のときだけ控える
      if (window.location.pathname !== "/news") return;
      window.history.replaceState({ ...window.history.state, [HISTORY_STATE_KEY]: window.scrollY }, "");
    };
    const saveLater = () => {
      clearTimeout(timer);
      timer = setTimeout(save, SAVE_DELAY_MS);
    };

    window.addEventListener("scroll", saveLater, { passive: true });
    // スクロールの直後に記事を開いても控え損ねないよう、クリックの時点でも控える(ページ移動より先に動かす)
    document.addEventListener("click", save, true);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", saveLater);
      document.removeEventListener("click", save, true);
    };
  }, []);

  return null;
}
