export type StandingRow = {
  teamId: string;
  abbreviation: string;
  name: string;
  nameJa: string;
  conference: "East" | "West";
  division: string;
  wins: number;
  losses: number;
  winPct: number | null;
  gamesBack: number | null;
};

export function rankStandings(rows: StandingRow[]): StandingRow[] {
  const ordered = [...rows].sort((a, b) => {
    const aPct = a.winPct ?? -1;
    const bPct = b.winPct ?? -1;
    return bPct - aPct || b.wins - a.wins || a.losses - b.losses || a.nameJa.localeCompare(b.nameJa, "ja");
  });
  const leader = ordered[0];
  if (!leader) return ordered;
  return ordered.map((row) => ({
    ...row,
    gamesBack: row.winPct === null || leader.winPct === null ? null : ((leader.wins - leader.losses) - (row.wins - row.losses)) / 2,
  }));
}
