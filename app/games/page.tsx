import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { GamesCenter } from "@/components/games/games-center";
import { GameCalendar } from "@/components/games/game-calendar";
import { GameDayStatusBadge } from "@/components/games/game-day-status";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { fetchAdjacentGameDates, fetchGameCountsForMonth } from "@/lib/games/data";
import {
  GAME_DAY_TABS,
  addDays,
  formatJstDateLabel,
  formatJstDateLong,
  gamesDateHref,
  isGameDayKey,
  isValidDateString,
  monthOf,
  todayJst,
} from "@/lib/games/date";

// タイトル・説明文にも試合結果を含めない(検索結果やSNSの共有でネタバレしないため)
export const metadata: Metadata = {
  title: "試合結果＆ボックススコア | NBA Front Office Japan",
  description: "NBAの試合結果とボックススコア。ネタバレ防止のため、結果は「結果を表示する」を押したときだけ表示します。",
};

// 日付は日本時間。?date=YYYY-MM-DD でその日の試合を表示する(指定なしは今日)。
// 「前日」「翌日」は表示中の日付から1日ずつ前後へ移動する。月間カレンダーから日付を選ぶこともできる。
// 公開済みの ?day=yesterday / tomorrow は、今日から前後1日の日付として扱う。
// このページのHTMLには試合結果を含めない(カレンダーは日付ごとの試合数だけ)。結果は GamesCenter がボタン操作後に /api/games から取得する。
export default async function GamesPage({ searchParams }: PageProps<"/games">) {
  const { date: dateParam, day } = await searchParams;
  const today = todayJst();
  const legacyOffset = isGameDayKey(day) ? (GAME_DAY_TABS.find((t) => t.key === day)?.offset ?? 0) : 0;
  const selected = typeof dateParam === "string" && isValidDateString(dateParam) ? dateParam : addDays(today, legacyOffset);
  const prevDate = addDays(selected, -1);
  const nextDate = addDays(selected, 1);
  const month = monthOf(selected);

  const supabase = createServerSupabaseClient();
  // 試合数の取得に失敗しても、ページは表示する(カレンダーは読み込み直し、一覧は「結果を表示する」から取得する)
  const calendar = await fetchGameCountsForMonth(supabase, month).catch(() => null);
  const gameCount = calendar ? (calendar.counts[selected] ?? 0) : null;
  // その日のデータの入力状況(結果・ボックススコアが保存済みの試合数。対戦カード・得点は含まない)
  const dayStatus = calendar?.statuses[selected] ?? null;
  const adjacent = gameCount === 0 ? await fetchAdjacentGameDates(supabase, selected).catch(() => ({ prev: null, next: null })) : { prev: null, next: null };

  const dayLabel = formatJstDateLabel(selected);
  const relative = selected === today ? "今日" : selected === addDays(today, -1) ? "昨日" : selected === addDays(today, 1) ? "明日" : null;

  const navItems = [
    { key: "prev", label: "← 前日", date: prevDate, href: gamesDateHref(prevDate, today), current: false },
    { key: "today", label: "今日", date: today, href: "/games", current: selected === today },
    { key: "next", label: "翌日 →", date: nextDate, href: gamesDateHref(nextDate, today), current: false },
  ];

  return (
    <PageShell>
      <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">Games</p>
      <h1 className="mb-3 text-[28px] font-semibold tracking-tight sm:text-[36px]">試合結果＆ボックススコア</h1>
      <p className="mb-6 text-sm leading-7 text-muted">
        ネタバレ防止のため、試合の勝敗・点数は「結果を表示する」を押したときだけ表示します。日付は日本時間です。カレンダーから日付を選ぶと、プレシーズンを含む過去の試合も見られます。
      </p>

      <nav aria-label="試合日" className="mb-4 grid grid-cols-3 lg:mb-6 border border-line bg-surface">
        {navItems.map((t) => (
          <Link
            key={t.key}
            href={t.href}
            aria-current={t.current ? "page" : undefined}
            className={`border-b-[3px] px-2 py-3 text-center ${t.current ? "border-gold bg-[#fff6e0] dark:bg-white/[.06]" : "border-transparent hover:bg-background"}`}
          >
            <span className="block text-sm font-extrabold">{t.label}</span>
            <span className="block text-xs text-muted">{formatJstDateLabel(t.date)}</span>
          </Link>
        ))}
      </nav>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="order-2 min-w-0 lg:order-1">
          <h2 className="mb-3 flex flex-wrap items-baseline gap-x-2 text-lg font-bold">
            <span>{formatJstDateLong(selected)}の試合</span>
            {relative && <span className="text-xs font-bold text-muted">（{relative}）</span>}
            {gameCount !== null && gameCount > 0 && <span className="text-xs font-bold text-blue">{gameCount}試合</span>}
            {dayStatus && <GameDayStatusBadge status={dayStatus} />}
          </h2>

          <GamesCenter key={selected} date={selected} dayLabel={dayLabel} today={today} gameCount={gameCount} adjacent={adjacent} />
        </div>

        <div className="order-1 lg:order-2">
          <GameCalendar key={month} selected={selected} today={today} initialMonth={month} initialData={calendar ? { counts: calendar.counts, statuses: calendar.statuses } : undefined} />
        </div>
      </div>
    </PageShell>
  );
}
