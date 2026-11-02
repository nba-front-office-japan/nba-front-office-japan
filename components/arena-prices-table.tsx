"use client";

import { useMemo, useState } from "react";
import { TeamColorChip } from "@/components/team-color-chip";
import {
  ARENA_PRICE_SORTS,
  breakableTeamName,
  formatUsdTenths,
  formatUsdWhole,
  rankArenaPrices,
  type ArenaPriceRow,
  type ArenaPriceSortKey,
} from "@/lib/arena-prices";

// 横スクロール時も「順位」「チーム」の列を左端に固定する(背景を塗って下の列が透けないようにする)
const STICKY_RANK = "sticky left-0 z-10 w-12 min-w-12 bg-surface";
const STICKY_TEAM = "sticky left-12 z-10 bg-surface";

const COLUMNS: { key: keyof ArenaPriceRow; label: string; format: (usd: number) => string }[] = [
  { key: "cheapestSeatUsd", label: "最安席（1席）", format: formatUsdWhole },
  { key: "beerUsd", label: "ビール（1杯）", format: formatUsdTenths },
  { key: "hotDogUsd", label: "ホットドッグ（1本）", format: formatUsdTenths },
  { key: "softDrinkUsd", label: "ソフトドリンク（1杯）", format: formatUsdTenths },
  { key: "parkingUsd", label: "駐車場", format: formatUsdWhole },
  { key: "familyTotalUsd", label: "家族4人の合計", format: formatUsdWhole },
];

export function ArenaPricesTable({ rows }: { rows: ArenaPriceRow[] }) {
  const [sortKey, setSortKey] = useState<ArenaPriceSortKey>("cheapestSeatUsd");
  const rankedRows = useMemo(() => rankArenaPrices(rows, sortKey), [rows, sortKey]);

  return (
    <div>
      <div role="group" aria-label="並べ替え" className="mb-3 flex flex-wrap gap-1.5">
        {ARENA_PRICE_SORTS.map((sort) => {
          const active = sort.key === sortKey;
          return (
            <button
              key={sort.key}
              type="button"
              aria-pressed={active}
              onClick={() => setSortKey(sort.key)}
              className={`border px-3 py-1.5 text-sm font-bold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue ${
                active ? "border-navy bg-navy text-white dark:border-blue dark:bg-blue" : "border-line bg-surface text-foreground hover:border-blue"
              }`}
            >
              {sort.label}
            </button>
          );
        })}
      </div>
      <p className="mb-2 text-xs text-muted sm:hidden">→ 横にスクロールできます</p>
      <div className="overflow-x-auto border border-line bg-surface">
        <table className="w-full min-w-[860px] border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-line">
              <th className={`whitespace-nowrap px-2 py-3 text-left text-[11px] font-bold text-muted ${STICKY_RANK}`}>順位</th>
              <th className={`whitespace-nowrap px-2 py-3 text-left text-[11px] font-bold text-muted ${STICKY_TEAM}`}>チーム</th>
              <th className="whitespace-nowrap px-2 py-3 text-left text-[11px] font-bold text-muted">アリーナ</th>
              {COLUMNS.map((column) => (
                <th
                  key={column.key}
                  aria-sort={column.key === sortKey ? "descending" : undefined}
                  className={`whitespace-nowrap px-2 py-3 text-right text-[11px] font-bold ${column.key === sortKey ? "text-foreground" : "text-muted"}`}
                >
                  {column.label}
                  {column.key === sortKey ? " ▼" : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rankedRows.map((row) => (
              <tr key={row.teamAbbr} className="group border-b border-line/60 hover:bg-[#f6f9ff] dark:hover:bg-white/[.03]">
                <td className={`${STICKY_RANK} whitespace-nowrap px-2 py-3 font-bold group-hover:bg-[#f6f9ff] dark:group-hover:bg-[#151f34]`}>{row.rank}</td>
                {/* スマホ幅ではチーム名を折り返し、固定列を細くして金額の列まで見えるようにする */}
                <td className={`${STICKY_TEAM} min-w-[8.5rem] px-2 py-3 sm:whitespace-nowrap group-hover:bg-[#f6f9ff] dark:group-hover:bg-[#151f34]`}>
                  <span className="flex items-start gap-2">
                    <span className="mt-1">
                      <TeamColorChip abbreviation={row.teamAbbr} />
                    </span>
                    <span className="min-w-0">
                      <span className="font-semibold [word-break:keep-all]">{breakableTeamName(row.teamName)}</span>
                      <span className="mt-0.5 block text-[11px] text-muted">{row.teamAbbr}</span>
                    </span>
                  </span>
                </td>
                <td className="min-w-[9.5rem] px-2 py-3 text-muted">{row.arena}</td>
                {COLUMNS.map((column) => (
                  <td
                    key={column.key}
                    className={`whitespace-nowrap px-2 py-3 text-right tabular-nums ${column.key === sortKey ? "font-bold" : ""}`}
                  >
                    {column.format(row[column.key] as number)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
