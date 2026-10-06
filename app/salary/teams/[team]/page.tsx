import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/page-shell";
import { TeamColorChip } from "@/components/team-color-chip";
import { ContractLegend, SalaryBreadcrumb, SalarySourceNote } from "@/components/salary/salary-parts";
import { PlayerSalaryTable } from "@/components/salary/player-salary-table";
import { SALARY_COUNTS, playerSalarySums, salaryPlayerRows, salaryTeamBySlug, salaryTeams } from "@/lib/salary/data";
import { SALARY_SEASONS, formatUsd, teamSlug } from "@/lib/salary/types";

// 30チーム分を事前に生成する(それ以外のURLは404)
export const dynamicParams = false;

export function generateStaticParams() {
  return salaryTeams().map((t) => ({ team: teamSlug(t.abbr) }));
}

export async function generateMetadata({ params }: PageProps<"/salary/teams/[team]">): Promise<Metadata> {
  const { team } = await params;
  const t = salaryTeamBySlug(team);
  if (!t) return {};
  return {
    title: `${t.name}のサラリー | チームサラリー | NBA Front Office Japan`,
    description: `${t.name}の総年俸と、選手別の年俸・保証額・契約状況（2026-27〜2031-32）。`,
  };
}

export default async function TeamSalaryDetailPage({ params }: PageProps<"/salary/teams/[team]">) {
  const { team } = await params;
  const t = salaryTeamBySlug(team);
  if (!t) notFound();

  const players = salaryPlayerRows(t.abbr);
  const sums = playerSalarySums(t.abbr);
  // チーム一覧(All Teams Summary)の総年俸と、選手別の年俸の合計が異なる年度。出典の値のまま表示し、差を注記する
  const diffs = SALARY_SEASONS.map((s, i) => ({ season: s, total: t.totals[i] ?? 0, sum: sums[i] })).filter((d) => d.total !== d.sum);

  return (
    <PageShell>
      <SalaryBreadcrumb items={[{ href: "/salary/teams", label: "チームサラリー" }, { label: t.name }]} />
      <div className="mb-6">
        <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">Team payroll</p>
        <h1 className="flex items-center gap-3 text-[28px] font-semibold leading-tight tracking-tight sm:text-[36px]">
          <TeamColorChip abbreviation={t.abbr} />
          {t.name}
        </h1>
        <p className="mt-2 text-sm text-muted">総年俸と、選手別の年俸・保証額・契約状況（{players.length}人）</p>
      </div>

      <section aria-labelledby="salary-totals" className="mb-8">
        <h2 id="salary-totals" className="mb-3 text-lg font-bold">
          年度別の総年俸
        </h2>
        <dl className="grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-3 lg:grid-cols-6">
          {SALARY_SEASONS.map((s, i) => (
            <div key={s} className="min-w-0 bg-surface p-4">
              <dt className="text-[11px] font-bold tabular-nums text-muted">{s}</dt>
              <dd className={`mt-1 break-words text-[17px] font-bold tabular-nums ${t.totals[i] === null ? "text-muted" : ""}`}>{formatUsd(t.totals[i])}</dd>
            </div>
          ))}
        </dl>
        {diffs.length > 0 && (
          <p className="mt-2 text-xs leading-6 text-muted">
            ※ 総年俸は出典のチーム一覧の値です。
            {diffs.map((d) => `${d.season}は、下の選手別の年俸の合計（${formatUsd(d.sum)}）と${formatUsd(Math.abs(d.sum - d.total))}の差があります`).join("。")}。
          </p>
        )}
      </section>

      <section aria-labelledby="salary-players">
        <h2 id="salary-players" className="mb-3 text-lg font-bold">
          選手別の年俸
        </h2>
        <div className="mb-3">
          <ContractLegend statusCount={SALARY_COUNTS.statuses} />
        </div>
        <PlayerSalaryTable rows={players} showTeam={false} />
      </section>

      <Link href="/salary/teams" className="mt-8 inline-block text-sm font-extrabold text-blue">
        ← チームサラリー一覧に戻る
      </Link>
      <SalarySourceNote />
    </PageShell>
  );
}
