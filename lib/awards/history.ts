// 選手プロフィールの「個人賞・表彰」(player_award_records)で使う賞の定義と、表示用のまとめ方。
// /awards ページ(season_player_awards・lib/awards/constants.ts)とは別。サーバー・クライアントの両方から使う。

export type HistoryAwardKey =
  | "mvp"
  | "finals_mvp"
  | "defensive_player_of_the_year"
  | "rookie_of_the_year"
  | "most_improved_player"
  | "sixth_man_of_the_year"
  | "all_star_mvp"
  | "all_star"
  | "all_nba"
  | "all_defensive"
  | "all_rookie";

/** プロフィールでの表示順と表示名(一般的な略称はそのまま使う) */
export const HISTORY_AWARDS: { key: HistoryAwardKey; label: string; note?: string; teams?: number[] }[] = [
  { key: "mvp", label: "MVP", note: "シーズンMVP" },
  { key: "finals_mvp", label: "ファイナルMVP" },
  { key: "defensive_player_of_the_year", label: "DPOY", note: "最優秀守備選手賞" },
  { key: "rookie_of_the_year", label: "ROY", note: "新人王" },
  { key: "most_improved_player", label: "MIP", note: "最優秀躍進選手賞" },
  { key: "sixth_man_of_the_year", label: "シックスマン賞", note: "最優秀シックスマン賞" },
  { key: "all_star_mvp", label: "オールスターMVP" },
  { key: "all_nba", label: "All-NBA", note: "オールNBAチーム", teams: [1, 2, 3] },
  { key: "all_defensive", label: "All-Defensive", note: "オールディフェンシブチーム", teams: [1, 2] },
  { key: "all_rookie", label: "All-Rookie", note: "オールルーキーチーム", teams: [1, 2] },
  { key: "all_star", label: "オールスター選出" },
];

/** Excel の Award の表記 → 賞と 1st/2nd/3rd */
export const EXCEL_AWARD_MAP: Record<string, { key: HistoryAwardKey; team: number | null }> = {
  MVP: { key: "mvp", team: null },
  "Finals MVP": { key: "finals_mvp", team: null },
  DPOY: { key: "defensive_player_of_the_year", team: null },
  ROY: { key: "rookie_of_the_year", team: null },
  MIP: { key: "most_improved_player", team: null },
  "Sixth Man of the Year": { key: "sixth_man_of_the_year", team: null },
  "All-Star MVP": { key: "all_star_mvp", team: null },
  "All-Star": { key: "all_star", team: null },
  "All-NBA 1st": { key: "all_nba", team: 1 },
  "All-NBA 2nd": { key: "all_nba", team: 2 },
  "All-NBA 3rd": { key: "all_nba", team: 3 },
  "All-Defensive 1st": { key: "all_defensive", team: 1 },
  "All-Defensive 2nd": { key: "all_defensive", team: 2 },
  "All-Rookie 1st": { key: "all_rookie", team: 1 },
  "All-Rookie 2nd": { key: "all_rookie", team: 2 },
};

export const TEAM_LABEL: Record<number, string> = { 1: "1st Team", 2: "2nd Team", 3: "3rd Team" };

/** シーズン(開始年)を「2023-24」の形にする */
export function seasonLabel(season: number): string {
  return `${season}-${String((season + 1) % 100).padStart(2, "0")}`;
}

export type AwardRecord = { award_key: string; season: number; selection_team: number | null };

export type AwardSummary = {
  key: HistoryAwardKey;
  label: string;
  note?: string;
  count: number;
  /** 受賞シーズン(古い順)。チーム選出の賞では全チーム合わせたもの */
  seasons: number[];
  /** All-NBA などの 1st / 2nd / 3rd ごとの内訳(古い順) */
  byTeam?: { team: number; seasons: number[] }[];
};

/** 賞ごとに回数と受賞シーズンをまとめる(受賞のない賞は含めない) */
export function summarizeAwards(records: AwardRecord[]): AwardSummary[] {
  const out: AwardSummary[] = [];
  for (const def of HISTORY_AWARDS) {
    const rows = records.filter((r) => r.award_key === def.key);
    if (rows.length === 0) continue;
    const seasons = [...new Set(rows.map((r) => r.season))].sort((a, b) => a - b);
    const byTeam = def.teams
      ?.map((team) => ({ team, seasons: rows.filter((r) => r.selection_team === team).map((r) => r.season).sort((a, b) => a - b) }))
      .filter((t) => t.seasons.length > 0);
    out.push({ key: def.key, label: def.label, note: def.note, count: rows.length, seasons, byTeam });
  }
  return out;
}
