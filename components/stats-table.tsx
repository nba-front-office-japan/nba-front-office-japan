"use client";

import { useMemo, useState } from "react";
import type { Database } from "@/lib/supabase/types";

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

function divide(numerator: number, denominator: number): number | null {
  if (!denominator) return null;
  return numerator / denominator;
}

function deriveRow(row: StatRow): DerivedRow {
  const ppg = divide(row.points, row.gamesPlayed);
  const rpg = divide(row.reboundsTotal, row.gamesPlayed);
  const apg = divide(row.assists, row.gamesPlayed);
  const fgPct = divide(row.fieldGoalsMade, row.fieldGoalsAttempted);
  const threePct = divide(
    row.threePointersMade,
    row.threePointersAttempted
  );
  const tsDenominator =
    2 * (row.fieldGoalsAttempted + 0.44 * row.freeThrowsAttempted);
  const tsPct = divide(row.points, tsDenominator);

  return {
    ...row,
    ppg,
    rpg,
    apg,
    fgPct: fgPct !== null ? fgPct * 100 : null,
    threePct: threePct !== null ? threePct * 100 : null,
    tsPct: tsPct !== null ? tsPct * 100 : null,
  };
}

function formatNumber(value: number | null, digits = 1): string {
  return value === null ? "-" : value.toFixed(digits);
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
                    {formatNumber(row.ppg)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">
                    {formatNumber(row.rpg)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">
                    {formatNumber(row.apg)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">
                    {formatNumber(row.fgPct)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">
                    {formatNumber(row.threePct)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">
                    {formatNumber(row.tsPct)}
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
