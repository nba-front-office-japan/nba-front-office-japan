"use client";

import Link from "next/link";
import { useState } from "react";
import type { StandingRow, WinLoss } from "@/lib/standings";
import { rankStandings } from "@/lib/standings";
import { teamThemeBackground } from "@/lib/team-colors";

type View = "overall" | "conference" | "division";

const DIVISION_LABEL: Record<string, string> = {
  Atlantic: "アトランティック",
  Central: "セントラル",
  Southeast: "サウスイースト",
  Northwest: "ノースウェスト",
  Pacific: "パシフィック",
  Southwest: "サウスウェスト",
};

const DIVISION_ORDER = ["Atlantic", "Central", "Southeast", "Northwest", "Pacific", "Southwest"];

function formatPct(value: number | null): string {
  return value === null ? "—" : value.toFixed(3).replace(/^0/, "");
}

function formatGb(value: number | null): string {
  if (value === null) return "-";
  if (value === 0) return "-";
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function formatRecord(record: WinLoss): string {
  return `${record.wins}-${record.losses}`;
}

// チーム列より右の成績の列(順番は NBA.com の順位表から Neutral と OT を除いたもの)
const RECORD_COLUMNS: { label: string; title: string; width: string; render: (row: StandingRow) => string }[] = [
  { label: "CONF", title: "同カンファレンスとの対戦成績", width: "w-14", render: (row) => formatRecord(row.conferenceRecord) },
  { label: "DIV", title: "同ディビジョンとの対戦成績", width: "w-14", render: (row) => formatRecord(row.divisionRecord) },
  { label: "HOME", title: "ホームの成績", width: "w-14", render: (row) => formatRecord(row.homeRecord) },
  { label: "ROAD", title: "アウェイの成績", width: "w-14", render: (row) => formatRecord(row.roadRecord) },
  { label: "LAST10", title: "直近10試合の成績", width: "w-16", render: (row) => formatRecord(row.last10) },
  { label: "STREAK", title: "連勝・連敗", width: "w-16", render: (row) => row.streak ?? "-" },
];

function StandingTable({ rows, label }: { rows: StandingRow[]; label: string }) {
  const ranked = rankStandings(rows);
  return (
    <section className="overflow-hidden rounded-xl border border-line bg-surface">
      <h2 className="border-b border-line px-4 py-3 text-base font-extrabold sm:px-5">{label}</h2>
      {/* 列が多いので、順位とチーム名を左に固定し、成績の列を横にスクロールできるようにする */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[664px] table-fixed text-xs sm:min-w-[780px] sm:text-sm">
          <thead className="bg-background text-[11px] font-extrabold tracking-wide text-muted">
            <tr>
              <th className="sticky left-0 z-10 w-9 bg-background px-1 py-2.5 text-right sm:w-12 sm:px-3">順位</th>
              <th className="sticky left-9 z-10 w-32 bg-background px-2 py-2.5 text-left sm:left-12 sm:w-56 sm:px-3">チーム</th>
              <th title="勝ち" className="w-9 px-1 py-2.5 text-right">W</th>
              <th title="負け" className="w-9 px-1 py-2.5 text-right">L</th>
              <th title="勝率" className="w-14 px-1 py-2.5 text-right">WIN%</th>
              <th title="首位とのゲーム差" className="w-11 px-1 py-2.5 text-right">GB</th>
              {RECORD_COLUMNS.map((column) => (
                <th key={column.label} title={column.title} className={`${column.width} px-1 py-2.5 text-right last:pr-3`}>
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ranked.map((row, index) => (
              <tr key={row.teamId} className="border-t border-line">
                <td className="sticky left-0 z-10 bg-surface px-1 py-3 text-right font-bold tabular-nums text-muted sm:px-3">{index + 1}</td>
                <td className="sticky left-9 z-10 bg-surface px-2 py-3 sm:left-12 sm:px-3">
                  <Link href={`/teams/${row.teamId}`} className="selection-button selection-blue group flex items-center gap-1.5 rounded-lg px-1.5 py-1 sm:gap-2.5">
                    <span
                      className="grid h-7 w-7 flex-none place-items-center rounded-full text-[9px] font-extrabold tracking-wide text-white transition-transform group-hover:scale-105 sm:h-8 sm:w-8 sm:text-[10px]"
                      style={{ backgroundColor: teamThemeBackground(row.abbreviation) ?? "#2457b7" }}
                    >
                      {row.abbreviation}
                    </span>
                    <span className="min-w-0">
                      <span className="selection-blue-text block break-words font-bold leading-[1.35]">{row.nameJa}</span>
                      <span className="selection-blue-muted hidden text-[10px] font-semibold tracking-wide text-muted sm:block">{row.name}</span>
                    </span>
                  </Link>
                </td>
                <td className="px-1 py-3 text-right font-bold tabular-nums">{row.wins}</td>
                <td className="px-1 py-3 text-right tabular-nums">{row.losses}</td>
                <td className="px-1 py-3 text-right tabular-nums">{formatPct(row.winPct)}</td>
                <td className="px-1 py-3 text-right tabular-nums">{formatGb(row.gamesBack)}</td>
                {RECORD_COLUMNS.map((column) => (
                  <td key={column.label} className="px-1 py-3 text-right tabular-nums last:pr-3">
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function StandingsBoard({ rows }: { rows: StandingRow[] }) {
  const [view, setView] = useState<View>("conference");
  const east = rows.filter((row) => row.conference === "East");
  const west = rows.filter((row) => row.conference === "West");

  const tabs: { key: View; label: string }[] = [
    { key: "overall", label: "全体" },
    { key: "conference", label: "カンファレンス" },
    { key: "division", label: "ディビジョン" },
  ];

  return (
    <div>
      <div role="tablist" aria-label="順位表の表示単位" className="mb-5 inline-flex overflow-hidden rounded-xl border border-line bg-surface p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={view === tab.key}
            onClick={() => setView(tab.key)}
            className={`selection-button selection-blue min-h-10 px-4 text-sm font-extrabold transition-all duration-200 sm:px-5 ${view === tab.key ? "bg-navy text-white" : "text-muted hover:bg-background hover:text-foreground"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <p className="mb-2 text-xs text-muted sm:hidden">→ 横にスクロールできます</p>

      {view === "overall" && <StandingTable label="NBA全体" rows={rows} />}
      {view === "conference" && (
        <div className="grid grid-cols-1 gap-6">
          <StandingTable label="イースタン・カンファレンス" rows={east} />
          <StandingTable label="ウエスタン・カンファレンス" rows={west} />
        </div>
      )}
      {view === "division" && (
        <div className="grid grid-cols-1 gap-6">
          {DIVISION_ORDER.map((division) => (
            <StandingTable key={division} label={DIVISION_LABEL[division] ?? division} rows={rows.filter((row) => row.division === division)} />
          ))}
        </div>
      )}
    </div>
  );
}
