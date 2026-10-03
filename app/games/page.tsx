import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { GamesCenter } from "@/components/games/games-center";
import { GAME_DAY_TABS, addDays, formatJstDateLabel, isGameDayKey, todayJst } from "@/lib/games/date";

// タイトル・説明文にも試合結果を含めない(検索結果やSNSの共有でネタバレしないため)
export const metadata: Metadata = {
  title: "試合センター | NBA Front Office Japan",
  description: "NBAの試合結果とボックススコア。ネタバレ防止のため、結果は「結果を表示する」を押したときだけ表示します。",
};

// 日付は日本時間。?day=yesterday / today / tomorrow で切り替える(指定なしは今日)。
// このページのHTMLには試合結果を含めない。結果は GamesCenter がボタン操作後に /api/games から取得する。
export default async function GamesPage({ searchParams }: PageProps<"/games">) {
  const { day } = await searchParams;
  const selectedKey = isGameDayKey(day) ? day : "today";
  const today = todayJst();
  const tabs = GAME_DAY_TABS.map((t) => ({ ...t, date: addDays(today, t.offset) }));
  const selected = tabs.find((t) => t.key === selectedKey) ?? tabs[1];

  return (
    <PageShell>
      <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">Games</p>
      <h1 className="mb-3 text-[28px] font-semibold tracking-tight sm:text-[36px]">試合センター</h1>
      <p className="mb-6 text-sm leading-7 text-muted">
        ネタバレ防止のため、試合の勝敗・点数は「結果を表示する」を押したときだけ表示します。日付は日本時間です。
      </p>

      <nav aria-label="試合日" className="mb-5 grid grid-cols-3 border border-line bg-surface">
        {tabs.map((t) => {
          const active = t.key === selected.key;
          return (
            <Link
              key={t.key}
              href={t.key === "today" ? "/games" : `/games?day=${t.key}`}
              aria-current={active ? "page" : undefined}
              className={`border-b-[3px] px-2 py-3 text-center ${active ? "border-gold bg-[#fff6e0] dark:bg-white/[.06]" : "border-transparent"}`}
            >
              <span className="block text-sm font-extrabold">{t.label}</span>
              <span className="block text-xs text-muted">{formatJstDateLabel(t.date)}</span>
            </Link>
          );
        })}
      </nav>

      <GamesCenter key={selected.date} date={selected.date} dayLabel={selected.label} />
    </PageShell>
  );
}
