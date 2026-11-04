"use client";

import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { breakableName, formatEjectionRank, rankEjections, type EjectionRow } from "@/lib/ejections";

// 退場回数の表(順位 / 選手 / 回数 / 区分)。回数のバーはチーム資産価値の表と同じ見た目
export function EjectionsTable({ rows, caption }: { rows: EjectionRow[]; caption: string }) {
  const ranked = rankEjections(rows);
  const max = Math.max(...rows.map((r) => r.ejections), 0);
  return (
    <div className="overflow-x-auto border border-line bg-surface">
      <table className="w-full border-collapse text-[13px]">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-line">
            <th scope="col" className="w-12 whitespace-nowrap px-2 py-3 text-left text-[11px] font-bold text-muted">順位</th>
            <th scope="col" className="whitespace-nowrap px-2 py-3 text-left text-[11px] font-bold text-muted">選手</th>
            <th scope="col" className="whitespace-nowrap px-2 py-3 text-left text-[11px] font-bold text-muted">回数</th>
            <th scope="col" className="w-14 whitespace-nowrap px-2 py-3 text-left text-[11px] font-bold text-muted">区分</th>
          </tr>
        </thead>
        <tbody>
          {ranked.map((row) => (
            <tr key={row.name} className="border-b border-line/60 hover:bg-[#f6f9ff] dark:hover:bg-white/[.03]">
              <td className="whitespace-nowrap px-2 py-3 font-bold">{formatEjectionRank(row)}</td>
              <td className="px-2 py-3">
                <span className="font-semibold [word-break:keep-all]">{breakableName(row.name)}</span>
              </td>
              <td className="whitespace-nowrap px-2 py-3">
                <b className="block font-semibold">{row.ejections}回</b>
                <span aria-hidden className="mt-1 block h-1.5 w-20 bg-line sm:w-28">
                  <span className="block h-full bg-blue" style={{ width: `${max > 0 ? (row.ejections / max) * 100 : 0}%` }} />
                </span>
              </td>
              <td className="whitespace-nowrap px-2 py-3">
                {row.active && (
                  <span className="border border-gold px-1.5 py-0.5 text-[11px] font-bold text-muted">現役</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const TABS = [
  { key: "all-time", label: "歴代" },
  { key: "active", label: "現役" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

// 「歴代」「現役」の切り替え。見た目は順位表のタブと同じ。左右キー・Home・End でも切り替えられる
export function EjectionsTabs({ allTime, active }: { allTime: ReactNode; active: ReactNode }) {
  const [tab, setTab] = useState<TabKey>("all-time");
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = TABS.findIndex((t) => t.key === tab);
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % TABS.length;
    else if (event.key === "ArrowLeft") next = (index - 1 + TABS.length) % TABS.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = TABS.length - 1;
    else return;
    event.preventDefault();
    setTab(TABS[next].key);
    buttons.current[next]?.focus();
  };

  return (
    <div>
      <div
        role="tablist"
        aria-label="ランキングの対象"
        onKeyDown={onKeyDown}
        className="mb-5 inline-flex overflow-hidden rounded-xl border border-line bg-surface p-1"
      >
        {TABS.map((t, i) => (
          <button
            key={t.key}
            ref={(el) => {
              buttons.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`ejections-tab-${t.key}`}
            aria-selected={tab === t.key}
            aria-controls={`ejections-panel-${t.key}`}
            tabIndex={tab === t.key ? 0 : -1}
            onClick={() => setTab(t.key)}
            className={`selection-button selection-blue min-h-11 min-w-24 px-5 text-sm font-extrabold transition-all duration-200 ${tab === t.key ? "bg-navy text-white" : "text-muted hover:bg-background hover:text-foreground"}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {TABS.map((t) => (
        <div
          key={t.key}
          role="tabpanel"
          id={`ejections-panel-${t.key}`}
          aria-labelledby={`ejections-tab-${t.key}`}
          hidden={tab !== t.key}
        >
          {t.key === "all-time" ? allTime : active}
        </div>
      ))}
    </div>
  );
}
