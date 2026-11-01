import type { Metadata } from "next";
import { BriefSheet, BriefSide } from "@/components/brief-sheet";
import { PageShell } from "@/components/page-shell";
import { SalaryBreadcrumb, SalarySourceNote } from "@/components/salary/salary-parts";
import { TeamSalaryTable } from "@/components/salary/team-salary-table";
import { salaryTeams } from "@/lib/salary/data";
import { SALARY_SEASONS } from "@/lib/salary/types";

export const metadata: Metadata = {
  title: "チームサラリー | サラリー | NBA Front Office Japan",
  description: "NBA30チームの総年俸ランキング（2026-27〜2031-32）。年度を切り替えて、総年俸の高い順に確認できます。",
};

export default function TeamSalaryPage() {
  return (
    <PageShell>
      <BriefSheet
        file="07"
        mark={["TEAM", "PAYROLL"]}
        edition={`${SALARY_SEASONS[0]}–${SALARY_SEASONS[SALARY_SEASONS.length - 1]}`}
        report="PAYROLL & CONTRACT DATA"
        kicker="Team payroll"
        title="チームサラリー"
        lead="30チームの総年俸。年度を切り替えると、その年度の総年俸が高い順に並びます。"
        side={
          <BriefSide label="Ledger index">
            <SalaryBreadcrumb items={[{ label: "チームサラリー" }]} />
          </BriefSide>
        }
      >
        <TeamSalaryTable rows={salaryTeams()} />
        <SalarySourceNote />
      </BriefSheet>
    </PageShell>
  );
}
