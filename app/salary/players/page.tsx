import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { ContractLegend, SalaryBreadcrumb, SalaryHeading, SalarySourceNote } from "@/components/salary/salary-parts";
import { PlayerSalaryTable } from "@/components/salary/player-salary-table";
import { SALARY_COUNTS, salaryPlayerRows } from "@/lib/salary/data";

export const metadata: Metadata = {
  title: "選手サラリー | サラリー | NBA Front Office Japan",
  description: "NBA全選手の年俸一覧（2026-27〜2031-32）。選手名・チーム名で検索し、年度ごとに年俸の高い順で確認できます。保証額・契約状況つき。",
};

export default function PlayerSalaryPage() {
  return (
    <PageShell>
      <SalaryBreadcrumb items={[{ label: "選手サラリー" }]} />
      <SalaryHeading
        kicker="Player salary"
        title="選手サラリー"
        lead={`全${SALARY_COUNTS.players}人分の年俸・保証額・契約状況。トレードや解雇で複数のチームから支払われている選手は、チームごとに表示しています。`}
      />
      <div className="mb-3">
        <ContractLegend statusCount={SALARY_COUNTS.statuses} />
      </div>
      <PlayerSalaryTable rows={salaryPlayerRows()} />
      <SalarySourceNote />
    </PageShell>
  );
}
