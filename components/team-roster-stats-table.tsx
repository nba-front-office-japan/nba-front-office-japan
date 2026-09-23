"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatStat, formatPct, type DerivedStats } from "@/lib/stats";

export interface TeamStatsRow {
  id: string;
  name: string;
  teamAbbr: string;
  position: string | null;
  gamesPlayed: number | null;
  stats: DerivedStats | null;
}

type SortKey = "name" | "position" | "gamesPlayed" | keyof DerivedStats;
type SortDirection = "asc" | "desc";

const COLUMNS: { key: SortKey; label: string; format?: "stat" | "pct" }[] = [
  { key: "mpg", label: "MPG", format: "stat" },
  { key: "ppg", label: "PTS", format: "stat" },
  { key: "orbPg", label: "ORB", format: "stat" },
  { key: "drbPg", label: "DRB", format: "stat" },
  { key: "rpg", label: "TRB", format: "stat" },
  { key: "apg", label: "AST", format: "stat" },
  { key: "stlPg", label: "STL", format: "stat" },
  { key: "blkPg", label: "BLK", format: "stat" },
  { key: "fgPct", label: "FG%", format: "pct" },
  { key: "threePct", label: "3P%", format: "pct" },
  { key: "ftPct", label: "FT%", format: "pct" },
  { key: "tovPg", label: "TOV", format: "stat" },
  { key: "pfPg", label: "PF", format: "stat" },
];

// 並べ替え対象の値。スタッツ無し(null)は方向に関係なく常に末尾へ送る。
function sortValue(row: TeamStatsRow, key: SortKey): string | number | null {
  if (key === "name") return row.name;
  if (key === "position") return row.position;
  if (key === "gamesPlayed") return row.gamesPlayed;
  return row.stats ? row.stats[key] : null;
}

function SortHeader({
  label,
  columnKey,
  sortKey,
  sortDirection,
  onSort,
}: {
  label: string;
  columnKey: SortKey;
  sortKey: SortKey;
  sortDirection: SortDirection;
  onSort: (key: SortKey) => void;
}) {
  const active = sortKey === columnKey;
  return (
    <th
      aria-sort={active ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}
      className="whitespace-nowrap p-0 text-left text-[11px] font-bold text-muted"
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

export function TeamRosterStatsTable({ rows }: { rows: TeamStatsRow[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("ppg");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const sortedRows = useMemo(() => {
    const factor = sortDirection === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const aValue = sortValue(a, sortKey);
      const bValue = sortValue(b, sortKey);
      if (aValue === null && bValue === null) return 0;
      if (aValue === null) return 1;
      if (bValue === null) return -1;
      if (typeof aValue === "string" && typeof bValue === "string") {
        return factor * aValue.localeCompare(bValue, "ja");
      }
      return factor * ((aValue as number) - (bValue as number));
    });
  }, [rows, sortKey, sortDirection]);

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("desc");
    }
  }

  if (rows.length === 0) {
    return <p className="text-sm text-muted">ロスターデータがありません。</p>;
  }

  const headerProps = { sortKey, sortDirection, onSort: handleSort };

  return (
    <div className="overflow-x-auto border border-line bg-surface">
      <table className="w-full min-w-[900px] border-collapse text-[13px]">
        <thead>
          <tr className="border-b border-line">
            <SortHeader label="選手名" columnKey="name" {...headerProps} />
            <th className="whitespace-nowrap px-2 py-2.5 text-left text-[11px] font-bold text-muted">
              チーム
            </th>
            <SortHeader label="POS" columnKey="position" {...headerProps} />
            <SortHeader label="G" columnKey="gamesPlayed" {...headerProps} />
            {COLUMNS.map((col) => (
              <SortHeader key={col.key} label={col.label} columnKey={col.key} {...headerProps} />
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((row) => (
            <tr key={row.id} className="border-b border-line/60 hover:bg-[#f6f9ff] dark:hover:bg-white/[.03]">
              <td className="whitespace-nowrap px-2 py-3 font-semibold">
                <Link href={`/players/${row.id}`} className="hover:text-blue">
                  {row.name}
                </Link>
              </td>
              <td className="whitespace-nowrap px-2 py-3 text-muted">{row.teamAbbr}</td>
              <td className="whitespace-nowrap px-2 py-3">{row.position ?? "—"}</td>
              <td className="whitespace-nowrap px-2 py-3">{row.gamesPlayed ?? "—"}</td>
              {COLUMNS.map((col) => {
                const value = row.stats ? row.stats[col.key as keyof DerivedStats] : null;
                return (
                  <td key={col.key} className="whitespace-nowrap px-2 py-3">
                    {row.stats
                      ? col.format === "pct"
                        ? formatPct(value)
                        : formatStat(value)
                      : "—"}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
