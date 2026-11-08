import Link from "next/link";
import { BriefSheet, BriefSide } from "@/components/brief-sheet";
import { PageShell } from "@/components/page-shell";
import { DraftBoard } from "@/components/draft-board";
import { DraftYearSelect } from "@/components/draft-year-select";
import { DEFAULT_DRAFT_YEAR, draftYearHref } from "@/lib/draft-format";
import type { DraftPick } from "@/lib/draft/draft-2026-picks";
import { DRAFT_YEARS, draftRounds } from "@/lib/draft/draft-history";

// /draft(2026年)と /draft/[year](過去の年)の共通表示
export function DraftYearView({
  year,
  picks,
  playerIds,
}: {
  year: number;
  picks: DraftPick[];
  // 全体指名順位 → 選手ページの選手ID(選手名鑑で見つかった選手だけ)
  playerIds: Record<number, string>;
}) {
  const rounds = draftRounds(picks);
  const newer = DRAFT_YEARS.includes(year + 1) ? year + 1 : null;
  const older = DRAFT_YEARS.includes(year - 1) ? year - 1 : null;

  return (
    <PageShell>
      <BriefSheet
        file="06"
        mark={["DRAFT", "BOARD"]}
        edition={`${year} NBA DRAFT`}
        report="SELECTION RECORD"
        kicker={`Draft Database · ${year}`}
        title={`${year} NBA Draft`}
        lead={`${rounds.length}巡目までの指名順一覧です。選手名を押すとプロフィール、「Stats」でシーズン別成績を見られます。トレード対象ピックは指名先・トレード情報として表示しています。`}
        side={
          <BriefSide label="Draft year">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
              <DraftYearSelect year={year} years={DRAFT_YEARS} />
              <nav aria-label="前後の年" className="flex gap-4 text-sm font-semibold">
                {older && (
                  <Link href={draftYearHref(older)} className="text-blue underline-offset-2 hover:underline">
                    ← {older}年
                  </Link>
                )}
                {newer && (
                  <Link href={draftYearHref(newer)} className="text-blue underline-offset-2 hover:underline">
                    {newer}年 →
                  </Link>
                )}
              </nav>
            </div>
          </BriefSide>
        }
      >
        <DraftBoard key={year} picks={picks} rounds={rounds} playerIds={playerIds} />
        {year !== DEFAULT_DRAFT_YEAR && (
          <p className="mt-4 text-xs leading-6 text-muted">
            指名データはWikipedia(CC BY-SA)の各年のNBAドラフト記事をもとに作成しています。身長・体重が分からない選手は「—」、日本語表記を確認中の選手は英語名で表示しています。
          </p>
        )}
      </BriefSheet>
    </PageShell>
  );
}
