// 河村勇輝(Yuki Kawamura)の選手ページだけに出す、Gリーグ成績・日本代表成績・現所属。
// ほかの選手には効かない(kawamuraExtrasFor が null を返す)。
// ・Gリーグ: data/kawamura/gleague-games.json(scripts/update-kawamura-gleague.py が stats.gleague.nba.com から作る)
// ・日本代表: lib/kawamura/national-team.ts(手入力)
import gleagueData from "@/data/kawamura/gleague-games.json";
import { samePlayerName } from "@/lib/featured-players";
import { aggregateRawStatTotals, type RawStatTotals } from "@/lib/stats";
import { NATIONAL_TEAM_GAMES, NATIONAL_TEAM_TOURNAMENTS, type NationalTeamGame } from "@/lib/kawamura/national-team";

export type GLeagueSeasonType = "tipoff" | "regular" | "playoffs";

export type GLeagueGame = {
  gameId: string;
  /** 開始年(2026 = 2026-27) */
  season: number;
  seasonType: GLeagueSeasonType;
  /** 現地(米国)の試合日 */
  gameDate: string;
  teamAbbr: string;
  teamName: string;
  opponentAbbr: string;
  isHome: boolean;
  result: "W" | "L" | null;
  seconds: number;
  pts: number;
  oreb: number;
  dreb: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  tov: number;
  pf: number;
  fgm: number;
  fga: number;
  fg3m: number;
  fg3a: number;
  ftm: number;
  fta: number;
  plusMinus: number | null;
};

export const GLEAGUE_SEASON_TYPE_LABEL: Record<GLeagueSeasonType, string> = {
  tipoff: "Tip-Off",
  regular: "レギュラー",
  playoffs: "プレーオフ",
};

/** 所属したGリーグのチーム(シーズン順) */
export const GLEAGUE_TEAMS: { season: number; nameJa: string; nameEn: string; parentJa: string }[] = [
  { season: 2024, nameJa: "メンフィス・ハッスル", nameEn: "Memphis Hustle", parentJa: "グリズリーズ" },
  { season: 2025, nameJa: "ウィンディシティ・ブルズ", nameEn: "Windy City Bulls", parentJa: "ブルズ" },
  { season: 2026, nameJa: "サンディエゴ・クリッパーズ", nameEn: "San Diego Clippers", parentJa: "クリッパーズ" },
];

export const GLEAGUE_CURRENT_SEASON = 2026;

/** ページ上部の所属表記 */
export const KAWAMURA_CURRENT_TEAM = "サンディエゴ・クリッパーズ（Gリーグ）";

export function gleagueTeamNameJa(season: number, teamName: string): string {
  const team = GLEAGUE_TEAMS.find((t) => t.season === season);
  return team && teamName.includes(team.nameEn.split(" ").pop()!) ? team.nameJa : teamName;
}

export type GameStatLine = {
  seconds: number | null;
  pts: number;
  oreb: number;
  dreb: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  tov: number;
  pf: number;
  fgm: number;
  fga: number;
  fg3m: number;
  fg3a: number;
  ftm: number;
  fta: number;
};

/** 試合ごとの成績を合計する(平均・成功率は deriveStats で計算する)。出場時間が不明な試合は minutesPlayed に足さない */
export function totalsOf(games: GameStatLine[]): RawStatTotals {
  return aggregateRawStatTotals(
    games.map((g) => ({
      gamesPlayed: 1,
      minutesPlayed: (g.seconds ?? 0) / 60,
      points: g.pts,
      reboundsOffensive: g.oreb,
      reboundsDefensive: g.dreb,
      reboundsTotal: g.reb,
      assists: g.ast,
      steals: g.stl,
      blocks: g.blk,
      turnovers: g.tov,
      personalFouls: g.pf,
      fieldGoalsMade: g.fgm,
      fieldGoalsAttempted: g.fga,
      threePointersMade: g.fg3m,
      threePointersAttempted: g.fg3a,
      freeThrowsMade: g.ftm,
      freeThrowsAttempted: g.fta,
    })),
  );
}

export type KawamuraExtras = {
  /** 新しい試合が先 */
  gleagueGames: GLeagueGame[];
  gleagueUpdatedAt: string | null;
  nationalTeamGames: NationalTeamGame[];
  nationalTeamTournaments: typeof NATIONAL_TEAM_TOURNAMENTS;
};

const GLEAGUE_GAMES = [...(gleagueData.games as GLeagueGame[])].sort((a, b) =>
  a.gameDate === b.gameDate ? b.gameId.localeCompare(a.gameId) : b.gameDate.localeCompare(a.gameDate),
);

/** 河村勇輝なら Gリーグ・日本代表のデータ、それ以外の選手は null */
export function kawamuraExtrasFor(fullName: string): KawamuraExtras | null {
  if (!samePlayerName(fullName, "Yuki Kawamura")) return null;
  return {
    gleagueGames: GLEAGUE_GAMES,
    gleagueUpdatedAt: gleagueData.updatedAt ?? null,
    nationalTeamGames: NATIONAL_TEAM_GAMES,
    nationalTeamTournaments: NATIONAL_TEAM_TOURNAMENTS,
  };
}
