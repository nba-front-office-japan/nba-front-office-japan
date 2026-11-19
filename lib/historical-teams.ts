// 過去シーズンのチーム名・略称・カンファレンス・ディビジョンの対応表。
// DB(teams)は今の30フランチャイズだけを持ち、過去の試合(historical_games)・成績も今のフランチャイズに付けている
// (例: 2007-08 のシアトル・スーパーソニックスは OKC の行)。過去の順位表などで「当時の名前・地区」を出すときにここを使う。
// 対象は 2003-04 以降(過去の順位表・選手スタッツの範囲)。それより前のシーズンを足すときは、ここにも当時の情報を足すこと。
// season は開始年(2007 = 2007-08)。from / to はその名前だった最初と最後のシーズン(to なしは今も)。

export interface HistoricalTeamIdentity {
  abbreviation: string;
  name: string;
  nameJa: string;
}

interface Era extends HistoricalTeamIdentity {
  from: number;
  to: number;
}

// 今の略称 → 今と違う名前だった期間(2003-04 以降)
const NAME_ERAS: Record<string, Era[]> = {
  OKC: [{ from: 2003, to: 2007, abbreviation: "SEA", name: "Seattle SuperSonics", nameJa: "シアトル・スーパーソニックス" }],
  BKN: [{ from: 2003, to: 2011, abbreviation: "NJN", name: "New Jersey Nets", nameJa: "ニュージャージー・ネッツ" }],
  NOP: [
    { from: 2003, to: 2004, abbreviation: "NOH", name: "New Orleans Hornets", nameJa: "ニューオーリンズ・ホーネッツ" },
    // ハリケーン・カトリーナの影響で、主にオクラホマシティを本拠地にしていた2シーズン
    { from: 2005, to: 2006, abbreviation: "NOK", name: "New Orleans/Oklahoma City Hornets", nameJa: "ニューオーリンズ/オクラホマシティ・ホーネッツ" },
    { from: 2007, to: 2012, abbreviation: "NOH", name: "New Orleans Hornets", nameJa: "ニューオーリンズ・ホーネッツ" },
  ],
  CHA: [{ from: 2004, to: 2013, abbreviation: "CHA", name: "Charlotte Bobcats", nameJa: "シャーロット・ボブキャッツ" }],
};

// 今の略称 → チームが無かったシーズン(2003-04 以降)。シャーロットは 2004-05 に参入
const FIRST_SEASON: Record<string, number> = {
  CHA: 2004,
};

// 2003-04 までのディビジョン(4地区)。2004-05 の再編で今の6地区になり、それ以降は今の teams の値と同じ。
const DIVISIONS_2003: Record<string, { conference: "East" | "West"; division: string }> = Object.fromEntries(
  (
    [
      ["East", "Atlantic", ["BOS", "BKN", "NYK", "PHI", "MIA", "ORL", "WAS"]],
      ["East", "Central", ["ATL", "CHI", "CLE", "DET", "IND", "MIL", "NOP", "TOR"]],
      ["West", "Midwest", ["DAL", "DEN", "HOU", "MEM", "MIN", "SAS", "UTA"]],
      ["West", "Pacific", ["GSW", "LAC", "LAL", "PHX", "POR", "SAC", "OKC"]],
    ] as const
  ).flatMap(([conference, division, teams]) => teams.map((abbr) => [abbr, { conference, division }]))
);

/** そのシーズンにチームが存在したか(シャーロットは 2004-05 から) */
export function teamExistedIn(currentAbbreviation: string, season: number): boolean {
  return season >= (FIRST_SEASON[currentAbbreviation] ?? 0);
}

/** そのシーズンの名前・略称。今と同じなら null(画面側は今の名前を使う) */
export function historicalTeamIdentity(currentAbbreviation: string, season: number): HistoricalTeamIdentity | null {
  const era = NAME_ERAS[currentAbbreviation]?.find((e) => season >= e.from && season <= e.to);
  return era ? { abbreviation: era.abbreviation, name: era.name, nameJa: era.nameJa } : null;
}

/** そのシーズンのカンファレンス・ディビジョン。2004-05 以降は今の teams の値をそのまま返す */
export function historicalTeamAlignment(
  currentAbbreviation: string,
  season: number,
  current: { conference: string; division: string }
): { conference: string; division: string } {
  if (season <= 2003) return DIVISIONS_2003[currentAbbreviation] ?? current;
  return current;
}
