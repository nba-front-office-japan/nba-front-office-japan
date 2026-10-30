import { DRAFT_2026_PICKS, type DraftPick } from "@/lib/draft/draft-2026-picks";
import history from "@/lib/draft/draft-history.json";
import { DEFAULT_DRAFT_YEAR } from "@/lib/draft-format";

// 全年分のデータを読み込むので、サーバー側だけで使う(クライアントコンポーネントから import しない)
type HistoryPick = Omit<DraftPick, "round" | "teamRaw" | "draftStatus"> & { round: number };

const HISTORY = history as Record<string, HistoryPick[]>;

export const PAST_DRAFT_YEARS = Object.keys(HISTORY).map(Number).sort((a, b) => b - a);

export const DRAFT_YEARS = [DEFAULT_DRAFT_YEAR, ...PAST_DRAFT_YEARS];

export function draftPicksForYear(year: number): DraftPick[] | null {
  if (year === DEFAULT_DRAFT_YEAR) return DRAFT_2026_PICKS;
  const picks = HISTORY[String(year)];
  if (!picks) return null;
  return picks.map((pick) => ({
    ...pick,
    teamRaw: pick.teamDisplay,
    draftStatus: `${year} Rnd ${pick.round} Pick ${pick.pickInRound}`,
  }));
}

export function draftRounds(picks: DraftPick[]): number[] {
  return [...new Set(picks.map((pick) => pick.round))].sort((a, b) => a - b);
}
