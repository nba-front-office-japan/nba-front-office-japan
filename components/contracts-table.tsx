"use client";

import { useMemo, useState } from "react";

export interface ContractRow {
  id: string;
  playerName: string;
  teamLabel: string;
  season: number;
  salary: number;
  contractType: string | null;
  isPlayerOption: boolean;
  isTeamOption: boolean;
  isGuaranteed: boolean;
}

type SortKey =
  | "playerName"
  | "teamLabel"
  | "season"
  | "salary"
  | "contractType"
  | "isPlayerOption"
  | "isTeamOption"
  | "isGuaranteed";

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "playerName", label: "選手名" },
  { key: "teamLabel", label: "チーム" },
  { key: "season", label: "シーズン" },
  { key: "salary", label: "年俸" },
  { key: "contractType", label: "契約種別" },
  { key: "isPlayerOption", label: "POオプション" },
  { key: "isTeamOption", label: "TOオプション" },
  { key: "isGuaranteed", label: "保証" },
];

function sortValue(row: ContractRow, key: SortKey): string | number {
  const value = row[key];
  if (typeof value === "boolean") return value ? 1 : 0;
  return value ?? "";
}

function formatSalary(salary: number): string {
  return `$${salary.toLocaleString("en-US")}`;
}

export function ContractsTable({ rows }: { rows: ContractRow[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("salary");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const sortedRows = useMemo(() => {
    const sorted = [...rows].sort((a, b) => {
      const aValue = sortValue(a, sortKey);
      const bValue = sortValue(b, sortKey);

      if (typeof aValue === "string" && typeof bValue === "string") {
        return aValue.localeCompare(bValue);
      }

      const aNum = typeof aValue === "number" ? aValue : 0;
      const bNum = typeof bValue === "number" ? bValue : 0;
      return aNum - bNum;
    });

    if (sortDirection === "desc") sorted.reverse();
    return sorted;
  }, [rows, sortKey, sortDirection]);

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("desc");
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse text-sm">
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
                契約データがありません。
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
                <td className="whitespace-nowrap px-3 py-2">{row.season}</td>
                <td className="whitespace-nowrap px-3 py-2">
                  {formatSalary(row.salary)}
                </td>
                <td className="whitespace-nowrap px-3 py-2">
                  {row.contractType ?? "-"}
                </td>
                <td className="whitespace-nowrap px-3 py-2">
                  {row.isPlayerOption ? "あり" : "なし"}
                </td>
                <td className="whitespace-nowrap px-3 py-2">
                  {row.isTeamOption ? "あり" : "なし"}
                </td>
                <td className="whitespace-nowrap px-3 py-2">
                  {row.isGuaranteed ? "あり" : "なし"}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
