"use client";

import { useEffect, useRef, type ReactNode } from "react";

// スタッツ表の枠(横スクロール)と、下へスクロールしたときに画面上端へ固定する見出し行。
// 表は横スクロール(overflow-x-auto)の枠の中にあるため、CSS の sticky では画面上端に固定できない
// (枠がスクロールの基準になり、ページのスクロールでは見出しが止まらない)。
// そこで見出し(<thead>)の複製を画面上端に重ねて出し、列の幅と横スクロール位置を本物の表に合わせる。
// ・表の中身(並べ替え・切り替え)が変わったら複製を作り直す
// ・複製の見出しをクリックしたら、本物の見出し(並べ替えのボタン・リンク)をクリックしたことにする
// ・複製は読み上げ対象外(aria-hidden)。表が画面の上端を通り過ぎている間だけ表示する
// 試合詳細の Box Score は components/games/box-table-scroller.tsx が同じことをしている。
export function StickyTableFrame({ className, children }: { className: string; children: ReactNode }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const floatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const frame = frameRef.current;
    const float = floatRef.current;
    if (!frame || !float) return;

    let table: HTMLTableElement | null = null;
    let realHead: HTMLTableSectionElement | null = null;
    let floatTable: HTMLTableElement | null = null;
    let lastHtml = "";
    let frameId = 0;
    let rebuildId = 0;

    // 本物の見出しを複製し直す(中身が変わっていなければ何もしない)
    const rebuild = () => {
      rebuildId = 0;
      table = frame.querySelector("table");
      realHead = table?.tHead ?? null;
      if (!table || !realHead) {
        float.replaceChildren();
        floatTable = null;
        lastHtml = "";
        return;
      }
      const html = `${table.className}|${realHead.outerHTML}`;
      if (html === lastHtml && floatTable) return;
      lastHtml = html;
      const t = document.createElement("table");
      t.className = `${table.className} table-fixed`;
      t.appendChild(realHead.cloneNode(true));
      // 複製の中のリンク・ボタンはキーボードで止まらないようにする(操作は本物へ渡す)
      t.querySelectorAll<HTMLElement>("a, button, [tabindex]").forEach((el) => el.setAttribute("tabindex", "-1"));
      float.replaceChildren(t);
      floatTable = t;
      syncWidths();
      update();
    };

    // 列の幅を本物の表に合わせる
    const syncWidths = () => {
      if (!table || !realHead || !floatTable) return;
      floatTable.style.width = `${table.offsetWidth}px`;
      floatTable.style.minWidth = `${table.offsetWidth}px`;
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
      if (!table || !realHead || !floatTable) {
        float.style.display = "none";
        return;
      }
      const rect = frame.getBoundingClientRect();
      const headH = realHead.offsetHeight;
      // 見出しが画面の上に隠れていて、表の残り(見出し2行分より下)がまだ画面にあるときだけ出す
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
    const scheduleRebuild = () => {
      if (!rebuildId) rebuildId = requestAnimationFrame(rebuild);
    };
    const onResize = () => {
      syncWidths();
      schedule();
    };

    // 複製の見出しのクリック → 同じ位置の本物の見出し(中のリンク・ボタン、無ければセル)をクリック
    const onFloatClick = (e: MouseEvent) => {
      const cell = (e.target as HTMLElement).closest("th, td");
      if (!cell || !realHead || !floatTable?.tHead) return;
      const rowIndex = Array.from(floatTable.tHead.rows).indexOf(cell.parentElement as HTMLTableRowElement);
      const realCell = realHead.rows[rowIndex]?.cells[(cell as HTMLTableCellElement).cellIndex];
      if (!realCell) return;
      e.preventDefault();
      const target = realCell.querySelector<HTMLElement>("a, button") ?? realCell;
      target.click();
    };

    const ro = new ResizeObserver(onResize);
    ro.observe(frame);
    const mo = new MutationObserver(() => {
      scheduleRebuild();
      if (table) ro.observe(table);
    });
    mo.observe(frame, { childList: true, subtree: true, characterData: true, attributes: true });
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", onResize);
    frame.addEventListener("scroll", schedule, { passive: true });
    float.addEventListener("click", onFloatClick);
    rebuild();
    if (table) ro.observe(table);

    return () => {
      if (frameId) cancelAnimationFrame(frameId);
      if (rebuildId) cancelAnimationFrame(rebuildId);
      ro.disconnect();
      mo.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", onResize);
      frame.removeEventListener("scroll", schedule);
      float.removeEventListener("click", onFloatClick);
    };
  }, []);

  return (
    <>
      {/* overflow-anchor: none … 並べ替えで行が入れ替わったとき、ブラウザが「見ていた行」を追ってページを勝手にスクロールしないようにする */}
      <div ref={frameRef} className={className} style={{ overflowAnchor: "none" }}>
        {children}
      </div>
      <div ref={floatRef} aria-hidden className="box-float-head" style={{ display: "none" }} />
    </>
  );
}
