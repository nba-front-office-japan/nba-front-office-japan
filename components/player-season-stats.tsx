"use client";

import { useMemo, useState } from "react";
import type { Database } from "@/lib/supabase/types";
import {
  aggregateRawStatTotals,
  deriveStats,
  formatSeasonLabel,
  formatStat,
  type RawStatTotals,
} from "@/lib/stats";

type SeasonType =
  Database["public"]["Tables"]["player_stats"]["Row"]["season_type"];

export interface PlayerStatRow extends RawStatTotals {
  id: string;
  season: number;
  teamLabel: string;
  seasonType: SeasonType;
  /** team_id が NULL の合計行（移籍シーズンのTOT行）かどうか。 */
  isTotal: boolean;
}

interface DisplayRow extends RawStatTotals {
  key: string;
  season: number;
  teamLabel: string;
}

const TOTAL_LABEL = "TOT";

// 1シーズン＝1行に畳む。移籍シーズンは合計だけを見せ、チーム別の内訳は出さない。
// ・合計行(team_id=NULL)があればそれを採用する
// ・無い場合でも複数チームの行があれば、その場で合算して1行にする
//   （2025-26の既存データは合計行を持たずチーム別行だけで入っているため）
function collapseSeasons(rows: PlayerStatRow[]): DisplayRow[] {
  const bySeason = new Map<number, PlayerStatRow[]>();
  for (const row of rows) {
    const bucket = bySeason.get(row.season);
    if (bucket) bucket.push(row);
    else bySeason.set(row.season, [row]);
  }

  return [...bySeason.entries()]
    .sort(([a], [b]) => b - a)
    .map(([season, seasonRows]) => {
      const totalRow = seasonRows.find((r) => r.isTotal);
      if (totalRow) {
        return { ...totalRow, key: totalRow.id, season, teamLabel: TOTAL_LABEL };
      }
      if (seasonRows.length === 1) {
        return { ...seasonRows[0], key: seasonRows[0].id, season };
      }
      return {
        ...aggregateRawStatTotals(seasonRows),
        key: `season-${season}`,
        season,
        teamLabel: TOTAL_LABEL,
      };
    });
}

export function PlayerSeasonStats({ rows }: { rows: PlayerStatRow[] }) {
  const [seasonType, setSeasonType] = useState<SeasonType>("regular_season");

  const displayRows = useMemo(
    () => collapseSeasons(rows.filter((r) => r.seasonType === seasonType)),
    [rows, seasonType]
  );

  const headers = [
    "シーズン",
    "チーム",
    "G",
    "MPG",
    "PTS",
    "REB",
    "AST",
    "FG%",
    "3P%",
    "FT%",
  ];

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
        <table className="w-full min-w-[620px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-line">
              {headers.map((label) => (
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
            {displayRows.length === 0 ? (
              <tr>
                <td
                  colSpan={headers.length}
                  className="px-3 py-6 text-center text-sm text-muted"
                >
                  データがありません。
                </td>
              </tr>
            ) : (
              displayRows.map((row) => {
                const stats = deriveStats(row);
                return (
                  <tr key={row.key} className="border-b border-line/60">
                    <td className="whitespace-nowrap px-3 py-3 font-bold">
                      {formatSeasonLabel(row.season)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-muted">
                      {row.teamLabel}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 font-semibold">
                      {row.gamesPlayed}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 font-semibold">
                      {formatStat(stats.mpg)}
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
                      {formatStat(stats.ftPct)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-2 text-xs text-muted">
        PTS・REB・ASTは1試合平均です。同一シーズンに複数チームでプレーした場合は合計のみを
        <span className="font-semibold"> TOT </span>
        として表示します。
      </p>
    </div>
  );
}
