"use client";

import { useEffect } from "react";

/**
 * iPhone(Safari)は、ページに touchstart の受け口が無いと、押した瞬間の :active 表示(押し込みの動き)を出さない。
 * 何もしない受け口を1つだけ置いて、スマホでもボタン・カードを押したときに反応が見えるようにする。
 */
export function TouchActive() {
  useEffect(() => {
    const noop = () => {};
    document.addEventListener("touchstart", noop, { passive: true });
    return () => document.removeEventListener("touchstart", noop);
  }, []);
  return null;
}
