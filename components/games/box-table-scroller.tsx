"use client";

import { useEffect, useRef, type ReactNode } from "react";

// ボックススコア表の枠(横スクロール)と、下へスクロールしたときに画面上端へ固定する見出し行(選手名・分・点…)。
// 表は横スクロールの枠の中にあるため、CSS の sticky では画面上端に固定できない(枠がスクロールの基準になる)。
// そこで見出し行の複製を画面上端に重ねて出し、列の幅と横スクロール位置を本物の表に合わせる。
// 複製は読み上げ対象外(aria-hidden)。表が画面の上端を通り過ぎている間だけ表示する。
export function BoxTableScroller({
  frameClassName,
  tableClassName,
  head,
  children,
}: {
  frameClassName: string;
  tableClassName: string;
  /** 見出し行(<tr>…</tr>)。本物の <thead> と固定表示の両方に使う */
  head: ReactNode;
  /** <tbody> / <tfoot> */
  children: ReactNode;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const floatRef = useRef<HTMLDivElement>(null);
  const floatTableRef = useRef<HTMLTableElement>(null);

  useEffect(() => {
    const frame = frameRef.current;
    const table = tableRef.current;
    const float = floatRef.current;
    const floatTable = floatTableRef.current;
    if (!frame || !table || !float || !floatTable) return;
    const realHead = table.tHead;
    if (!realHead) return;

    let frameId = 0;

    // 列の幅を本物の表に合わせる
    const syncWidths = () => {
      floatTable.style.width = `${table.offsetWidth}px`;
      const src = realHead.rows[0]?.cells;
      const dst = floatTable.tHead?.rows[0]?.cells;
      if (!src || !dst) return;
      for (let i = 0; i < src.length && i < dst.length; i++) {
        const w = `${src[i].getBoundingClientRect().width}px`;
        dst[i].style.width = w;
        dst[i].style.minWidth = w;
        dst[i].style.maxWidth = w;
      }
    };

    // 表示するか・位置・横スクロール位置を更新する
    const update = () => {
      frameId = 0;
      const rect = frame.getBoundingClientRect();
      const headH = realHead.offsetHeight;
      // 見出しが画面の上に隠れていて、表の残り(見出し1行分より下)がまだ画面にあるときだけ出す
      const visible = rect.width > 0 && rect.top < 0 && rect.bottom > headH * 2;
      if (!visible) {
        if (float.style.display !== "none") float.style.display = "none";
        return;
      }
      if (float.style.display === "none") {
        float.style.display = "block";
        syncWidths();
      }
      // 表の終わりが近づいたら、固定見出しも一緒に上へ押し出す
      const top = Math.min(0, rect.bottom - headH * 2);
      float.style.top = `${top}px`;
      float.style.left = `${rect.left + frame.clientLeft}px`;
      float.style.width = `${frame.clientWidth}px`;
      float.scrollLeft = frame.scrollLeft;
    };

    const schedule = () => {
      if (!frameId) frameId = requestAnimationFrame(update);
    };
    const onResize = () => {
      syncWidths();
      schedule();
    };

    const ro = new ResizeObserver(onResize);
    ro.observe(table);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", onResize);
    frame.addEventListener("scroll", schedule, { passive: true });
    syncWidths();
    update();

    return () => {
      if (frameId) cancelAnimationFrame(frameId);
      ro.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", onResize);
      frame.removeEventListener("scroll", schedule);
    };
  }, []);

  return (
    <>
      <div ref={frameRef} className={frameClassName}>
        <table ref={tableRef} className={tableClassName}>
          <thead>{head}</thead>
          {children}
        </table>
      </div>
      <div ref={floatRef} aria-hidden className="box-float-head" style={{ display: "none" }}>
        <table ref={floatTableRef} className={`${tableClassName} table-fixed`}>
          <thead>{head}</thead>
        </table>
      </div>
    </>
  );
}
