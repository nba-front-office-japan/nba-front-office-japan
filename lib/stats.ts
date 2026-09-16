// player_statsは合計値で保存されているため、平均・シュート率はここで都度算出する。
// stats-table.tsx / player-season-stats.tsx で共有する。

import type { Database } from "@/lib/supabase/types";

export interface RawStatTotals {
  gamesPlayed: number;
  points: number;
  reboundsTotal: number;
  assists: number;
  fieldGoalsMade: number;
  fieldGoalsAttempted: number;
  threePointersMade: number;
  threePointersAttempted: number;
  freeThrowsAttempted: number;
}

export interface DerivedStats {
  ppg: number | null;
  rpg: number | null;
  apg: number | null;
  fgPct: number | null;
  threePct: number | null;
  tsPct: number | null;
}

function divide(numerator: number, denominator: number): number | null {
  if (!denominator) return null;
  return numerator / denominator;
}

export function deriveStats(row: RawStatTotals): DerivedStats {
  const ppg = divide(row.points, row.gamesPlayed);
  const rpg = divide(row.reboundsTotal, row.gamesPlayed);
  const apg = divide(row.assists, row.gamesPlayed);
  const fgPct = divide(row.fieldGoalsMade, row.fieldGoalsAttempted);
  const threePct = divide(
    row.threePointersMade,
    row.threePointersAttempted
  );
  const tsDenominator =
    2 * (row.fieldGoalsAttempted + 0.44 * row.freeThrowsAttempted);
  const tsPct = divide(row.points, tsDenominator);

  return {
    ppg,
    rpg,
    apg,
    fgPct: fgPct !== null ? fgPct * 100 : null,
    threePct: threePct !== null ? threePct * 100 : null,
    tsPct: tsPct !== null ? tsPct * 100 : null,
  };
}

export function formatStat(value: number | null, digits = 1): string {
  return value === null ? "-" : value.toFixed(digits);
}

type PlayerStatsRow = Database["public"]["Tables"]["player_stats"]["Row"];

// player_statsテーブルの行(スネークケース)をRawStatTotals(キャメルケース)に変換する。
export function toRawStatTotals(row: PlayerStatsRow): RawStatTotals {
  return {
    gamesPlayed: row.games_played,
    points: row.points,
    reboundsTotal: row.rebounds_total,
    assists: row.assists,
    fieldGoalsMade: row.field_goals_made,
    fieldGoalsAttempted: row.field_goals_attempted,
    threePointersMade: row.three_pointers_made,
    threePointersAttempted: row.three_pointers_attempted,
    freeThrowsAttempted: row.free_throws_attempted,
  };
}
