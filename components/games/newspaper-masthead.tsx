import type { ReactNode } from "react";
import { PageFlipSound } from "./page-flip-sound";

// 試合結果ページの題字(新聞の第1面の上部)。赤の罫・紺の帯・ブラックレターの英字題字・明朝の日本語見出し。
// title は h1 として出す。dateline は帯の下の日付行(新聞の発行日の位置)。
export function NewspaperMasthead({ kicker, title, edition, dateline }: { kicker: string; title: string; edition: string; dateline: ReactNode }) {
  return (
    <header className="mb-3">
      <div className="h-[5px] bg-[var(--np-red)]" aria-hidden />
      <div className="np-ink-navy mt-[3px] grid grid-cols-1 items-stretch sm:grid-cols-[minmax(0,1fr)_auto]">
        <div className="px-4 py-3 sm:px-5 sm:py-3">
          <p className="np-blackletter text-[30px] leading-none text-[#f5ecd6] sm:text-[40px]" aria-hidden>
            {kicker}
          </p>
          <h1 className="np-serif mt-1 text-[20px] font-bold leading-tight tracking-wide text-white sm:text-[24px]">{title}</h1>
        </div>
        <div className="flex items-center gap-3 border-t border-white/25 px-4 py-2 sm:flex-col sm:items-end sm:justify-center sm:border-l sm:border-t-0 sm:px-6 sm:text-right">
          <p className="np-numeral whitespace-nowrap text-sm font-bold uppercase leading-tight tracking-[2px] text-white sm:text-base">
            Sports
            <br className="hidden sm:block" /> Final
          </p>
          <p className="whitespace-nowrap text-[11px] font-bold text-white/80">{edition}</p>
          <PageFlipSound />
        </div>
      </div>
      <div className="np-rule-double mt-[3px]" aria-hidden />
      <div className="mt-[6px] flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-[var(--np-ink)] pb-1.5 text-xs font-bold text-[var(--np-ink)]">
        <span className="np-serif">{dateline}</span>
        <span aria-hidden className="tracking-[3px] text-[var(--np-red)]">★★★★★</span>
      </div>
    </header>
  );
}
