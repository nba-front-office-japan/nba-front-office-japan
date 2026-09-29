import type { AgeReference } from "@/lib/age";

// Teams・Players の画面が「どのシーズンのデータを読むか」をここに集約する。
// season は開始年(例: 2025 = 2025-26シーズン)。シーズンが替わったら、この2つを更新する。

// 成績(player_stats)を表示するシーズン。チーム記録(/teams/[teamId])・PLAYERS(/stats)で使う。
export const STATS_SEASON = 2025;
// ロスター(player_season_rosters)を表示するシーズン。選手名鑑(/players)・選手ページの現在所属で使う。
export const ROSTER_SEASON = 2026;

// 2025 → "2025-26"
export function seasonLabel(season: number): string {
  return `${season}-${String((season + 1) % 100).padStart(2, "0")}`;
}

// 年齢の基準日(そのシーズンの10月1日)
export function ageReferenceFor(season: number): AgeReference {
  return { year: season, month: 10, day: 1 };
}

// 年齢の基準日の表示(例: 「2025年10月1日」)
export function ageReferenceText(season: number): string {
  const ref = ageReferenceFor(season);
  return `${ref.year}年${ref.month}月${ref.day}日`;
}
