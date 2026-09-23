"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

export interface ProfileRow {
  id: string;
  name: string;
  nameEn: string | null;
  position: string | null;
  jerseyNumber: number | null;
  birthDate: string | null;
  age: number | null;
  heightCm: number | null;
  weightKg: number | null;
  preDraftTeam: string | null;
  nationality: string | null;
  yearsOfService: number | null;
  draftText: string | null;
  // ドラフト年・巡目・順位を並べ替え用の1つの数値にしたもの(年が新しいほど大きい)。
  draftSort: number | null;
}

type SortKey =
  | "name"
  | "position"
  | "jerseyNumber"
  | "birthDate"
  | "age"
  | "heightCm"
  | "weightKg"
  | "preDraftTeam"
  | "nationality"
  | "yearsOfService"
  | "draft";
type SortDirection = "asc" | "desc";

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "name", label: "選手名" },
  { key: "position", label: "POS" },
  { key: "jerseyNumber", label: "背番号" },
  { key: "birthDate", label: "生年月日" },
  { key: "age", label: "年齢" },
  { key: "heightCm", label: "身長" },
  { key: "weightKg", label: "体重" },
  { key: "preDraftTeam", label: "最終在籍校／直前所属" },
  { key: "nationality", label: "国籍" },
  { key: "yearsOfService", label: "経験年数" },
  { key: "draft", label: "ドラフト情報" },
];

const DASH = "—";

function isBlankText(value: string | null): boolean {
  return value === null || ["", "-", "—"].includes(value.trim());
}

// 並べ替え対象の値。空欄・「—」はnullとして扱い、方向に関係なく常に末尾へ送る。
function sortValue(row: ProfileRow, key: SortKey): string | number | null {
  switch (key) {
    case "name":
      return row.name;
    case "position":
      return isBlankText(row.position) ? null : row.position;
    case "preDraftTeam":
      return isBlankText(row.preDraftTeam) ? null : row.preDraftTeam;
    case "nationality":
      return isBlankText(row.nationality) ? null : row.nationality;
    case "birthDate": {
      if (!row.birthDate) return null;
      const time = Date.parse(row.birthDate);
      return Number.isNaN(time) ? null : time;
    }
    case "draft":
      return row.draftSort;
    default:
      return row[key];
  }
}

// cm → フィート・インチ(例: 203cm → 6'8")
function formatFeetInches(cm: number): string {
  const totalInches = Math.round(cm / 2.54);
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;
  return `${feet}'${inches}"`;
}

function formatKg(kg: number): string {
  return `${Number.isInteger(kg) ? kg : kg.toFixed(1)} kg`;
}

function formatLb(kg: number): string {
  return `${Math.round(kg * 2.20462)} lb`;
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
  sortKey: SortKey | null;
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

// 背番号・経験年数は0が有効な値のため、nullのときだけ「—」にする。
function orDash(value: string | number | null): string | number {
  return value === null || value === "" ? DASH : value;
}

export function TeamRosterProfileTable({ rows }: { rows: ProfileRow[] }) {
  // 初期表示は並べ替えなし(サーバーから渡された順)。ヘッダーを押すと降順から始まる。
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const sortedRows = useMemo(() => {
    if (!sortKey) return rows;
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

  return (
    <div className="overflow-x-auto border border-line bg-surface">
      <table className="w-full min-w-[1080px] border-collapse text-[13px]">
        <thead>
          <tr className="border-b border-line">
            {COLUMNS.map((col) => (
              <SortHeader
                key={col.key}
                label={col.label}
                columnKey={col.key}
                sortKey={sortKey}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
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
                {row.nameEn && row.nameEn !== row.name && (
                  <div className="text-xs font-normal text-muted">{row.nameEn}</div>
                )}
              </td>
              <td className="whitespace-nowrap px-2 py-3">{orDash(row.position)}</td>
              <td className="whitespace-nowrap px-2 py-3">{orDash(row.jerseyNumber)}</td>
              <td className="whitespace-nowrap px-2 py-3">{orDash(row.birthDate)}</td>
              <td className="whitespace-nowrap px-2 py-3">{orDash(row.age)}</td>
              <td className="whitespace-nowrap px-2 py-3">
                {row.heightCm !== null ? (
                  <>
                    <div>{row.heightCm} cm</div>
                    <div className="text-xs text-muted">{formatFeetInches(row.heightCm)}</div>
                  </>
                ) : (
                  DASH
                )}
              </td>
              <td className="whitespace-nowrap px-2 py-3">
                {row.weightKg !== null ? (
                  <>
                    <div>{formatKg(row.weightKg)}</div>
                    <div className="text-xs text-muted">{formatLb(row.weightKg)}</div>
                  </>
                ) : (
                  DASH
                )}
              </td>
              <td className="whitespace-nowrap px-2 py-3">{orDash(row.preDraftTeam)}</td>
              <td className="whitespace-nowrap px-2 py-3">{orDash(row.nationality)}</td>
              <td className="whitespace-nowrap px-2 py-3">{orDash(row.yearsOfService)}</td>
              <td className="whitespace-nowrap px-2 py-3">{orDash(row.draftText)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
