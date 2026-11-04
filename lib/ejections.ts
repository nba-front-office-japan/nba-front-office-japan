// 「NBA 退場回数ランキング」(/rankings/ejections)のデータ。
// 歴代: Wikipedia「List of NBA career ejections leaders」(2026年11月2日時点)の上位(12回以上)。
//       回数は、ほかの情報源(BetMGM 2026年1月時点・WZAK 2023年12月など)と照合している。情報源で数字が異なる選手はページに注記する。
//       グリーンだけは、プレーオフを含む通算31回(レギュラーシーズン23回+プレーオフ8回。Shot Clock・NGSC Sports、31回は CBS Sports でも確認)を使う。
//       ウォレス29回がプレーオフ込みかを2つ以上の情報源で確認できず(ESPNの成績表は26+3回)、ESPNの成績表ではグリーンのプレーオフは2回で、
//       基準がそろわないため、グリーンには順位を付けない(unranked)。Wikipediaの26回は表では使わない。
// 現役: 2026-27シーズン開幕時点の現役選手で、回数を2つ以上の情報源で確認できた選手だけを載せる。
// グリーン以外は、レギュラーシーズンとプレーオフの内訳を持たない。

export interface EjectionRow {
  name: string;
  ejections: number;
  active: boolean;
  // 回数の内訳など、回数の下に出す補足。狭い画面ではゼロ幅スペース(​)の位置でだけ折り返す
  detail?: string;
  // 基準がほかの選手とそろわないため、順位を付けない(表では「—」)
  unranked?: boolean;
}

export const EJECTIONS_AS_OF = "2026年11月2日";
// 出典を確認した日
export const EJECTIONS_RETRIEVED_ON = "2026年11月4日";

// グリーンの回数の出典(記事)
export const GREEN_SOURCES = [
  { name: "Shot Clock", url: null },
  { name: "NGSC Sports", url: null },
  {
    name: "CBS Sports",
    url: "https://www.cbssports.com/nba/news/draymond-green-gets-first-ejection-of-season-after-sparking-warriors-suns-scuffle/",
  },
] as const;

export const EJECTIONS_SOURCE = {
  name: "Wikipedia",
  title: "List of NBA career ejections leaders",
  url: "https://en.wikipedia.org/wiki/List_of_NBA_career_ejections_leaders",
};

// グリーンの回数についての注記(歴代・現役の両タブで同じ文を使う)
export const GREEN_NOTE =
  "ドレイモンド・グリーンの31回は、2026年11月2日のサンズ戦での退場を含む、レギュラーシーズン23回とプレーオフ8回の合計（Shot Clock、NGSC Sportsの記事より。通算31回はCBS Sportsでも確認）。Wikipediaの集計では26回だが、基準が異なる可能性がある。";

// ウォレスとの基準の違いについての注記(両タブ共通)
export const BASIS_NOTE =
  "ラシード・ウォレスの29回がプレーオフを含む数字かどうかは、2つ以上の情報源で確認できていない。基準によってグリーンとの順位が変わるため、グリーンには順位を付けていない（—）。他の選手の数字は、出典によりプレーオフの扱いが異なる可能性があります。";

export const ALL_TIME_EJECTIONS: EjectionRow[] = [
  { name: "ラシード・ウォレス", ejections: 29, active: false },
  { name: "ドレイモンド・グリーン", ejections: 31, active: true, detail: "レギュラー​シーズン23回＋​プレーオフ8回", unranked: true },
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

// 多い順に並べ、同数は同順位にする(同順位は「5T」のように T を付けて表示する)。
// unranked の選手は並びには入れるが、順位は付けない(rank は null)。ほかの選手の順位はその選手を除いて数える
export function rankEjections(rows: EjectionRow[]): (EjectionRow & { rank: number | null; tied: boolean })[] {
  const sorted = [...rows].sort((a, b) => b.ejections - a.ejections);
  const ranked = sorted.filter((r) => !r.unranked);
  return sorted.map((row) => {
    if (row.unranked) return { ...row, rank: null, tied: false };
    const rank = ranked.findIndex((r) => r.ejections === row.ejections) + 1;
    const tied = ranked.filter((r) => r.ejections === row.ejections).length > 1;
    return { ...row, rank, tied };
  });
}

export function formatEjectionRank(row: { rank: number | null; tied: boolean }): string {
  if (row.rank === null) return "—";
  return row.tied ? `${row.rank}T` : String(row.rank);
}

// 狭い画面で名前を「・」の後ろでだけ折り返せるよう、ゼロ幅スペースを入れる(word-break: keep-all と組み合わせる)
export function breakableName(name: string): string {
  return name.replaceAll("・", "・​");
}
