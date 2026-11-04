// 「NBA 退場回数ランキング」(/rankings/ejections)のデータ。
// 歴代: Wikipedia「List of NBA career ejections leaders」(2026年11月2日時点)の上位(12回以上)。
//       回数は、ほかの情報源(BetMGM 2026年1月時点・WZAK 2023年12月など)と照合している。情報源で数字が異なる選手はページに注記する。
// 現役: 2026-27シーズン開幕時点の現役選手で、回数を2つ以上の情報源で確認できた選手だけを載せる。
// レギュラーシーズンとプレーオフの内訳は取得できないため持たない。

export interface EjectionRow {
  name: string;
  ejections: number;
  active: boolean;
}

export const EJECTIONS_AS_OF = "2026年11月2日";

export const EJECTIONS_SOURCE = {
  name: "Wikipedia",
  title: "List of NBA career ejections leaders",
  url: "https://en.wikipedia.org/wiki/List_of_NBA_career_ejections_leaders",
};

// グリーンの回数についての注記(歴代・現役の両タブで同じ文を使う)
export const GREEN_NOTE =
  "ドレイモンド・グリーンの26回は、Wikipediaの集計（2026年11月のサンズ戦での退場を含む）。31回とする報道もあり、数え方の違いとみられる。";

export const ALL_TIME_EJECTIONS: EjectionRow[] = [
  { name: "ラシード・ウォレス", ejections: 29, active: false },
  { name: "ドレイモンド・グリーン", ejections: 26, active: true },
  { name: "デマーカス・カズンズ", ejections: 18, active: false },
  { name: "ドワイト・ハワード", ejections: 17, active: false },
  { name: "チャールズ・バークレー", ejections: 16, active: false },
  { name: "アンソニー・メイソン", ejections: 16, active: false },
  { name: "シャキール・オニール", ejections: 14, active: false },
  { name: "マット・バーンズ", ejections: 13, active: false },
  { name: "ディロン・ブルックス", ejections: 12, active: true },
  { name: "ケニオン・マーティン", ejections: 12, active: false },
  { name: "デニス・ロッドマン", ejections: 12, active: false },
  { name: "レジー・ミラー", ejections: 12, active: false },
];

// 現役は、2つ以上の情報源で回数を確認できた選手だけ(グリーン・ブルックスの2人)
export const ACTIVE_EJECTIONS: EjectionRow[] = ALL_TIME_EJECTIONS.filter((row) => row.active);

// 多い順に並べ、同数は同順位にする(同順位は「5T」のように T を付けて表示する)
export function rankEjections(rows: EjectionRow[]): (EjectionRow & { rank: number; tied: boolean })[] {
  const sorted = [...rows].sort((a, b) => b.ejections - a.ejections);
  return sorted.map((row) => {
    const rank = sorted.findIndex((r) => r.ejections === row.ejections) + 1;
    const tied = sorted.filter((r) => r.ejections === row.ejections).length > 1;
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
