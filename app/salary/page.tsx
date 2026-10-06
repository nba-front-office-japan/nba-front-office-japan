import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { SalaryHeading, SalarySourceNote } from "@/components/salary/salary-parts";
import { SALARY_COUNTS } from "@/lib/salary/data";
import { SALARY_SEASONS } from "@/lib/salary/types";

export const metadata: Metadata = {
  title: "サラリー | NBA Front Office Japan",
  description: "NBA全選手の年俸と、30チームの総年俸（2026-27〜2031-32）。選手サラリーとチームサラリーから選べます。",
};

const FIRST = SALARY_SEASONS[0];
const LAST = SALARY_SEASONS[SALARY_SEASONS.length - 1];

const CHOICES = [
  {
    href: "/salary/players",
    kicker: "Player salary",
    title: "選手サラリー",
    body: `全${SALARY_COUNTS.players}人分の年俸を一覧で。選手名・チーム名で検索し、年度を切り替えて高い順に確認できます。`,
    meta: `${FIRST}〜${LAST}・保証額・契約状況`,
  },
  {
    href: "/salary/teams",
    kicker: "Team payroll",
    title: "チームサラリー",
    body: `${SALARY_COUNTS.teams}チームの総年俸を高い順に。チームを選ぶと、そのチームの選手別の年俸を確認できます。`,
    meta: "年度別の総年俸・チーム別の選手一覧",
  },
];

// サラリーの入口(旧 CONTRACTS)。選手サラリーとチームサラリーの2つから選ぶ。
export default function SalaryPage() {
  return (
    <PageShell>
      <SalaryHeading kicker="Salary" title="サラリー" lead={`NBAの年俸を、選手ごと・チームごとに確認できます（${FIRST}〜${LAST}シーズン）。`} />

      <div className="grid gap-4 md:grid-cols-2">
        {CHOICES.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="group flex min-h-[220px] flex-col justify-between border border-line bg-surface p-6 transition-colors hover:border-blue focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue sm:p-8"
          >
            <div>
              <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">{c.kicker}</p>
              <h2 className="mb-3 text-[26px] font-semibold tracking-tight sm:text-[32px]">{c.title}</h2>
              <p className="text-sm leading-7 text-muted">{c.body}</p>
            </div>
            <div className="mt-6 flex items-end justify-between gap-3 border-t border-line pt-4">
              <span className="text-xs font-semibold text-muted">{c.meta}</span>
              <span className="shrink-0 text-sm font-extrabold text-blue group-hover:underline">見る →</span>
            </div>
          </Link>
        ))}
      </div>

      <SalarySourceNote />
    </PageShell>
  );
}
