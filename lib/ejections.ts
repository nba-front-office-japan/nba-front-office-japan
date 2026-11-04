// 「NBA 退場回数ランキング（ESPN集計）」(/rankings/ejections)のデータ。
// 基準: ESPNの選手ごとのキャリア統計(Misc Totals の EJECT 列)。レギュラーシーズンとプレーオフを別々に取り、通算はその合計。
// - ESPNの統計は1997-98シーズンより前の退場がすべて0回になっている(それ以前の記録が無いとみられる)。
//   そのため、それ以前に活躍した選手(バークレー6回・ロッドマン5回・メイソン2回)は実際より少なく、表には載せない(ページに注記)。
// - 歴代: 通算10回以上の選手。候補は Wikipedia・BetMGM の一覧に載る選手と、その周辺で確認した選手。
// - 現役: 2026-27シーズンのロスター入りを NBA公式か ESPN で確認できた選手だけ(回数の下限なし)。
//   ウェストブルック(2026年8月に引退発表)・ベバリー(フランスのクラブと契約)は現役に入れない。

export interface EjectionRow {
  name: string;
  regularSeason: number;
  playoffs: number;
  active: boolean;
  // ESPNの選手ID(キャリア統計ページのURLに使う)
  espnId: number;
  // ESPNから取得した日
  retrievedOn: string;
}

export const EJECTIONS_RETRIEVED_ON = "2026年11月4日";

const RETRIEVED = "2026-11-04";

export function espnStatsUrl(espnId: number): string {
  return `https://www.espn.com/nba/player/stats/_/id/${espnId}`;
}

export const ALL_TIME_EJECTIONS: EjectionRow[] = [
  { name: "ラシード・ウォレス", regularSeason: 26, playoffs: 3, active: false, espnId: 883, retrievedOn: RETRIEVED },
  { name: "ドレイモンド・グリーン", regularSeason: 23, playoffs: 2, active: true, espnId: 6589, retrievedOn: RETRIEVED },
  { name: "デマーカス・カズンズ", regularSeason: 17, playoffs: 1, active: false, espnId: 4258, retrievedOn: RETRIEVED },
  { name: "ケニオン・マーティン", regularSeason: 12, playoffs: 0, active: false, espnId: 515, retrievedOn: RETRIEVED },
  { name: "マット・バーンズ", regularSeason: 12, playoffs: 0, active: false, espnId: 1765, retrievedOn: RETRIEVED },
  { name: "レジー・ミラー", regularSeason: 12, playoffs: 0, active: false, espnId: 552, retrievedOn: RETRIEVED },
  { name: "ディロン・ブルックス", regularSeason: 10, playoffs: 2, active: true, espnId: 3155526, retrievedOn: RETRIEVED },
  { name: "メッタ・ワールドピース", regularSeason: 8, playoffs: 3, active: false, espnId: 25, retrievedOn: RETRIEVED },
  { name: "パトリック・ベバリー", regularSeason: 8, playoffs: 3, active: false, espnId: 3964, retrievedOn: RETRIEVED },
  { name: "ドワイト・ハワード", regularSeason: 9, playoffs: 2, active: false, espnId: 2384, retrievedOn: RETRIEVED },
  { name: "カーメロ・アンソニー", regularSeason: 11, playoffs: 0, active: false, espnId: 1975, retrievedOn: RETRIEVED },
  { name: "ゲイリー・ペイトン", regularSeason: 11, playoffs: 0, active: false, espnId: 640, retrievedOn: RETRIEVED },
  { name: "ラッセル・ウェストブルック", regularSeason: 10, playoffs: 1, active: false, espnId: 3468, retrievedOn: RETRIEVED },
  { name: "スティーブン・ジャクソン", regularSeason: 10, playoffs: 1, active: false, espnId: 378, retrievedOn: RETRIEVED },
  { name: "シャキール・オニール", regularSeason: 10, playoffs: 0, active: false, espnId: 614, retrievedOn: RETRIEVED },
];

// 現役は、2026-27シーズンのロスター入りを確認できた選手(グリーン・ブルックス・スチュワート)
export const ACTIVE_EJECTIONS: EjectionRow[] = [
  ...ALL_TIME_EJECTIONS.filter((row) => row.active),
  { name: "アイザイア・スチュワート", regularSeason: 8, playoffs: 0, active: true, espnId: 4432810, retrievedOn: RETRIEVED },
];

export function totalEjections(row: EjectionRow): number {
  return row.regularSeason + row.playoffs;
}

// 通算の多い順に並べ、同数は同順位にする(同順位は「4T」のように T を付けて表示する)。
// 同数の中は、レギュラーシーズンの多い順、さらに同じなら元の並び順
export function rankEjections(rows: EjectionRow[]): (EjectionRow & { total: number; rank: number; tied: boolean })[] {
  // Array.prototype.sort は安定ソートなので、同じ値どうしは元の並び順のまま
  const sorted = rows
    .map((row) => ({ ...row, total: totalEjections(row) }))
    .sort((a, b) => b.total - a.total || b.regularSeason - a.regularSeason);
  return sorted.map((row) => {
    const rank = sorted.findIndex((r) => r.total === row.total) + 1;
    const tied = sorted.filter((r) => r.total === row.total).length > 1;
    return { ...row, rank, tied };
  });
}

export function formatEjectionRank(row: { rank: number; tied: boolean }): string {
  return row.tied ? `${row.rank}T` : String(row.rank);
}

// 狭い画面で名前を「・」の後ろでだけ折り返せるよう、ゼロ幅スペースを入れる(word-break: keep-all と組み合わせる)
export function breakableName(name: string): string {
  return name.replaceAll("・", "・​");
}
