"use client";

import { useMemo, useState } from "react";
import type { Database } from "@/lib/supabase/types";
import { deriveStats, formatStat } from "@/lib/stats";

type SeasonType =
  Database["public"]["Tables"]["player_stats"]["Row"]["season_type"];

export interface StatRow {
  id: string;
  playerName: string;
  teamLabel: string;
  seasonType: SeasonType;
  gamesPlayed: number;
  points: number;
  reboundsTotal: number;
  assists: number;
  fieldGoalsMade: number;
  fieldGoalsAttempted: number;
  threePointersMade: number;
  threePointersAttempted: number;
  freeThrowsAttempted: number;
}

interface DerivedRow extends StatRow {
  ppg: number | null;
  rpg: number | null;
  apg: number | null;
  fgPct: number | null;
  threePct: number | null;
  tsPct: number | null;
}

type SortKey =
  | "playerName"
  | "teamLabel"
  | "gamesPlayed"
  | "ppg"
  | "rpg"
  | "apg"
  | "fgPct"
  | "threePct"
  | "tsPct";

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "playerName", label: "選手名" },
  { key: "teamLabel", label: "チーム" },
  { key: "gamesPlayed", label: "試合数" },
  { key: "ppg", label: "PPG" },
  { key: "rpg", label: "RPG" },
  { key: "apg", label: "APG" },
  { key: "fgPct", label: "FG%" },
  { key: "threePct", label: "3P%" },
  { key: "tsPct", label: "TS%" },
];

function deriveRow(row: StatRow): DerivedRow {
  return { ...row, ...deriveStats(row) };
}

export function StatsTable({ rows }: { rows: StatRow[] }) {
  const [seasonType, setSeasonType] = useState<SeasonType>("regular_season");
  const [sortKey, setSortKey] = useState<SortKey>("ppg");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const derivedRows = useMemo(
    () => rows.filter((r) => r.seasonType === seasonType).map(deriveRow),
    [rows, seasonType]
  );

  const sortedRows = useMemo(() => {
    const sorted = [...derivedRows].sort((a, b) => {
      const aValue = a[sortKey];
      const bValue = b[sortKey];

      if (typeof aValue === "string" && typeof bValue === "string") {
        return aValue.localeCompare(bValue);
      }

      const aNum = typeof aValue === "number" ? aValue : -Infinity;
      const bNum = typeof bValue === "number" ? bValue : -Infinity;
      return aNum - bNum;
    });

    if (sortDirection === "desc") sorted.reverse();
    return sorted;
  }, [derivedRows, sortKey, sortDirection]);

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("desc");
    }
  }

  return (
    <div>
      <div className="mb-4 flex gap-2">
        {(["regular_season", "playoffs"] as const).map((type) => (
          <button
            key={type}
            onClick={() => setSeasonType(type)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              seasonType === type
                ? "bg-foreground text-background"
                : "border border-black/[.08] text-zinc-600 dark:border-white/[.145] dark:text-zinc-400"
            }`}
          >
            {type === "regular_season" ? "Regular Season" : "Playoffs"}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-black/[.08] dark:border-white/[.145]">
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className="cursor-pointer select-none whitespace-nowrap px-3 py-2 text-left font-medium text-zinc-600 hover:text-foreground dark:text-zinc-400"
                >
                  {col.label}
                  {sortKey === col.key
                    ? sortDirection === "asc"
                      ? " ▲"
                      : " ▼"
                    : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedRows.length === 0 ? (
              <tr>
                <td
                  colSpan={COLUMNS.length}
                  className="px-3 py-6 text-center text-sm text-zinc-500 dark:text-zinc-400"
                >
                  データがありません。
                </td>
              </tr>
            ) : (
              sortedRows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-black/[.05] dark:border-white/[.08]"
                >
                  <td className="whitespace-nowrap px-3 py-2 font-medium">
                    {row.playerName}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-zinc-600 dark:text-zinc-400">
                    {row.teamLabel}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">
                    {row.gamesPlayed}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">
                    {formatStat(row.ppg)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">
                    {formatStat(row.rpg)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">
                    {formatStat(row.apg)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">
                    {formatStat(row.fgPct)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">
                    {formatStat(row.threePct)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">
                    {formatStat(row.tsPct)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
