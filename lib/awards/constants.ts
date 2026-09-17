import type { AwardKey } from "@/lib/supabase/types";

export const AWARDS_SEASON = 2025;

export const INDIVIDUAL_AWARD_KEYS: AwardKey[] = [
  "mvp",
  "defensive_player_of_the_year",
  "rookie_of_the_year",
  "sixth_man_of_the_year",
  "most_improved_player",
  "clutch_player_of_the_year",
];

export const TEAM_AWARDS: { key: AwardKey; selectionTeams: number[] }[] = [
  { key: "all_nba", selectionTeams: [1, 2, 3] },
  { key: "all_defensive", selectionTeams: [1, 2] },
  { key: "all_rookie", selectionTeams: [1, 2] },
];

const AWARD_BASE_LABEL: Record<AwardKey, string> = {
  mvp: "Most Valuable Player",
  defensive_player_of_the_year: "Defensive Player of the Year",
  rookie_of_the_year: "Rookie of the Year",
  sixth_man_of_the_year: "Sixth Man of the Year",
  most_improved_player: "Most Improved Player",
  clutch_player_of_the_year: "Clutch Player of the Year",
  all_nba: "All-NBA Team",
  all_defensive: "All-Defensive Team",
  all_rookie: "All-Rookie Team",
};

const SELECTION_TEAM_ORDINAL: Record<number, string> = {
  1: "First",
  2: "Second",
  3: "Third",
};

// selection_teamがあれば「All-NBA First Team」のように結合し、無ければ個人賞名をそのまま返す。
export function getAwardLabel(
  awardKey: AwardKey,
  selectionTeam: number | null
): string {
  if (selectionTeam === null) return AWARD_BASE_LABEL[awardKey];
  const ordinal = SELECTION_TEAM_ORDINAL[selectionTeam] ?? String(selectionTeam);
  return `${AWARD_BASE_LABEL[awardKey]} ${ordinal} Team`;
}
