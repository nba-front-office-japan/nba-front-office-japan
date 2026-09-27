"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatChangePct, formatFinancialOku, formatValueOku } from "@/lib/valuations";

export interface ValuationTableRow {
  teamId: string;
  teamName: string;
  teamAbbr: string;
  conference: string;
  rank: number;
  valueUsd: number;
  revenueUsd: number | null;
  ebitdaUsd: number | null;
  changePct: number | null;
}

type SortKey = "rank" | "valueUsd" | "changePct" | "revenueUsd" | "ebitdaUsd";
type SortDirection = "asc" | "desc";

function SortHeader({
  label,
  columnKey,
  sortKey,
  sortDirection,
  onSort,
  className = "",
}: {
  label: string;
  columnKey: SortKey;
  sortKey: SortKey;
  sortDirection: SortDirection;
  onSort: (key: SortKey) => void;
  className?: string;
}) {
  const active = sortKey === columnKey;
  return (
    <th
      aria-sort={active ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}
      className={`whitespace-nowrap p-0 text-left text-[11px] font-bold text-muted ${className}`}
    >
      <button
        type="button"
        onClick={() => onSort(columnKey)}
        className={`w-full cursor-pointer select-none whitespace-nowrap px-2 py-3 text-left hover:text-foreground ${
          active ? "text-foreground" : ""
        }`}
      >
        {label}
        {active ? (sortDirection === "asc" ? " ▲" : " ▼") : ""}
      </button>
    </th>
  );
}

function signedClass(value: number | null): string {
  if (value === null || value === 0) return "";
  return value > 0 ? "text-emerald-700 dark:text-emerald-400" : "text-red-600 dark:text-red-400";
}

// 横スクロール時も「順位」「チーム」の列を左端に固定する(背景を塗って下の列が透けないようにする)
const STICKY_RANK = "sticky left-0 z-10 w-12 min-w-12 bg-surface";
const STICKY_TEAM = "sticky left-12 z-10 bg-surface";

export function TeamValuationsTable({ rows }: { rows: ValuationTableRow[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("rank");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const maxValue = useMemo(() => Math.max(...rows.map((r) => r.valueUsd)), [rows]);

  const sortedRows = useMemo(() => {
    const factor = sortDirection === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const aValue = a[sortKey];
      const bValue = b[sortKey];
      if (aValue === null && bValue === null) return a.rank - b.rank;
      if (aValue === null) return 1;
      if (bValue === null) return -1;
      return factor * (Number(aValue) - Number(bValue)) || a.rank - b.rank;
    });
  }, [rows, sortKey, sortDirection]);

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      // 順位は小さい順、金額・前年比は大きい順を初期にする
      setSortDirection(key === "rank" ? "asc" : "desc");
    }
  }

  if (rows.length === 0) {
    return <p className="text-sm text-muted">資産価値のデータがありません。</p>;
  }

  const headerProps = { sortKey, sortDirection, onSort: handleSort };

  return (
    <div>
      <p className="mb-2 text-xs text-muted sm:hidden">→ 横にスクロールできます</p>
      <div className="overflow-x-auto border border-line bg-surface">
        <table className="w-full min-w-[580px] border-collapse text-[13px] sm:min-w-[720px]">
          <thead>
            <tr className="border-b border-line">
              <SortHeader label="順位" columnKey="rank" className={STICKY_RANK} {...headerProps} />
              <th
                className={`whitespace-nowrap px-2 py-3 text-left text-[11px] font-bold text-muted ${STICKY_TEAM}`}
              >
                チーム
              </th>
              <SortHeader label="資産価値" columnKey="valueUsd" {...headerProps} />
              <SortHeader label="前年比" columnKey="changePct" {...headerProps} />
              <SortHeader label="売上（億ドル）" columnKey="revenueUsd" {...headerProps} />
              <SortHeader label="EBITDA（億ドル）" columnKey="ebitdaUsd" {...headerProps} />
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row) => {
              const barWidth = maxValue > 0 ? (row.valueUsd / maxValue) * 100 : 0;
              return (
                <tr
                  key={row.teamId}
                  className="group border-b border-line/60 hover:bg-[#f6f9ff] dark:hover:bg-white/[.03]"
                >
                  <td
                    className={`${STICKY_RANK} whitespace-nowrap px-2 py-3 font-bold group-hover:bg-[#f6f9ff] dark:group-hover:bg-[#151f34]`}
                  >
                    {row.rank}
                  </td>
                  {/* スマホ幅ではチーム名を折り返し、固定列を細くして資産価値の列まで最初の画面に収める */}
                  <td
                    className={`${STICKY_TEAM} min-w-[8.5rem] px-2 py-3 sm:whitespace-nowrap group-hover:bg-[#f6f9ff] dark:group-hover:bg-[#151f34]`}
                  >
                    <Link href={`/teams/${row.teamId}`} className="font-semibold hover:text-blue">
                      {row.teamName}
                    </Link>
                    <span className="mt-0.5 block text-[11px] text-muted">
                      {row.teamAbbr} · {row.conference}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-2 py-3">
                    <b className="block font-semibold">{formatValueOku(row.valueUsd)}億ドル</b>
                    <span aria-hidden className="mt-1 block h-1.5 w-28 bg-line">
                      <span className="block h-full bg-blue" style={{ width: `${barWidth}%` }} />
                    </span>
                  </td>
                  <td className={`whitespace-nowrap px-2 py-3 ${signedClass(row.changePct)}`}>
                    {formatChangePct(row.changePct)}
                  </td>
                  <td className="whitespace-nowrap px-2 py-3">{formatFinancialOku(row.revenueUsd)}</td>
                  <td className={`whitespace-nowrap px-2 py-3 ${signedClass(row.ebitdaUsd)}`}>
                    {formatFinancialOku(row.ebitdaUsd)}
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
