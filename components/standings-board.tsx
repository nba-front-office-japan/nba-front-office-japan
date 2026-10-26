"use client";

import Link from "next/link";
import { useState } from "react";
import type { StandingRow } from "@/lib/standings";
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
  if (value === null) return "—";
  if (value === 0) return "—";
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function StandingTable({ rows, label }: { rows: StandingRow[]; label: string }) {
  const ranked = rankStandings(rows);
  return (
    <section className="overflow-hidden rounded-xl border border-line bg-surface">
      <h2 className="border-b border-line px-4 py-3 text-base font-extrabold sm:px-5">{label}</h2>
      <div>
        <table className="w-full table-fixed text-xs sm:text-sm">
          <thead className="bg-background text-[11px] font-extrabold tracking-wide text-muted">
            <tr>
              <th className="w-[10%] px-1 py-2.5 text-right sm:px-3">順位</th>
              <th className="w-[52%] px-2 py-2.5 text-left sm:px-3">チーム</th>
              <th className="w-[9.5%] px-1 py-2.5 text-right sm:px-2">勝</th>
              <th className="w-[9.5%] px-1 py-2.5 text-right sm:px-2">敗</th>
              <th className="w-[9.5%] px-1 py-2.5 text-right sm:px-2">勝率</th>
              <th className="w-[9.5%] px-1 py-2.5 text-right sm:px-3"><span className="sm:hidden">差</span><span className="hidden sm:inline">ゲーム差</span></th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((row, index) => (
              <tr key={row.teamId} className="border-t border-line transition-colors hover:bg-[#f5f8ff] dark:hover:bg-white/[.04]">
                <td className="px-1 py-3 text-right font-bold tabular-nums text-muted sm:px-3">{index + 1}</td>
                <td className="px-2 py-3 sm:px-3">
                  <Link href={`/teams/${row.teamId}`} className="selection-button selection-blue group flex items-center gap-1.5 rounded-lg px-1.5 py-1 sm:gap-2.5">
                    <span
                      className="grid h-7 w-7 flex-none place-items-center rounded-full text-[9px] font-extrabold tracking-wide text-white transition-transform group-hover:scale-105 sm:h-8 sm:w-8 sm:text-[10px]"
                      style={{ backgroundColor: teamThemeBackground(row.abbreviation) ?? "#2457b7" }}
                    >
                      {row.abbreviation}
                    </span>
                    <span className="min-w-0">
                      <span className="block break-words font-bold leading-[1.35] group-hover:text-blue">{row.nameJa}</span>
                      <span className="hidden text-[10px] font-semibold tracking-wide text-muted sm:block">{row.name}</span>
                    </span>
                  </Link>
                </td>
                <td className="px-1 py-3 text-right font-bold tabular-nums sm:px-2">{row.wins}</td>
                <td className="px-1 py-3 text-right tabular-nums sm:px-2">{row.losses}</td>
                <td className="px-1 py-3 text-right tabular-nums sm:px-2">{formatPct(row.winPct)}</td>
                <td className="px-1 py-3 text-right tabular-nums sm:px-3">{formatGb(row.gamesBack)}</td>
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

      {view === "overall" && <StandingTable label="NBA全体" rows={rows} />}
      {view === "conference" && (
        <div className="grid gap-6 xl:grid-cols-2">
          <StandingTable label="イースタン・カンファレンス" rows={east} />
          <StandingTable label="ウエスタン・カンファレンス" rows={west} />
        </div>
      )}
      {view === "division" && (
        <div className="grid gap-6 xl:grid-cols-2">
          {DIVISION_ORDER.map((division) => (
            <StandingTable key={division} label={DIVISION_LABEL[division] ?? division} rows={rows.filter((row) => row.division === division)} />
          ))}
        </div>
      )}
    </div>
  );
}
