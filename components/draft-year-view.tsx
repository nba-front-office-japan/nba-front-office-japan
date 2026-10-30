import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { DraftBoard } from "@/components/draft-board";
import { DraftYearSelect } from "@/components/draft-year-select";
import { DEFAULT_DRAFT_YEAR, draftYearHref } from "@/lib/draft-format";
import type { DraftPick } from "@/lib/draft/draft-2026-picks";
import { DRAFT_YEARS, draftRounds } from "@/lib/draft/draft-history";

// /draft(2026年)と /draft/[year](過去の年)の共通表示
export function DraftYearView({ year, picks }: { year: number; picks: DraftPick[] }) {
  const rounds = draftRounds(picks);
  const newer = DRAFT_YEARS.includes(year + 1) ? year + 1 : null;
  const older = DRAFT_YEARS.includes(year - 1) ? year - 1 : null;

  return (
    <PageShell>
      <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">
        Draft Database · {year}
      </p>
      <h1 className="mb-2 text-[36px] font-semibold tracking-tight">{year} NBA Draft</h1>
      <p className="mb-5 text-sm text-muted">
        {rounds.length}巡目までの指名順一覧です。トレード対象ピックは指名先・トレード情報として表示しています。
      </p>
      <div className="mb-6 flex flex-wrap items-center gap-x-5 gap-y-3">
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
      <DraftBoard key={year} picks={picks} rounds={rounds} />
      {year !== DEFAULT_DRAFT_YEAR && (
        <p className="mt-4 text-xs leading-6 text-muted">
          指名データはWikipedia(CC BY-SA)の各年のNBAドラフト記事をもとに作成しています。身長・体重が分からない選手は「—」、日本語表記を確認中の選手は英語名で表示しています。
        </p>
      )}
    </PageShell>
  );
}
