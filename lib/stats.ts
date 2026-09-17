// player_statsは合計値で保存されているため、平均・シュート率はここで都度算出する。
// stats-table.tsx / player-season-stats.tsx / player-header.tsx で共有する。

import type { Database } from "@/lib/supabase/types";

export interface RawStatTotals {
  gamesPlayed: number;
  minutesPlayed: number;
  points: number;
  reboundsOffensive: number;
  reboundsDefensive: number;
  reboundsTotal: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  personalFouls: number;
  fieldGoalsMade: number;
  fieldGoalsAttempted: number;
  threePointersMade: number;
  threePointersAttempted: number;
  freeThrowsMade: number;
  freeThrowsAttempted: number;
}

export interface DerivedStats {
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
  tsPct: number | null;
}

function divide(numerator: number, denominator: number): number | null {
  if (!denominator) return null;
  return numerator / denominator;
}

function perGame(total: number, gamesPlayed: number): number | null {
  return divide(total, gamesPlayed);
}

function pct(made: number, attempted: number): number | null {
  const value = divide(made, attempted);
  return value !== null ? value * 100 : null;
}

export function deriveStats(row: RawStatTotals): DerivedStats {
  const tsDenominator = 2 * (row.fieldGoalsAttempted + 0.44 * row.freeThrowsAttempted);

  return {
    ppg: perGame(row.points, row.gamesPlayed),
    rpg: perGame(row.reboundsTotal, row.gamesPlayed),
    apg: perGame(row.assists, row.gamesPlayed),
    mpg: perGame(row.minutesPlayed, row.gamesPlayed),
    orbPg: perGame(row.reboundsOffensive, row.gamesPlayed),
    drbPg: perGame(row.reboundsDefensive, row.gamesPlayed),
    stlPg: perGame(row.steals, row.gamesPlayed),
    blkPg: perGame(row.blocks, row.gamesPlayed),
    tovPg: perGame(row.turnovers, row.gamesPlayed),
    pfPg: perGame(row.personalFouls, row.gamesPlayed),
    fgPct: pct(row.fieldGoalsMade, row.fieldGoalsAttempted),
    threePct: pct(row.threePointersMade, row.threePointersAttempted),
    ftPct: pct(row.freeThrowsMade, row.freeThrowsAttempted),
    tsPct: divide(row.points, tsDenominator) !== null
      ? (divide(row.points, tsDenominator) as number) * 100
      : null,
  };
}

export function formatStat(value: number | null, digits = 1): string {
  return value === null ? "-" : value.toFixed(digits);
}

export function formatPct(value: number | null, digits = 1): string {
  return value === null ? "-" : `${value.toFixed(digits)}%`;
}

// 選手個人の「シーズン全体」の成績行を選ぶ（移籍していればTOT行(team_id=NULL)を
// 優先し、無ければ単独チーム分の行を使う）。チームページ・選手詳細ページ双方で使う。
export function pickPrimarySeasonRow<T extends { team_id: string | null }>(
  rows: T[]
): T | undefined {
  return rows.find((r) => r.team_id === null) ?? rows[0];
}

type PlayerStatsRow = Database["public"]["Tables"]["player_stats"]["Row"];

// player_statsテーブルの行(スネークケース)をRawStatTotals(キャメルケース)に変換する。
export function toRawStatTotals(row: PlayerStatsRow): RawStatTotals {
  return {
    gamesPlayed: row.games_played,
    minutesPlayed: row.minutes_played,
    points: row.points,
    reboundsOffensive: row.rebounds_offensive,
    reboundsDefensive: row.rebounds_defensive,
    reboundsTotal: row.rebounds_total,
    assists: row.assists,
    steals: row.steals,
    blocks: row.blocks,
    turnovers: row.turnovers,
    personalFouls: row.personal_fouls,
    fieldGoalsMade: row.field_goals_made,
    fieldGoalsAttempted: row.field_goals_attempted,
    threePointersMade: row.three_pointers_made,
    threePointersAttempted: row.three_pointers_attempted,
    freeThrowsMade: row.free_throws_made,
    freeThrowsAttempted: row.free_throws_attempted,
  };
}
