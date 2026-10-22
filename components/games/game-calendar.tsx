"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { GameCalendarResponse } from "@/lib/games/types";
import { addMonths, formatMonthLabel, gamesDateHref } from "@/lib/games/date";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"] as const;

type Counts = Record<string, number>;

/** その月のカレンダーのマス(前後の月の分は null) */
function monthCells(month: string): (string | null)[] {
  const [y, m] = month.split("-").map(Number);
  const firstWeekday = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const cells: (string | null)[] = Array.from({ length: firstWeekday }, () => null);
  for (let d = 1; d <= days; d++) cells.push(`${month}-${String(d).padStart(2, "0")}`);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

// 試合センターの月間カレンダー(日本時間)。日付を押すと、その日の試合一覧(/games?date=)へ移動する。
// 試合がある日には試合数を出す(勝敗・点数・対戦カードは出さない)。月の切り替えはこの部品の中で行い、
// その月の試合数を /api/games/calendar から取得する。
export function GameCalendar({
  selected,
  today,
  initialMonth,
  initialCounts,
}: {
  selected: string;
  today: string;
  initialMonth: string;
  // サーバーで取得できなかったときは undefined(この部品で取得し直す)
  initialCounts?: Counts;
}) {
  const [month, setMonth] = useState(initialMonth);
  const [countsByMonth, setCountsByMonth] = useState<Record<string, Counts>>(initialCounts ? { [initialMonth]: initialCounts } : {});
  const [failed, setFailed] = useState<string | null>(null);
  const counts = countsByMonth[month];

  useEffect(() => {
    if (countsByMonth[month]) return;
    let cancelled = false;
    fetch(`/api/games/calendar?month=${month}`, { cache: "no-store" })
      .then((res) => res.json() as Promise<GameCalendarResponse | { error: string }>)
      .then((body) => {
        if (cancelled) return;
        if ("error" in body) setFailed(month);
        else setCountsByMonth((prev) => ({ ...prev, [month]: body.counts }));
      })
      .catch(() => {
        if (!cancelled) setFailed(month);
      });
    return () => {
      cancelled = true;
    };
  }, [month, countsByMonth]);

  const cells = monthCells(month);
  const gameDays = counts ? Object.values(counts).filter((n) => n > 0).length : null;

  return (
    <section aria-label="試合カレンダー" className="border border-line bg-surface p-3 sm:p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setMonth((m) => addMonths(m, -1))}
          className="min-h-9 min-w-9 border border-line px-2 text-sm font-bold hover:border-blue"
          aria-label="前の月"
        >
          ‹
        </button>
        <div className="text-center">
          <p className="text-base font-extrabold tabular-nums">{formatMonthLabel(month)}</p>
          <p className="text-[11px] text-muted" aria-live="polite">
            {failed === month && !counts ? "試合数を取得できませんでした" : gameDays === null ? "読み込み中…" : gameDays > 0 ? `試合のある日：${gameDays}日` : "この月の試合は登録されていません"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setMonth((m) => addMonths(m, 1))}
          className="min-h-9 min-w-9 border border-line px-2 text-sm font-bold hover:border-blue"
          aria-label="次の月"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 text-center text-[11px] font-extrabold text-muted">
        {WEEKDAYS.map((w, i) => (
          <div key={w} className={`py-1 ${i === 0 ? "text-[#cf4a51]" : i === 6 ? "text-blue" : ""}`}>
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px bg-line">
        {cells.map((date, i) => {
          if (!date) return <div key={`blank-${i}`} className="min-h-12 bg-surface" />;
          const n = counts?.[date] ?? 0;
          const isSelected = date === selected;
          const isToday = date === today;
          const day = Number(date.slice(8));
          return (
            <Link
              key={date}
              href={gamesDateHref(date, today)}
              aria-current={isSelected ? "date" : undefined}
              aria-label={`${Number(date.slice(5, 7))}月${day}日${isToday ? "（今日）" : ""}${n > 0 ? `・${n}試合` : "・試合なし"}`}
              className={`flex min-h-12 flex-col items-center justify-center gap-0.5 px-0.5 py-1 text-sm tabular-nums transition-colors ${
                isSelected ? "bg-navy text-white" : n > 0 ? "bg-surface font-bold hover:bg-[#eaf1ff] dark:hover:bg-white/[.06]" : "bg-surface text-muted hover:bg-background"
              } ${isToday && !isSelected ? "outline outline-2 -outline-offset-2 outline-gold" : ""}`}
            >
              <span>{day}</span>
              {n > 0 ? (
                <span className={`text-[10px] leading-none ${isSelected ? "text-gold" : "text-blue"}`}>{n}試合</span>
              ) : (
                <span className="text-[10px] leading-none opacity-0" aria-hidden>
                  -
                </span>
              )}
            </Link>
          );
        })}
      </div>
      <p className="mt-2 text-[11px] text-muted">日付は日本時間。数字はその日の試合数（結果は表示しません）。枠付きの日付が今日です。</p>
    </section>
  );
}
