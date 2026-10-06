"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { TeamColorChip } from "@/components/team-color-chip";
import { formatUsd, seasonIndex, teamSlug, type SalarySeason, type SalaryTeam } from "@/lib/salary/types";
import { SeasonTabs } from "./salary-parts";

// 30チームの総年俸一覧。年度を切り替えると、その年度の総年俸が高い順に並べ替える(初期表示は2026-27)。
// 総年俸が空欄のチームは「—」で最後に並べる。

export type TeamSalaryRow = SalaryTeam;

export function TeamSalaryTable({ rows }: { rows: TeamSalaryRow[] }) {
  const [season, setSeason] = useState<SalarySeason>("2026-27");
  const idx = seasonIndex(season);

  const sorted = useMemo(
    () => [...rows].sort((a, b) => (b.totals[idx] ?? -1) - (a.totals[idx] ?? -1) || a.name.localeCompare(b.name)),
    [rows, idx]
  );
  const max = Math.max(...rows.map((r) => r.totals[idx] ?? 0));

  return (
    <div className="space-y-4">
      <div className="border border-line bg-surface p-4">
        <span className="mb-1 block text-xs font-bold text-muted">年度</span>
        <SeasonTabs value={season} onChange={(v) => v !== "all" && setSeason(v)} />
      </div>

      <p className="text-sm" role="status" aria-live="polite">
        {season}の総年俸が高い順<span className="text-muted">（チーム名を押すと、選手別のサラリーを確認できます）</span>
      </p>

      <div className="border border-line bg-surface">
        <table className="w-full table-fixed border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-foreground text-[11px] font-bold text-muted">
              <th scope="col" className="w-10 px-2 py-2.5 text-right sm:w-14 sm:px-3">
                順位
              </th>
              <th scope="col" className="px-2 py-2.5 text-left sm:px-3">
                チーム
              </th>
              <th scope="col" className="w-[132px] px-2 py-2.5 text-right sm:w-[45%] sm:px-3">
                {season} 総年俸
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r, i) => {
              const total = r.totals[idx];
              return (
                <tr key={r.abbr} className="border-b border-line/60 last:border-b-0 hover:bg-[#f6f9ff] dark:hover:bg-white/[.03]">
                  <td className="px-2 py-3 text-right font-bold tabular-nums text-muted sm:px-3">{total === null ? "—" : i + 1}</td>
                  <th scope="row" className="overflow-hidden px-2 py-3 text-left sm:px-3">
                    <Link href={`/salary/teams/${teamSlug(r.abbr)}`} title={r.name} className="flex min-w-0 items-center gap-2 font-bold text-blue hover:underline">
                      <TeamColorChip abbreviation={r.abbr} />
                      <span className="min-w-0 text-[13px] leading-snug sm:text-sm">{r.name}</span>
                    </Link>
                  </th>
                  <td className="py-3 pl-3 pr-2 text-right sm:px-3">
                    <span className={`block font-bold tabular-nums ${total === null ? "text-muted" : ""}`}>{formatUsd(total)}</span>
                    {total !== null && max > 0 && (
                      <span aria-hidden className="mt-1 hidden h-1.5 bg-line sm:block">
                        <span className="block h-full bg-gold" style={{ width: `${(total / max) * 100}%` }} />
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
