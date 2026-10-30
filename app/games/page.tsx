import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { GamesCenter } from "@/components/games/games-center";
import { GameCalendar } from "@/components/games/game-calendar";
import { NewspaperMasthead } from "@/components/games/newspaper-masthead";
import { NEWSPAPER_FONT_CLASS } from "@/components/games/newspaper-fonts";
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
// ?date= 付きのURLも中身は同じページなので、canonical は /games にまとめる
export const metadata: Metadata = {
  title: "NBA試合結果・今日のスコアとボックススコア（日本時間・ネタバレ防止）",
  description:
    "NBAの試合結果を日本時間で毎日更新。全試合のスコアと選手別ボックススコア（得点・リバウンド・アシスト）を掲載。ネタバレ防止で、結果はボタンを押すまで表示しません。",
  alternates: { canonical: "/games" },
};

// 日付は日本時間。?date=YYYY-MM-DD でその日の試合を表示する(指定なしは今日)。
// 「前日」「翌日」は表示中の日付から1日ずつ前後へ移動する。月間カレンダーから日付を選ぶこともできる。
// 公開済みの ?day=yesterday / tomorrow は、今日から前後1日の日付として扱う。
// このページのHTMLには試合結果を含めない(カレンダーは日付ごとの試合数だけ)。結果は GamesCenter がボタン操作後に /api/games から取得する。
export default async function GamesPage({ searchParams }: PageProps<"/games">) {
  const { date: dateParam, day, view: viewParam } = await searchParams;
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
  // 個別表示の試合詳細から戻るときだけ、対戦カード一覧を復元する。
  const initialView = viewParam === "individual" ? "individual" : null;

  const navItems = [
    { key: "prev", label: "← 前日", date: prevDate, href: gamesDateHref(prevDate, today), current: false },
    { key: "today", label: "今日", date: today, href: "/games", current: selected === today },
    { key: "next", label: "翌日 →", date: nextDate, href: gamesDateHref(nextDate, today), current: false },
  ];

  return (
    <PageShell newspaper={NEWSPAPER_FONT_CLASS}>
      <NewspaperMasthead
        kicker="The Box Score"
        title="試合結果＆ボックススコア"
        edition="日本時間・ネタバレ防止版"
        dateline={<>NBA Front Office Japan　｜　{formatJstDateLong(selected)}{relative ? `（${relative}）` : ""}</>}
      />
      <p className="np-serif mb-3 text-[13px] leading-6 text-muted">
        ネタバレ防止のため、全試合の結果を表示する「一覧でみる」と、見たい試合だけ開く「個別にみる」を選べます。日付は日本時間です。カレンダーから日付を選ぶと、プレシーズンを含む過去の試合も見られます。
      </p>

      <nav aria-label="試合日" className="mb-3 grid grid-cols-3 gap-2">
        {navItems.map((t) => (
          <Link
            key={t.key}
            href={t.href}
            aria-current={t.current ? "page" : undefined}
            className={`selection-button selection-blue border-2 px-2 py-1.5 text-center ${
              t.current ? "np-ink-red border-[var(--np-red)]" : t.key === "today" ? "border-[var(--np-ink)] bg-surface" : "np-ink-navy border-[var(--np-navy)]"
            }`}
          >
            <span className="np-serif block text-sm font-extrabold">{t.label}</span>
            <span className={`block text-xs ${t.current || t.key !== "today" ? "text-white/80" : "text-muted"}`}>{formatJstDateLabel(t.date)}</span>
          </Link>
        ))}
      </nav>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="order-2 min-w-0 lg:order-1">
          <h2 className="mb-3 flex flex-wrap items-baseline gap-x-2 border-b-2 border-[var(--np-ink)] pb-1.5 text-lg font-bold">
            <span className="np-serif text-xl">{formatJstDateLong(selected)}の試合</span>
            {relative && <span className="text-xs font-bold text-muted">（{relative}）</span>}
            {gameCount !== null && gameCount > 0 && <span className="np-numeral text-sm font-bold text-[var(--np-red)]">{gameCount}試合</span>}
          </h2>

          <GamesCenter key={`${selected}:${initialView ?? "choose"}`} date={selected} dayLabel={dayLabel} today={today} gameCount={gameCount} dayStatus={dayStatus} adjacent={adjacent} initialView={initialView} />
        </div>

        <div className="order-1 lg:order-2">
          <GameCalendar key={month} selected={selected} today={today} initialMonth={month} initialData={calendar ? { counts: calendar.counts, statuses: calendar.statuses } : undefined} />
        </div>
      </div>
    </PageShell>
  );
}
