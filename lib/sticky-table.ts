// スマホ(sm 未満)のスタッツ表で、ヘッダー行と先頭の「選手名」列を固定するためのクラス。PC(sm 以上)の見た目は変えない。
// ・ヘッダー行を画面上端に固定するのは components/sticky-table-frame.tsx(PC・スマホ共通)。
//   以前はスマホだけ表の枠を縦スクロールの箱(高さ75dvh)にしてその中で固定していたが、
//   PCでは固定されず、スマホでも枠の中と画面の二重スクロールになるためやめた(STICKY_TABLE_SCROLL は空)
// ・固定したセルには背景(bg-surface)を付け、下の文字が透けないようにする。罫線は border-collapse だと
//   固定セルに付いて動かないため、内側の影(inset)で引く
// ・重なり順: 選手名のヘッダー(z-30) > ほかのヘッダー(z-20) > 選手名の列(z-10)

// 表の枠(overflow-x-auto の div)に足す
export const STICKY_TABLE_SCROLL = "";

// ヘッダー行のセル(先頭列以外)
export const STICKY_HEAD_CELL =
  "max-sm:sticky max-sm:top-0 max-sm:z-20 max-sm:bg-surface max-sm:shadow-[inset_0_-1px_0_var(--color-line)]";

// ヘッダー行の先頭セル(「選手名」)
export const STICKY_HEAD_FIRST_CELL =
  "max-sm:sticky max-sm:top-0 max-sm:left-0 max-sm:z-30 max-sm:bg-surface max-sm:shadow-[inset_0_-1px_0_var(--color-line),inset_-1px_0_0_var(--color-line)]";

// 本文の先頭セル(選手名)。長い名前は折り返して、固定列が画面を占めすぎないようにする
export const STICKY_BODY_FIRST_CELL =
  "max-sm:sticky max-sm:left-0 max-sm:z-10 max-sm:bg-surface max-sm:shadow-[inset_-1px_0_0_var(--color-line)] max-sm:min-w-[7rem] max-sm:max-w-[8.5rem] max-sm:whitespace-normal max-sm:leading-snug";
