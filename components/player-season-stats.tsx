"use client";

import { useMemo, useState } from "react";
import type { Database } from "@/lib/supabase/types";
import { deriveStats, formatStat, type RawStatTotals } from "@/lib/stats";

type SeasonType =
  Database["public"]["Tables"]["player_stats"]["Row"]["season_type"];

export interface PlayerStatRow extends RawStatTotals {
  id: string;
  season: number;
  teamLabel: string;
  seasonType: SeasonType;
}

export function PlayerSeasonStats({ rows }: { rows: PlayerStatRow[] }) {
  const [seasonType, setSeasonType] = useState<SeasonType>("regular_season");

  const filteredRows = useMemo(
    () =>
      rows
        .filter((r) => r.seasonType === seasonType)
        .sort((a, b) => a.season - b.season),
    [rows, seasonType]
  );

  return (
    <div>
      <div className="mb-4 flex gap-2">
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

      <p className="mb-2 text-xs text-muted sm:hidden">→ 横にスクロールできます</p>

      <div className="overflow-x-auto border border-line bg-surface">
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-line">
              {[
                "シーズン",
                "チーム",
                "試合数",
                "PPG",
                "RPG",
                "APG",
                "FG%",
                "3P%",
                "TS%",
              ].map((label) => (
                <th
                  key={label}
                  className="whitespace-nowrap px-3 py-2.5 text-left text-[11px] font-bold text-muted"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-3 py-6 text-center text-sm text-muted">
                  データがありません。
                </td>
              </tr>
            ) : (
              filteredRows.map((row) => {
                const stats = deriveStats(row);
                return (
                  <tr key={row.id} className="border-b border-line/60">
                    <td className="whitespace-nowrap px-3 py-3 font-bold">
                      {row.season}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-muted">
                      {row.teamLabel}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 font-semibold">
                      {row.gamesPlayed}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 font-semibold">
                      {formatStat(stats.ppg)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 font-semibold">
                      {formatStat(stats.rpg)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 font-semibold">
                      {formatStat(stats.apg)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 font-semibold">
                      {formatStat(stats.fgPct)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 font-semibold">
                      {formatStat(stats.threePct)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 font-semibold">
                      {formatStat(stats.tsPct)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
