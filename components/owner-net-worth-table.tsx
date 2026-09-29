"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { TeamColorChip } from "@/components/team-color-chip";
import { formatValueOku } from "@/lib/valuations";
import { formatUsdBillions, OWNER_ROLE_LABEL, type OwnerNetWorthRow } from "@/lib/owner-net-worth";

type SortKey = "rank" | "netWorthUsd";
type SortDirection = "asc" | "desc";

const COLUMN_COUNT = 5;

// 横スクロール時も「順位」「オーナー」の列を左端に固定する(背景を塗って下の列が透けないようにする)
const STICKY_RANK = "sticky left-0 z-10 w-12 min-w-12 bg-surface";
const STICKY_OWNER = "sticky left-12 z-10 min-w-[9.5rem] bg-surface";
const ROW_HOVER_STICKY = "group-hover:bg-[#f6f9ff] dark:group-hover:bg-[#151f34]";

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

function OwnerCell({ row }: { row: OwnerNetWorthRow }) {
  return (
    <>
      <b className="block font-semibold">{row.ownerName}</b>
      <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-muted">
        {OWNER_ROLE_LABEL[row.ownerRole]}
        {row.isFamilyEstimate && (
          <span className="border border-gold px-1 text-[10px] font-bold leading-4">一族合算</span>
        )}
      </span>
    </>
  );
}

function TeamCell({ row }: { row: OwnerNetWorthRow }) {
  return (
    <span className="flex items-center gap-2">
      <TeamColorChip abbreviation={row.teamAbbr} />
      <span>
        <Link
          href={`/players/guide/${row.teamId}?view=team-profile`}
          className="font-semibold hover:text-blue"
        >
          {row.teamName}
        </Link>
        <span className="block text-[11px] text-muted">{row.teamAbbr}</span>
      </span>
    </span>
  );
}

function DividerRow({ label, note }: { label: string; note: string }) {
  return (
    <tr className="border-b border-line bg-background/60">
      <td colSpan={COLUMN_COUNT} className="px-2 py-2 text-[11px] text-muted">
        <b className="font-bold text-foreground">{label}</b>
        <span className="ml-2">{note}</span>
      </td>
    </tr>
  );
}

export function OwnerNetWorthTable({ rows }: { rows: OwnerNetWorthRow[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("rank");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // 並べ替えは順位のある行だけ。推定値なし・順位対象外は常に表の最後に置く
  const ranked = useMemo(() => {
    const factor = sortDirection === "asc" ? 1 : -1;
    return rows
      .filter((r) => r.group === "ranked")
      .sort((a, b) => {
        const diff =
          sortKey === "rank" ? (a.rank ?? 0) - (b.rank ?? 0) : (a.netWorthUsd ?? 0) - (b.netWorthUsd ?? 0);
        return factor * diff || a.teamName.localeCompare(b.teamName);
      });
  }, [rows, sortKey, sortDirection]);
  const noValue = rows.filter((r) => r.group === "no_value");
  const excluded = rows.filter((r) => r.group === "excluded");

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection(key === "rank" ? "asc" : "desc");
    }
  }

  if (rows.length === 0) {
    return <p className="text-sm text-muted">オーナー資産のデータがありません。</p>;
  }

  const headerProps = { sortKey, sortDirection, onSort: handleSort };

  const unrankedRow = (row: OwnerNetWorthRow, amountLabel: string) => (
    <tr key={row.teamId} className="group border-b border-line/60 hover:bg-[#f6f9ff] dark:hover:bg-white/[.03]">
      <td className={`${STICKY_RANK} ${ROW_HOVER_STICKY} whitespace-nowrap px-2 py-3 text-muted`}>—</td>
      <td className={`${STICKY_OWNER} ${ROW_HOVER_STICKY} px-2 py-3`}>
        <OwnerCell row={row} />
        {row.exclusionReason && (
          <span className="mt-1 block text-[11px] text-muted">{row.exclusionReason}</span>
        )}
      </td>
      <td className="whitespace-nowrap px-2 py-3 text-muted">{amountLabel}</td>
      <td className="whitespace-nowrap px-2 py-3">
        <TeamCell row={row} />
      </td>
      <td className="whitespace-nowrap px-2 py-3 text-muted">—</td>
    </tr>
  );

  return (
    <div>
      <p className="mb-2 text-xs text-muted sm:hidden">→ 横にスクロールできます</p>
      <div className="overflow-x-auto border border-line bg-surface">
        <table className="w-full min-w-[600px] border-collapse text-[13px] sm:min-w-[720px]">
          <thead>
            <tr className="border-b border-line">
              <SortHeader label="順位" columnKey="rank" className={STICKY_RANK} {...headerProps} />
              <th
                className={`whitespace-nowrap px-2 py-3 text-left text-[11px] font-bold text-muted ${STICKY_OWNER}`}
              >
                オーナー
              </th>
              <SortHeader label="推定資産額" columnKey="netWorthUsd" {...headerProps} />
              <th className="whitespace-nowrap px-2 py-3 text-left text-[11px] font-bold text-muted">チーム</th>
              <th className="whitespace-nowrap px-2 py-3 text-left text-[11px] font-bold text-muted">出典</th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((row) => (
              <tr
                key={row.teamId}
                className="group border-b border-line/60 hover:bg-[#f6f9ff] dark:hover:bg-white/[.03]"
              >
                <td className={`${STICKY_RANK} ${ROW_HOVER_STICKY} whitespace-nowrap px-2 py-3 font-bold`}>
                  {row.rank}
                </td>
                <td className={`${STICKY_OWNER} ${ROW_HOVER_STICKY} px-2 py-3`}>
                  <OwnerCell row={row} />
                </td>
                <td className="whitespace-nowrap px-2 py-3">
                  <b className="block font-semibold">{formatValueOku(row.netWorthUsd ?? 0)}億ドル</b>
                  <span className="block text-[11px] text-muted">{formatUsdBillions(row.netWorthUsd ?? 0)}</span>
                </td>
                <td className="whitespace-nowrap px-2 py-3">
                  <TeamCell row={row} />
                </td>
                <td className="whitespace-nowrap px-2 py-3">
                  {row.profileUrl ? (
                    <a
                      href={row.profileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue underline-offset-2 hover:underline"
                    >
                      Forbes ↗
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
            {noValue.length > 0 && (
              <DividerRow
                label={`推定値なし（${noValue.length}チーム）`}
                note="出典に現在の推定額が掲載されていないため、順位を付けていません。"
              />
            )}
            {noValue.map((row) => unrankedRow(row, "推定値なし"))}
            {excluded.length > 0 && (
              <DividerRow label={`順位対象外（${excluded.length}チーム）`} note="法人所有などのため順位の対象外です。" />
            )}
            {excluded.map((row) => unrankedRow(row, "対象外"))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
