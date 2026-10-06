// サラリーページで使うデータの取り出し(Excelから生成した lib/salary/payroll-data.ts を読むだけ。DB・外部サービスは使わない)。

import { SALARY_PLAYERS, SALARY_TEAMS } from "./payroll-data";
import { teamSlug, type SalaryPlayer, type SalaryTeam } from "./types";

const TEAM_BY_ABBR = new Map(SALARY_TEAMS.map((t) => [t.abbr, t]));

export function salaryTeams(): SalaryTeam[] {
  return SALARY_TEAMS;
}

export function salaryTeamBySlug(slug: string): SalaryTeam | null {
  return SALARY_TEAMS.find((t) => teamSlug(t.abbr) === slug.toLowerCase()) ?? null;
}

/** 選手の一覧(チーム名つき)。team を渡すとそのチームの選手だけ(Excelの並び=2026-27の年俸が高い順) */
export function salaryPlayerRows(team?: string): (SalaryPlayer & { teamName: string })[] {
  return SALARY_PLAYERS.filter((p) => !team || p.team === team).map((p) => ({ ...p, teamName: TEAM_BY_ABBR.get(p.team)?.name ?? p.team }));
}

/** チームの選手の年俸の合計(年度別) */
export function playerSalarySums(team: string): number[] {
  const players = SALARY_PLAYERS.filter((p) => p.team === team);
  return [0, 1, 2, 3, 4, 5].map((i) => players.reduce((sum, p) => sum + (p.salaries[i] ?? 0), 0));
}

export const SALARY_COUNTS = {
  teams: SALARY_TEAMS.length,
  players: SALARY_PLAYERS.length,
  /** Q・TW(補助CSVで登録したもの)が付いている選手の数 */
  statuses: SALARY_PLAYERS.filter((p) => (p.statuses ?? []).length > 0).length,
};
