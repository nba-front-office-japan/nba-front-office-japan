// 「アリーナ別 価格比較」(/rankings/arena-prices)のデータ。
// 出典: RotoWire「How Much Does It Cost to Go to an NBA Game? (2026-27)」(2026年10月5日公開)。
//       チケット・駐車場は SeatGeek、飲食は Bookies.com のメニュー価格(2026年9月30日時点)。
// 金額は米ドル。各列は元データの値を数量で割った1単位あたりの値。
// アリーナ名は2026-27シーズンの名称(76ers・サンズ・キャバリアーズは改称後の名前)。

export interface ArenaPriceRow {
  teamName: string;
  teamAbbr: string;
  arena: string;
  cheapestSeatUsd: number;
  beerUsd: number;
  hotDogUsd: number;
  softDrinkUsd: number;
  parkingUsd: number;
  familyTotalUsd: number;
}

export const ARENA_PRICES_SOURCE = {
  name: "RotoWire",
  title: "How Much Does It Cost to Go to an NBA Game? (2026-27)",
  publishedOn: "2026年10月5日",
  asOf: "2026年9月30日",
};

export const ARENA_PRICES: ArenaPriceRow[] = [
  { teamName: "ニューヨーク・ニックス", teamAbbr: "NYK", arena: "Madison Square Garden", cheapestSeatUsd: 294.0, beerUsd: 13.5, hotDogUsd: 6.5, softDrinkUsd: 7.5, parkingUsd: 32.6, familyTotalUsd: 1276.6 },
  { teamName: "ロサンゼルス・レイカーズ", teamAbbr: "LAL", arena: "Crypto.com Arena", cheapestSeatUsd: 115.44, beerUsd: 14.5, hotDogUsd: 9.0, softDrinkUsd: 10.81, parkingUsd: 18.38, familyTotalUsd: 566.77 },
  { teamName: "フィラデルフィア・76ers", teamAbbr: "PHI", arena: "Xfinity Mobile Arena", cheapestSeatUsd: 109.6, beerUsd: 11.04, hotDogUsd: 6.55, softDrinkUsd: 8.25, parkingUsd: 51.06, familyTotalUsd: 554.23 },
  { teamName: "ボストン・セルティックス", teamAbbr: "BOS", arena: "TD Garden", cheapestSeatUsd: 98.19, beerUsd: 18.27, hotDogUsd: 6.79, softDrinkUsd: 6.76, parkingUsd: 23.5, familyTotalUsd: 493.49 },
  { teamName: "ミネソタ・ティンバーウルブズ", teamAbbr: "MIN", arena: "Target Center", cheapestSeatUsd: 97.88, beerUsd: 12.65, hotDogUsd: 7.83, softDrinkUsd: 7.27, parkingUsd: 14.89, familyTotalUsd: 477.56 },
  { teamName: "トロント・ラプターズ", teamAbbr: "TOR", arena: "Scotiabank Arena", cheapestSeatUsd: 80.36, beerUsd: 9.68, hotDogUsd: 6.42, softDrinkUsd: 5.71, parkingUsd: 23.0, familyTotalUsd: 400.88 },
  { teamName: "ゴールデンステイト・ウォリアーズ", teamAbbr: "GSW", arena: "Chase Center", cheapestSeatUsd: 77.96, beerUsd: 17.93, hotDogUsd: 10.97, softDrinkUsd: 10.4, parkingUsd: 30.2, familyTotalUsd: 442.6 },
  { teamName: "シカゴ・ブルズ", teamAbbr: "CHI", arena: "United Center", cheapestSeatUsd: 75.53, beerUsd: 16.25, hotDogUsd: 7.5, softDrinkUsd: 10.5, parkingUsd: 22.69, familyTotalUsd: 408.31 },
  { teamName: "サンアントニオ・スパーズ", teamAbbr: "SAS", arena: "Frost Bank Center", cheapestSeatUsd: 67.36, beerUsd: 12.5, hotDogUsd: 12.53, softDrinkUsd: 9.35, parkingUsd: 38.69, familyTotalUsd: 401.95 },
  { teamName: "マイアミ・ヒート", teamAbbr: "MIA", arena: "Kaseya Center", cheapestSeatUsd: 62.96, beerUsd: 13.29, hotDogUsd: 8.02, softDrinkUsd: 8.88, parkingUsd: 24.71, familyTotalUsd: 352.96 },
  { teamName: "オーランド・マジック", teamAbbr: "ORL", arena: "Kia Center", cheapestSeatUsd: 59.2, beerUsd: 11.99, hotDogUsd: 9.0, softDrinkUsd: 6.99, parkingUsd: 20.62, familyTotalUsd: 331.38 },
  { teamName: "ダラス・マーベリックス", teamAbbr: "DAL", arena: "American Airlines Center", cheapestSeatUsd: 52.42, beerUsd: 13.25, hotDogUsd: 8.35, softDrinkUsd: 6.0, parkingUsd: 13.8, familyTotalUsd: 295.37 },
  { teamName: "アトランタ・ホークス", teamAbbr: "ATL", arena: "State Farm Arena", cheapestSeatUsd: 51.65, beerUsd: 7.97, hotDogUsd: 3.21, softDrinkUsd: 4.53, parkingUsd: 25.4, familyTotalUsd: 269.83 },
  { teamName: "デトロイト・ピストンズ", teamAbbr: "DET", arena: "Little Caesars Arena", cheapestSeatUsd: 50.36, beerUsd: 12.99, hotDogUsd: 6.99, softDrinkUsd: 7.43, parkingUsd: 22.27, familyTotalUsd: 292.51 },
  { teamName: "ブルックリン・ネッツ", teamAbbr: "BKN", arena: "Barclays Center", cheapestSeatUsd: 50.23, beerUsd: 16.32, hotDogUsd: 7.75, softDrinkUsd: 9.57, parkingUsd: 21.53, familyTotalUsd: 305.26 },
  { teamName: "サクラメント・キングス", teamAbbr: "SAC", arena: "Golden 1 Center", cheapestSeatUsd: 48.68, beerUsd: 13.71, hotDogUsd: 7.32, softDrinkUsd: 5.2, parkingUsd: 17.89, familyTotalUsd: 279.7 },
  { teamName: "オクラホマシティ・サンダー", teamAbbr: "OKC", arena: "Paycom Center", cheapestSeatUsd: 48.52, beerUsd: 7.21, hotDogUsd: 5.88, softDrinkUsd: 5.33, parkingUsd: 13.57, familyTotalUsd: 256.28 },
  { teamName: "LAクリッパーズ", teamAbbr: "LAC", arena: "Intuit Dome", cheapestSeatUsd: 47.88, beerUsd: 14.0, hotDogUsd: 8.5, softDrinkUsd: 5.3, parkingUsd: 40.67, familyTotalUsd: 304.79 },
  { teamName: "インディアナ・ペイサーズ", teamAbbr: "IND", arena: "Gainbridge Fieldhouse", cheapestSeatUsd: 41.56, beerUsd: 8.54, hotDogUsd: 5.88, softDrinkUsd: 5.32, parkingUsd: 20.71, familyTotalUsd: 238.2 },
  { teamName: "ミルウォーキー・バックス", teamAbbr: "MIL", arena: "Fiserv Forum", cheapestSeatUsd: 41.08, beerUsd: 13.71, hotDogUsd: 5.22, softDrinkUsd: 4.68, parkingUsd: 17.63, familyTotalUsd: 239.64 },
  { teamName: "フェニックス・サンズ", teamAbbr: "PHX", arena: "Mortgage Matchup Center", cheapestSeatUsd: 38.96, beerUsd: 15.85, hotDogUsd: 2.0, softDrinkUsd: 7.79, parkingUsd: 23.33, familyTotalUsd: 234.45 },
  { teamName: "クリーブランド・キャバリアーズ", teamAbbr: "CLE", arena: "Rocket Arena", cheapestSeatUsd: 37.05, beerUsd: 12.65, hotDogUsd: 6.14, softDrinkUsd: 4.53, parkingUsd: 17.0, familyTotalUsd: 224.13 },
  { teamName: "ポートランド・トレイルブレイザーズ", teamAbbr: "POR", arena: "Moda Center", cheapestSeatUsd: 36.56, beerUsd: 13.05, hotDogUsd: 7.2, softDrinkUsd: 8.5, parkingUsd: 19.31, familyTotalUsd: 237.45 },
  { teamName: "デンバー・ナゲッツ", teamAbbr: "DEN", arena: "Ball Arena", cheapestSeatUsd: 35.63, beerUsd: 11.2, hotDogUsd: 7.5, softDrinkUsd: 6.0, parkingUsd: 19.92, familyTotalUsd: 226.84 },
  { teamName: "ヒューストン・ロケッツ", teamAbbr: "HOU", arena: "Toyota Center", cheapestSeatUsd: 35.28, beerUsd: 12.54, hotDogUsd: 7.21, softDrinkUsd: 8.84, parkingUsd: 15.13, familyTotalUsd: 227.86 },
  { teamName: "ワシントン・ウィザーズ", teamAbbr: "WAS", arena: "Capital One Arena", cheapestSeatUsd: 31.64, beerUsd: 10.12, hotDogUsd: 8.02, softDrinkUsd: 6.23, parkingUsd: 17.8, familyTotalUsd: 209.11 },
  { teamName: "シャーロット・ホーネッツ", teamAbbr: "CHA", arena: "Spectrum Center", cheapestSeatUsd: 31.09, beerUsd: 12.49, hotDogUsd: 6.99, softDrinkUsd: 5.49, parkingUsd: 18.11, familyTotalUsd: 206.37 },
  { teamName: "ユタ・ジャズ", teamAbbr: "UTA", arena: "Delta Center", cheapestSeatUsd: 30.32, beerUsd: 12.0, hotDogUsd: 5.5, softDrinkUsd: 9.0, parkingUsd: 10.0, familyTotalUsd: 195.28 },
  { teamName: "メンフィス・グリズリーズ", teamAbbr: "MEM", arena: "FedExForum", cheapestSeatUsd: 25.48, beerUsd: 10.52, hotDogUsd: 5.34, softDrinkUsd: 7.02, parkingUsd: 19.12, familyTotalUsd: 177.48 },
  { teamName: "ニューオーリンズ・ペリカンズ", teamAbbr: "NOP", arena: "Smoothie King Center", cheapestSeatUsd: 22.17, beerUsd: 14.15, hotDogUsd: 6.95, softDrinkUsd: 7.6, parkingUsd: 8.0, familyTotalUsd: 167.97 },
];

export type ArenaPriceSortKey = "cheapestSeatUsd" | "beerUsd" | "familyTotalUsd";

export const ARENA_PRICE_SORTS: { key: ArenaPriceSortKey; label: string }[] = [
  { key: "cheapestSeatUsd", label: "最安席が高い順" },
  { key: "beerUsd", label: "ビールが高い順" },
  { key: "familyTotalUsd", label: "家族4人の合計が高い順" },
];

// 高い順に並べ、同額は同順位にする(同額どうしは最安席の高い順に並べる)
export function rankArenaPrices(rows: ArenaPriceRow[], key: ArenaPriceSortKey): (ArenaPriceRow & { rank: number })[] {
  const sorted = [...rows].sort((a, b) => b[key] - a[key] || b.cheapestSeatUsd - a.cheapestSeatUsd);
  return sorted.map((row) => ({ ...row, rank: sorted.findIndex((r) => r[key] === row[key]) + 1 }));
}

// 狭い画面でチーム名を「・」の後ろでだけ折り返せるよう、ゼロ幅スペースを入れる(word-break: keep-all と組み合わせる)
export function breakableTeamName(name: string): string {
  return name.replaceAll("・", "・​");
}

// 金額はセント単位の整数にしてから丸める(小数の誤差で四捨五入がずれないように)
function toCents(usd: number): number {
  return Math.round(usd * 100);
}

// 「294ドル」(小数点以下を四捨五入)
export function formatUsdWhole(usd: number): string {
  return `${Math.round(toCents(usd) / 100).toLocaleString("ja-JP")}ドル`;
}

// 「13.5ドル」(小数第1位まで)
export function formatUsdTenths(usd: number): string {
  return `${(Math.round(toCents(usd) / 10) / 10).toFixed(1)}ドル`;
}
