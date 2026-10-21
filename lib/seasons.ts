import type { AgeReference } from "@/lib/age";

// Teams・Players の画面が「どのシーズンのデータを読むか」をここに集約する。
// season は開始年(例: 2025 = 2025-26シーズン)。シーズンが替わったら、この2つを更新する。

// 成績(player_stats)を表示するシーズン。チーム記録(/teams/[teamId])・PLAYERS(/stats)で使う。
export const STATS_SEASON = 2025;
// ロスター(player_season_rosters)を表示するシーズン。選手名鑑(/players)・選手ページの現在所属で使う。
export const ROSTER_SEASON = 2026;

// Teams(/teams)・選手名鑑(/players)で選べるシーズン(新しい順)。初期表示は DEFAULT_SEASON。
// ・2026-27: ロスターは固定スナップショット(roster_snapshots)。成績は登録されたら表示する(未登録の間は「未登録」と表示)
// ・2025-26: 成績(player_stats)から復元したチーム記録
export const SEASON_OPTIONS = [2026, 2025] as const;
export const DEFAULT_SEASON = ROSTER_SEASON;

// URL の ?season= を読み取る。選べるシーズン以外(未指定・不正な値)は初期表示のシーズンにする
export function parseSeasonParam(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const season = Number(raw);
  return (SEASON_OPTIONS as readonly number[]).includes(season) ? season : DEFAULT_SEASON;
}

// シーズンを URL の検索パラメータに入れる。初期表示のシーズンは付けない(?season= なしの URL が初期表示)
export function seasonSearch(season: number, extra: Record<string, string | null | undefined> = {}): string {
  const params = new URLSearchParams();
  if (season !== DEFAULT_SEASON) params.set("season", String(season));
  for (const [key, value] of Object.entries(extra)) {
    if (value) params.set(key, value);
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}

// シーズン切り替え(SeasonSelect)の選択肢。basePath に各シーズンの ?season= と extra の検索パラメータを付ける
export function seasonOptionLinks(basePath: string, extra: Record<string, string | null | undefined> = {}) {
  return SEASON_OPTIONS.map((season) => ({
    season,
    label: seasonLabel(season),
    href: `${basePath}${seasonSearch(season, extra)}`,
  }));
}

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
