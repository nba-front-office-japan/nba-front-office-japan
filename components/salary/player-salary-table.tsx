"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { TeamColorChip } from "@/components/team-color-chip";
import { SALARY_SEASONS, formatUsd, optionFor, seasonIndex, teamSlug, type SalaryPlayer, type SalarySeason } from "@/lib/salary/types";
import { ContractBadge, ContractList, SeasonTabs } from "./salary-parts";

// 全選手のサラリー一覧(選手名・チーム名で検索、年度の切り替え)。
// 「全年度」は2026-27〜2031-32をすべて並べ、年度を選ぶとその年度に年俸がある選手を高い順に並べる。

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

// 全年度の表で、オプションの年の年俸セルに付ける薄い色(目印の色と同じ系統)
const OPTION_CELL: Record<"player" | "team", string> = {
  player: "bg-[#e6efff] dark:bg-[#1c3a70]/70",
  team: "bg-[#ffe6eb] dark:bg-[#5c1f2d]/70",
};

const TH = "whitespace-nowrap px-2 py-2.5 text-left text-[11px] font-bold text-muted";
const TD = "whitespace-nowrap px-2 py-2.5";
const STICKY = "sticky left-0 z-10 bg-surface";

export type PlayerSalaryRow = SalaryPlayer & { teamName: string };

export function PlayerSalaryTable({ rows, showTeam = true, initialSeason = "all" }: { rows: PlayerSalaryRow[]; showTeam?: boolean; initialSeason?: SalarySeason | "all" }) {
  const [season, setSeason] = useState<SalarySeason | "all">(initialSeason);
  const [query, setQuery] = useState("");

  const { visible, matchedCount } = useMemo(() => {
    const q = normalize(query);
    const matched = q === "" ? rows : rows.filter((r) => normalize(`${r.name} ${r.team} ${r.teamName}`).includes(q));
    const idx = season === "all" ? 0 : seasonIndex(season);
    const list = season === "all" ? [...matched] : matched.filter((r) => r.salaries[idx] !== null);
    list.sort((a, b) => (b.salaries[idx] ?? -1) - (a.salaries[idx] ?? -1) || a.name.localeCompare(b.name));
    return { visible: list, matchedCount: matched.length };
  }, [rows, query, season]);

  // 年度を選んだときに、その年度の年俸がないため表示していない人数
  const hiddenCount = matchedCount - visible.length;
  const idx = season === "all" ? -1 : seasonIndex(season);

  return (
    <div className="space-y-4">
      <div className="space-y-3 border border-line bg-surface p-4">
        {showTeam && (
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-muted">選手名・チーム名で検索</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="例: Brunson / Knicks / NYK"
              className="w-full max-w-md border border-line bg-background px-3 py-2 text-sm focus:border-blue focus:outline-none"
            />
          </label>
        )}
        <div>
          <span className="mb-1 block text-xs font-bold text-muted">年度</span>
          <SeasonTabs value={season} onChange={setSeason} includeAll />
        </div>
      </div>

      <p className="text-sm" role="status" aria-live="polite">
        <b className="tabular-nums">{visible.length}</b>人
        {season !== "all" && (
          <span className="text-muted">
            （{season}の年俸が高い順。{hiddenCount > 0 ? `この年度に年俸がない${hiddenCount}人は表示していません` : "この年度に年俸がある選手のみ"}）
          </span>
        )}
        {season === "all" && <span className="text-muted">（2026-27の年俸が高い順）</span>}
      </p>

      <p className="text-xs text-muted sm:hidden">→ 表は横にスクロールできます</p>
      <div className="overflow-x-auto border border-line bg-surface">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-foreground">
              <th scope="col" className={`${TH} ${STICKY}`}>
                選手
              </th>
              {showTeam && (
                <th scope="col" className={TH}>
                  チーム
                </th>
              )}
              <th scope="col" className={`${TH} text-right`}>
                年齢
              </th>
              {season === "all" ? (
                SALARY_SEASONS.map((s) => (
                  <th key={s} scope="col" className={`${TH} text-right tabular-nums`}>
                    {s}
                  </th>
                ))
              ) : (
                <th scope="col" className={`${TH} text-right`}>
                  {season} 年俸
                </th>
              )}
              <th scope="col" className={`${TH} text-right`}>
                保証額
              </th>
              <th scope="col" className={TH}>
                契約状況
              </th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={20} className="px-3 py-8 text-center text-muted">
                  該当する選手がいません。
                </td>
              </tr>
            ) : (
              visible.map((r) => {
                const opt = idx >= 0 ? optionFor(r, season as SalarySeason) : null;
                return (
                  <tr key={`${r.team}-${r.name}`} className="border-b border-line/60 last:border-b-0 hover:bg-[#f6f9ff] dark:hover:bg-white/[.03]">
                    <th scope="row" className={`${TD} ${STICKY} text-left font-bold`}>
                      {r.name}
                    </th>
                    {showTeam && (
                      <td className={TD}>
                        <Link href={`/salary/teams/${teamSlug(r.team)}`} className="inline-flex items-center gap-1.5 font-semibold text-blue hover:underline" title={r.teamName}>
                          <TeamColorChip abbreviation={r.team} />
                          {r.team}
                        </Link>
                      </td>
                    )}
                    <td className={`${TD} text-right tabular-nums`}>{r.age ?? "—"}</td>
                    {season === "all" ? (
                      SALARY_SEASONS.map((s, i) => {
                        const o = optionFor(r, s);
                        return (
                          <td key={s} className={`${TD} text-right tabular-nums ${o ? OPTION_CELL[o] : ""} ${r.salaries[i] === null ? "text-muted" : ""}`}>
                            {formatUsd(r.salaries[i])}
                          </td>
                        );
                      })
                    ) : (
                      <td className={`${TD} text-right font-bold tabular-nums`}>
                        <span className="inline-flex items-center gap-1.5">
                          {opt && <ContractBadge type={opt} />}
                          {formatUsd(r.salaries[idx])}
                        </span>
                      </td>
                    )}
                    <td className={`${TD} text-right tabular-nums ${r.guaranteed === null ? "text-muted" : ""}`}>{formatUsd(r.guaranteed)}</td>
                    <td className={TD}>
                      <ContractList player={r} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
