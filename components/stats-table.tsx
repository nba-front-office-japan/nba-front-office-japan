"use client";

import { useMemo, useState, type ReactNode } from "react";
import type { Database } from "@/lib/supabase/types";
import { deriveStats, formatStat, formatPct } from "@/lib/stats";

type SeasonType =
  Database["public"]["Tables"]["player_stats"]["Row"]["season_type"];

export interface StatRow {
  id: string;
  playerName: string;
  teamLabel: string;
  seasonType: SeasonType;
  gamesPlayed: number;
  minutesPlayed: number;
  points: number;
  reboundsOffensive: number;
  reboundsDefensive: number;
  reboundsTotal: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  personalFouls: number;
  fieldGoalsMade: number;
  fieldGoalsAttempted: number;
  threePointersMade: number;
  threePointersAttempted: number;
  freeThrowsMade: number;
  freeThrowsAttempted: number;
  position?: string | null;
  season?: number;
}

interface DerivedRow extends StatRow {
  ppg: number | null;
  rpg: number | null;
  apg: number | null;
  mpg: number | null;
  orbPg: number | null;
  drbPg: number | null;
  stlPg: number | null;
  blkPg: number | null;
  tovPg: number | null;
  pfPg: number | null;
  fgPct: number | null;
  threePct: number | null;
  ftPct: number | null;
}

export type SortKey =
  | "playerName"
  | "position"
  | "gamesPlayed"
  | "mpg"
  | "ppg"
  | "orbPg"
  | "drbPg"
  | "rpg"
  | "apg"
  | "stlPg"
  | "blkPg"
  | "fgPct"
  | "threePct"
  | "ftPct"
  | "tovPg"
  | "pfPg"
  | "teamLabel";

// POS/G/MPG/PTS PG/ORB PG/DRB PG/TRB PG/AST PG/STL PG/BLK PG/FG%/3P%/FT%/TOV PG/PF PGの順で表示する。
// 選手名を先頭に、補足情報としてチームを末尾に添える。
const COLUMNS: {
  key: SortKey;
  label: string;
  render: (row: DerivedRow) => ReactNode;
  cellClassName?: string;
}[] = [
  {
    key: "playerName",
    label: "選手名",
    render: (row) => row.playerName,
    cellClassName: "font-medium",
  },
  { key: "position", label: "POS", render: (row) => row.position ?? "-" },
  { key: "gamesPlayed", label: "G", render: (row) => row.gamesPlayed },
  { key: "mpg", label: "MPG", render: (row) => formatStat(row.mpg) },
  { key: "ppg", label: "PTS PG", render: (row) => formatStat(row.ppg) },
  { key: "orbPg", label: "ORB PG", render: (row) => formatStat(row.orbPg) },
  { key: "drbPg", label: "DRB PG", render: (row) => formatStat(row.drbPg) },
  { key: "rpg", label: "TRB PG", render: (row) => formatStat(row.rpg) },
  { key: "apg", label: "AST PG", render: (row) => formatStat(row.apg) },
  { key: "stlPg", label: "STL PG", render: (row) => formatStat(row.stlPg) },
  { key: "blkPg", label: "BLK PG", render: (row) => formatStat(row.blkPg) },
  { key: "fgPct", label: "FG%", render: (row) => formatPct(row.fgPct) },
  { key: "threePct", label: "3P%", render: (row) => formatPct(row.threePct) },
  { key: "ftPct", label: "FT%", render: (row) => formatPct(row.ftPct) },
  { key: "tovPg", label: "TOV PG", render: (row) => formatStat(row.tovPg) },
  { key: "pfPg", label: "PF PG", render: (row) => formatStat(row.pfPg) },
  {
    key: "teamLabel",
    label: "チーム",
    render: (row) => row.teamLabel,
    cellClassName: "text-muted",
  },
];

const POSITIONS = ["PG", "SG", "SF", "PF", "C"];
const MIN_GAMES_OPTIONS = [0, 20, 50];

function deriveRow(row: StatRow): DerivedRow {
  return { ...row, ...deriveStats(row) };
}

export function StatsTable({
  rows,
  initialSortKey,
}: {
  rows: StatRow[];
  initialSortKey?: SortKey;
}) {
  const [seasonType, setSeasonType] = useState<SeasonType>("regular_season");
  const [sortKey, setSortKey] = useState<SortKey>(initialSortKey ?? "ppg");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const hasPosition = rows.some((r) => r.position);
  const seasons = useMemo(
    () => [...new Set(rows.map((r) => r.season).filter((s): s is number => s !== undefined))].sort(
      (a, b) => b - a
    ),
    [rows]
  );
  const hasSeasonFilter = seasons.length > 1;

  const [position, setPosition] = useState<string>("All");
  const [minGames, setMinGames] = useState(0);
  const [season, setSeason] = useState<number | "All">(
    seasons.length > 0 ? seasons[0] : "All"
  );

  const derivedRows = useMemo(
    () =>
      rows
        .filter((r) => r.seasonType === seasonType)
        .filter((r) => position === "All" || r.position === position)
        .filter((r) => r.gamesPlayed >= minGames)
        .filter((r) => season === "All" || r.season === season)
        .map(deriveRow),
    [rows, seasonType, position, minGames, season]
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
      <div className="mb-4 flex flex-wrap items-end gap-3 border border-line bg-surface p-4">
        <div className="flex gap-2">
          {(["regular_season", "playoffs"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setSeasonType(type)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                seasonType === type
                  ? "bg-blue text-white"
                  : "border border-line text-muted"
              }`}
            >
              {type === "regular_season" ? "Regular Season" : "Playoffs"}
            </button>
          ))}
        </div>

        {hasSeasonFilter && (
          <label className="grid gap-1.5 text-[11px] font-bold text-muted">
            SEASON
            <select
              value={season}
              onChange={(e) =>
                setSeason(e.target.value === "All" ? "All" : Number(e.target.value))
              }
              className="min-w-[100px] border border-line bg-surface px-2.5 py-2 text-sm text-foreground"
            >
              <option value="All">All</option>
              {seasons.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        )}

        {hasPosition && (
          <label className="grid gap-1.5 text-[11px] font-bold text-muted">
            POSITION
            <select
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="min-w-[100px] border border-line bg-surface px-2.5 py-2 text-sm text-foreground"
            >
              <option value="All">All</option>
              {POSITIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="grid gap-1.5 text-[11px] font-bold text-muted">
          MINIMUM GAMES
          <select
            value={minGames}
            onChange={(e) => setMinGames(Number(e.target.value))}
            className="min-w-[100px] border border-line bg-surface px-2.5 py-2 text-sm text-foreground"
          >
            {MIN_GAMES_OPTIONS.map((g) => (
              <option key={g} value={g}>
                {g === 0 ? "All" : g}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="mb-2 text-xs text-muted sm:hidden">→ 横にスクロールできます</p>

      <div className="overflow-x-auto border border-line bg-surface">
        <table className="w-full min-w-[1180px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-line">
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className="cursor-pointer select-none whitespace-nowrap px-3 py-2.5 text-left text-[11px] font-bold text-muted hover:text-foreground"
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
                  className="px-3 py-6 text-center text-sm text-muted"
                >
                  データがありません。
                </td>
              </tr>
            ) : (
              sortedRows.map((row) => (
                <tr key={row.id} className="border-b border-line/60 hover:bg-[#f6f9ff] dark:hover:bg-white/[.03]">
                  {COLUMNS.map((col) => (
                    <td
                      key={col.key}
                      className={`whitespace-nowrap px-3 py-3 font-semibold ${col.cellClassName ?? ""}`}
                    >
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
