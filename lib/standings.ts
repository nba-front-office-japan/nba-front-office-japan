export type WinLoss = { wins: number; losses: number };

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
  // 同カンファレンス・同ディビジョン・ホーム・アウェイ・直近10試合の成績
  conferenceRecord: WinLoss;
  divisionRecord: WinLoss;
  homeRecord: WinLoss;
  roadRecord: WinLoss;
  last10: WinLoss;
  // 連勝・連敗(例: W3、L2)。試合が無ければ null
  streak: string | null;
};

type StandingTeam = Pick<StandingRow, "teamId" | "abbreviation" | "name" | "nameJa" | "conference" | "division">;

type StandingGame = { home_team_id: string; away_team_id: string; home_score: number; away_score: number };

type Tally = Pick<StandingRow, "conferenceRecord" | "divisionRecord" | "homeRecord" | "roadRecord"> & { results: boolean[] };

function emptyTally(): Tally {
  const zero = (): WinLoss => ({ wins: 0, losses: 0 });
  return { conferenceRecord: zero(), divisionRecord: zero(), homeRecord: zero(), roadRecord: zero(), results: [] };
}

function addResult(record: WinLoss, won: boolean) {
  if (won) record.wins += 1;
  else record.losses += 1;
}

function countResults(results: boolean[]): WinLoss {
  const wins = results.filter(Boolean).length;
  return { wins, losses: results.length - wins };
}

function streakOf(results: boolean[]): string | null {
  const last = results.at(-1);
  if (last === undefined) return null;
  const broken = results.findLastIndex((won) => won !== last);
  return `${last ? "W" : "L"}${results.length - 1 - broken}`;
}

/** 試合結果(日付の古い順)から順位表の行を作る。同点の試合と、teams に無いチームの試合は数えない */
export function buildStandingRows(teams: StandingTeam[], games: StandingGame[]): StandingRow[] {
  const teamById = new Map(teams.map((team) => [team.teamId, team]));
  const tallies = new Map(teams.map((team) => [team.teamId, emptyTally()]));

  for (const game of games) {
    if (game.home_score === game.away_score) continue;
    const homeTeam = teamById.get(game.home_team_id);
    const awayTeam = teamById.get(game.away_team_id);
    const home = tallies.get(game.home_team_id);
    const away = tallies.get(game.away_team_id);
    if (!homeTeam || !awayTeam || !home || !away) continue;

    const homeWon = game.home_score > game.away_score;
    addResult(home.homeRecord, homeWon);
    addResult(away.roadRecord, !homeWon);
    home.results.push(homeWon);
    away.results.push(!homeWon);
    if (homeTeam.conference === awayTeam.conference) {
      addResult(home.conferenceRecord, homeWon);
      addResult(away.conferenceRecord, !homeWon);
    }
    if (homeTeam.division === awayTeam.division) {
      addResult(home.divisionRecord, homeWon);
      addResult(away.divisionRecord, !homeWon);
    }
  }

  return teams.map((team) => {
    const { results, ...records } = tallies.get(team.teamId) ?? emptyTally();
    const { wins, losses } = countResults(results);
    return {
      ...team,
      wins,
      losses,
      winPct: results.length === 0 ? null : wins / results.length,
      gamesBack: null,
      ...records,
      last10: countResults(results.slice(-10)),
      streak: streakOf(results),
    };
  });
}

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
