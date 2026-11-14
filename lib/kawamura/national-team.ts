// 河村勇輝の日本代表(シニア)の主要国際大会の試合別成績。手入力。
// 出典:
// ・FIBAワールドカップ2023: FIBA公式の選手ページ(大会の試合別成績。出場時間は分単位)、ESPN のボックススコア
// ・パリ2024オリンピック: Land of Basketball のボックススコア(出場時間は分:秒)
// 照合: W杯5試合の合計(68得点・38アシスト・10リバウンド)はFIBA公式の平均(13.6点・7.6アシスト・2.0リバウンド)と一致。
//       五輪3試合の合計は Basketball-Reference の大会合計と一致。

export type NationalTeamTournamentId = "wc2023" | "paris2024";

export const NATIONAL_TEAM_TOURNAMENTS: { id: NationalTeamTournamentId; name: string; shortName: string; year: number; note: string }[] = [
  {
    id: "paris2024",
    name: "パリ2024オリンピック",
    shortName: "パリ五輪",
    year: 2024,
    note: "グループB・3戦全敗で1次ラウンド敗退",
  },
  {
    id: "wc2023",
    name: "FIBAワールドカップ2023",
    shortName: "W杯2023",
    year: 2023,
    note: "3勝2敗・アジア最上位でパリ五輪の出場権を獲得",
  },
];

export type NationalTeamGame = {
  key: string;
  tournament: NationalTeamTournamentId;
  /** 例: 1次ラウンド・順位決定戦・グループB */
  round: string;
  /** 現地の試合日 */
  gameDate: string;
  opponentJa: string;
  teamScore: number;
  opponentScore: number;
  overtime?: boolean;
  /** 出場時間(秒) */
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

const min = (m: number, s = 0) => m * 60 + s;

/** 新しい試合が先 */
export const NATIONAL_TEAM_GAMES: NationalTeamGame[] = [
  // パリ2024オリンピック グループB
  { key: "2024-08-02-bra", tournament: "paris2024", round: "グループB", gameDate: "2024-08-02", opponentJa: "ブラジル", teamScore: 84, opponentScore: 102, seconds: min(30, 20), pts: 21, oreb: 0, dreb: 2, reb: 2, ast: 10, stl: 1, blk: 1, tov: 2, pf: 3, fgm: 7, fga: 19, fg3m: 4, fg3a: 9, ftm: 3, fta: 3 },
  { key: "2024-07-30-fra", tournament: "paris2024", round: "グループB", gameDate: "2024-07-30", opponentJa: "フランス", teamScore: 90, opponentScore: 94, overtime: true, seconds: min(33, 16), pts: 29, oreb: 1, dreb: 6, reb: 7, ast: 6, stl: 1, blk: 0, tov: 2, pf: 3, fgm: 9, fga: 26, fg3m: 6, fg3a: 15, ftm: 5, fta: 5 },
  { key: "2024-07-27-ger", tournament: "paris2024", round: "グループB", gameDate: "2024-07-27", opponentJa: "ドイツ", teamScore: 77, opponentScore: 97, seconds: min(25, 23), pts: 11, oreb: 0, dreb: 1, reb: 1, ast: 7, stl: 1, blk: 0, tov: 5, pf: 4, fgm: 3, fga: 11, fg3m: 3, fg3a: 8, ftm: 2, fta: 2 },
  // FIBAワールドカップ2023(沖縄ラウンド)
  { key: "2023-09-02-cpv", tournament: "wc2023", round: "順位決定戦", gameDate: "2023-09-02", opponentJa: "カーボベルデ", teamScore: 80, opponentScore: 71, seconds: min(28), pts: 14, oreb: 0, dreb: 2, reb: 2, ast: 8, stl: 3, blk: 0, tov: 5, pf: 3, fgm: 5, fga: 9, fg3m: 1, fg3a: 3, ftm: 3, fta: 3 },
  { key: "2023-08-31-ven", tournament: "wc2023", round: "順位決定戦", gameDate: "2023-08-31", opponentJa: "ベネズエラ", teamScore: 86, opponentScore: 77, seconds: min(29), pts: 19, oreb: 0, dreb: 4, reb: 4, ast: 11, stl: 0, blk: 0, tov: 2, pf: 3, fgm: 6, fga: 11, fg3m: 1, fg3a: 4, ftm: 6, fta: 6 },
  { key: "2023-08-29-aus", tournament: "wc2023", round: "1次ラウンド", gameDate: "2023-08-29", opponentJa: "オーストラリア", teamScore: 89, opponentScore: 109, seconds: min(18), pts: 3, oreb: 0, dreb: 1, reb: 1, ast: 7, stl: 0, blk: 0, tov: 3, pf: 2, fgm: 1, fga: 8, fg3m: 1, fg3a: 4, ftm: 0, fta: 0 },
  { key: "2023-08-27-fin", tournament: "wc2023", round: "1次ラウンド", gameDate: "2023-08-27", opponentJa: "フィンランド", teamScore: 98, opponentScore: 88, seconds: min(25), pts: 25, oreb: 1, dreb: 0, reb: 1, ast: 9, stl: 0, blk: 0, tov: 0, pf: 1, fgm: 10, fga: 16, fg3m: 4, fg3a: 7, ftm: 1, fta: 3 },
  { key: "2023-08-25-ger", tournament: "wc2023", round: "1次ラウンド", gameDate: "2023-08-25", opponentJa: "ドイツ", teamScore: 63, opponentScore: 81, seconds: min(18), pts: 7, oreb: 0, dreb: 2, reb: 2, ast: 3, stl: 1, blk: 0, tov: 4, pf: 1, fgm: 2, fga: 12, fg3m: 2, fg3a: 9, ftm: 1, fta: 2 },
];
