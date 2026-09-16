"use client";

import { useMemo, useState, type ReactNode } from "react";

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

function formatSalary(salary: number): string {
  return `$${salary.toLocaleString("en-US")}`;
}

// 選手名の次に年俸（本サイトの目玉情報）を並べ、モバイル幅でも先に見えるようにする。
const COLUMNS: {
  key: SortKey;
  label: string;
  render: (row: ContractRow) => ReactNode;
  cellClassName?: string;
}[] = [
  {
    key: "playerName",
    label: "選手名",
    render: (row) => row.playerName,
    cellClassName: "font-medium",
  },
  {
    key: "salary",
    label: "年俸",
    render: (row) => formatSalary(row.salary),
  },
  {
    key: "teamLabel",
    label: "チーム",
    render: (row) => row.teamLabel,
    cellClassName: "text-muted",
  },
  { key: "season", label: "シーズン", render: (row) => row.season },
  {
    key: "contractType",
    label: "契約種別",
    render: (row) => row.contractType ?? "-",
  },
  {
    key: "isPlayerOption",
    label: "POオプション",
    render: (row) => (row.isPlayerOption ? "あり" : "なし"),
  },
  {
    key: "isTeamOption",
    label: "TOオプション",
    render: (row) => (row.isTeamOption ? "あり" : "なし"),
  },
  {
    key: "isGuaranteed",
    label: "保証",
    render: (row) => (row.isGuaranteed ? "あり" : "なし"),
  },
];

function sortValue(row: ContractRow, key: SortKey): string | number {
  const value = row[key];
  if (typeof value === "boolean") return value ? 1 : 0;
  return value ?? "";
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
    <div>
      <p className="mb-2 text-xs text-muted sm:hidden">→ 横にスクロールできます</p>
      <div className="overflow-x-auto border border-line bg-surface">
        <table className="w-full min-w-[720px] border-collapse text-sm">
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
                  契約データがありません。
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
