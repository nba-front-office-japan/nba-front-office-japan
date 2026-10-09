// 年度別アワード(/awards)のマスターデータ(nba_season_awards)の定義。サーバー・クライアントの両方から使う。
// 選手プロフィール用の表彰履歴(player_award_records・lib/awards/history.ts)とは別のデータ。

export type SeasonAwardKey =
  | "mvp"
  | "rookie_of_the_year"
  | "defensive_player_of_the_year"
  | "most_improved_player"
  | "sixth_man_of_the_year"
  | "finals_mvp"
  | "conference_finals_mvp"
  | "clutch_player_of_the_year"
  | "all_star_mvp"
  | "all_nba"
  | "all_defensive"
  | "all_rookie"
  | "all_star";

/** 個人賞(/awards の「主要賞」)の表示順と表示名 */
export const SEASON_MAJOR_AWARDS: { key: SeasonAwardKey; label: string; note?: string }[] = [
  { key: "mvp", label: "MVP", note: "シーズンMVP" },
  { key: "finals_mvp", label: "ファイナルMVP" },
  { key: "conference_finals_mvp", label: "カンファレンス・ファイナルMVP" },
  { key: "defensive_player_of_the_year", label: "DPOY", note: "最優秀守備選手賞" },
  { key: "rookie_of_the_year", label: "ROY", note: "新人王" },
  { key: "most_improved_player", label: "MIP", note: "最優秀躍進選手賞" },
  { key: "sixth_man_of_the_year", label: "シックスマン賞", note: "最優秀シックスマン賞" },
  { key: "clutch_player_of_the_year", label: "クラッチ・プレーヤー賞", note: "Clutch Player of the Year" },
  { key: "all_star_mvp", label: "オールスターMVP" },
];

/** チーム表彰(1st / 2nd / 3rd Team) */
export const SEASON_TEAM_AWARDS: { key: SeasonAwardKey; label: string; note: string }[] = [
  { key: "all_nba", label: "All-NBA", note: "オールNBAチーム" },
  { key: "all_defensive", label: "All-Defensive", note: "オールディフェンシブチーム" },
  { key: "all_rookie", label: "All-Rookie", note: "オールルーキーチーム" },
];

export const DETAIL_LABEL: Record<string, string> = {
  "1st": "1st Team",
  "2nd": "2nd Team",
  "3rd": "3rd Team",
  East: "イースト",
  West: "ウエスト",
};

/** Excel(Awards Data シート)の Award の表記 → 賞。区分(Detail)として使える値 */
export const MASTER_AWARD_MAP: Record<string, { key: SeasonAwardKey; details: string[] }> = {
  MVP: { key: "mvp", details: [""] },
  ROY: { key: "rookie_of_the_year", details: [""] },
  DPOY: { key: "defensive_player_of_the_year", details: [""] },
  MIP: { key: "most_improved_player", details: [""] },
  "Sixth Man": { key: "sixth_man_of_the_year", details: [""] },
  "Finals MVP": { key: "finals_mvp", details: [""] },
  "Conference Finals MVP": { key: "conference_finals_mvp", details: ["East", "West"] },
  "Clutch Player": { key: "clutch_player_of_the_year", details: [""] },
  "All-Star MVP": { key: "all_star_mvp", details: [""] },
  "All-NBA": { key: "all_nba", details: ["1st", "2nd", "3rd"] },
  "All-Defensive": { key: "all_defensive", details: ["1st", "2nd"] },
  "All-Rookie": { key: "all_rookie", details: ["1st", "2nd"] },
};

export const MASTER_AWARD_LABEL: Record<SeasonAwardKey, string> = {
  ...Object.fromEntries(SEASON_MAJOR_AWARDS.map((a) => [a.key, a.label])),
  ...Object.fromEntries(SEASON_TEAM_AWARDS.map((a) => [a.key, a.label])),
  all_star: "オールスター選出",
} as Record<SeasonAwardKey, string>;
