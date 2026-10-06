import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { SalaryBreadcrumb, SalaryHeading, SalarySourceNote } from "@/components/salary/salary-parts";
import { TeamSalaryTable } from "@/components/salary/team-salary-table";
import { salaryTeams } from "@/lib/salary/data";

export const metadata: Metadata = {
  title: "チームサラリー | サラリー | NBA Front Office Japan",
  description: "NBA30チームの総年俸ランキング（2026-27〜2031-32）。年度を切り替えて、総年俸の高い順に確認できます。",
};

export default function TeamSalaryPage() {
  return (
    <PageShell>
      <SalaryBreadcrumb items={[{ label: "チームサラリー" }]} />
      <SalaryHeading kicker="Team payroll" title="チームサラリー" lead="30チームの総年俸。年度を切り替えると、その年度の総年俸が高い順に並びます。" />
      <TeamSalaryTable rows={salaryTeams()} />
      <SalarySourceNote />
    </PageShell>
  );
}
