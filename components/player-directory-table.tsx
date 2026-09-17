"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { deriveStats, formatStat, formatPct, type RawStatTotals } from "@/lib/stats";

export interface PlayerDirectoryRow extends RawStatTotals {
  id: string;
  playerName: string;
  englishName: string;
  teamLabel: string;
  position: string | null;
}

interface DerivedRow extends PlayerDirectoryRow {
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

type SortKey =
  | "playerName"
  | "teamLabel"
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
  | "pfPg";

// Stats Labと同じ列(選手名、チーム、POS、G、MP、PTS、ORB、DRB、TRB、AST、STL、BLK、
// FG%、3P%、FT%、TOV、PF)を、同じ並び順で表示する。選手名は選手詳細ページへのリンクにする。
const COLUMNS: {
  key: SortKey;
  label: string;
  render: (row: DerivedRow) => ReactNode;
  cellClassName?: string;
}[] = [
  {
    key: "playerName",
    label: "選手名",
    render: (row) => (
      <Link
        href={`/players/${row.id}`}
        title={row.playerName}
        className="block truncate font-medium hover:text-blue"
      >
        {row.playerName}
      </Link>
    ),
    cellClassName: "max-w-[160px]",
  },
  {
    key: "teamLabel",
    label: "チーム",
    render: (row) => row.teamLabel,
    cellClassName: "text-muted",
  },
  { key: "position", label: "POS", render: (row) => row.position ?? "-" },
  { key: "gamesPlayed", label: "G", render: (row) => row.gamesPlayed },
  { key: "mpg", label: "MP", render: (row) => formatStat(row.mpg) },
  { key: "ppg", label: "PTS", render: (row) => formatStat(row.ppg) },
  { key: "orbPg", label: "ORB", render: (row) => formatStat(row.orbPg) },
  { key: "drbPg", label: "DRB", render: (row) => formatStat(row.drbPg) },
  { key: "rpg", label: "TRB", render: (row) => formatStat(row.rpg) },
  { key: "apg", label: "AST", render: (row) => formatStat(row.apg) },
  { key: "stlPg", label: "STL", render: (row) => formatStat(row.stlPg) },
  { key: "blkPg", label: "BLK", render: (row) => formatStat(row.blkPg) },
  { key: "fgPct", label: "FG%", render: (row) => formatPct(row.fgPct) },
  { key: "threePct", label: "3P%", render: (row) => formatPct(row.threePct) },
  { key: "ftPct", label: "FT%", render: (row) => formatPct(row.ftPct) },
  { key: "tovPg", label: "TOV", render: (row) => formatStat(row.tovPg) },
  { key: "pfPg", label: "PF", render: (row) => formatStat(row.pfPg) },
];

const POSITIONS = ["G", "F", "C", "G-F", "F-C", "F-G", "C-F"];
const MIN_GAMES_OPTIONS = [0, 20, 50];

function deriveRow(row: PlayerDirectoryRow): DerivedRow {
  return { ...row, ...deriveStats(row) };
}

export function PlayerDirectoryTable({
  rows,
  teamOptions,
}: {
  rows: PlayerDirectoryRow[];
  teamOptions: string[];
}) {
  const [nameQuery, setNameQuery] = useState("");
  const [team, setTeam] = useState<string>("All");
  const [position, setPosition] = useState<string>("All");
  const [minGames, setMinGames] = useState(0);
  const [sortKey, setSortKey] = useState<SortKey>("ppg");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const derivedRows = useMemo(() => {
    const q = nameQuery.trim().toLowerCase();
    return rows
      .filter(
        (r) =>
          q === "" ||
          r.playerName.toLowerCase().includes(q) ||
          r.englishName.toLowerCase().includes(q)
      )
      .filter((r) => team === "All" || r.teamLabel === team)
      .filter((r) => position === "All" || r.position === position)
      .filter((r) => r.gamesPlayed >= minGames)
      .map(deriveRow);
  }, [rows, nameQuery, team, position, minGames]);

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
        <label className="grid gap-1.5 text-[11px] font-bold text-muted">
          選手名で検索
          <input
            type="text"
            value={nameQuery}
            onChange={(e) => setNameQuery(e.target.value)}
            placeholder="日本語名・英語名で検索"
            className="min-w-[160px] border border-line bg-surface px-2.5 py-2 text-sm text-foreground outline-none focus:border-blue"
          />
        </label>

        <label className="grid gap-1.5 text-[11px] font-bold text-muted">
          TEAM
          <select
            value={team}
            onChange={(e) => setTeam(e.target.value)}
            className="min-w-[100px] border border-line bg-surface px-2.5 py-2 text-sm text-foreground"
          >
            <option value="All">All</option>
            {teamOptions.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>

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

      <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">
        1試合平均
      </p>
      <p className="mb-2 text-xs text-muted sm:hidden">→ 横にスクロールできます</p>

      <div className="overflow-x-auto border border-line bg-surface">
        <table className="w-full min-w-[900px] border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-line">
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className="cursor-pointer select-none whitespace-nowrap px-1.5 py-2.5 text-left text-[11px] font-bold text-muted hover:text-foreground"
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
                  該当する選手が見つかりません。
                </td>
              </tr>
            ) : (
              sortedRows.map((row) => (
                <tr key={row.id} className="border-b border-line/60 hover:bg-[#f6f9ff] dark:hover:bg-white/[.03]">
                  {COLUMNS.map((col) => (
                    <td
                      key={col.key}
                      className={`whitespace-nowrap px-1.5 py-3 font-semibold ${col.cellClassName ?? ""}`}
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
