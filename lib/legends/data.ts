// レジェンド枠(/legends)のデータ。NBA 75th Anniversary Team の76人(50 Greatest Players の50人を含む)。
// 元データは data/legends/legends.json(scripts/build-legends-from-bref.py が公開データセット(Basketball-Reference の記録)から作る)。
// 優勝・ファイナルMVP・オールスターMVPはスクリプト内の一覧(出典つき)から付ける。プレーオフ成績は未収録(playoffsAvailable=false)。
// DB(player_stats)には入れない: /stats の一覧に昔のシーズンが混ざらないようにするため。
//
// 記録が無い項目(1973-74より前のスティール・ブロック・ターンオーバー、1979-80より前の3P、初期の出場時間など)は null。
// 通算の1試合平均は「その項目が記録されているシーズンの試合数」で割る(記録が無い年の試合を分母に入れない)。

import raw from "@/data/legends/legends.json";
import { LEGEND_NAMES_JA } from "@/lib/legends/names-ja";
import { collapseLegendSeasons, legendCareer, type Legend, type LegendAwardRow } from "@/lib/legends/calc";

export * from "@/lib/legends/calc";

type RawFile = {
  source: string;
  generatedAt: string;
  playoffsAvailable?: boolean;
  legends: Omit<Legend, "nameJa">[];
};

const FILE = raw as unknown as RawFile;

export const LEGENDS_GENERATED_AT = FILE.generatedAt;
export const LEGEND_PLAYOFFS_AVAILABLE = FILE.playoffsAvailable !== false;

export const LEGENDS: Legend[] = FILE.legends
  .map((l) => ({ ...l, nameJa: LEGEND_NAMES_JA[l.slug] ?? l.name }))
  .sort((a, b) => a.nameJa.localeCompare(b.nameJa, "ja"));

export function legendBySlug(slug: string): Legend | null {
  return LEGENDS.find((l) => l.slug === slug) ?? null;
}

// ---------------------------------------------------------------------------
// 受賞歴(NBA公式の DESCRIPTION を表示用の賞にまとめる)
// ---------------------------------------------------------------------------

export type LegendAwardSummary = {
  key: string;
  label: string;
  note?: string;
  seasons: number[];
  byTeam?: { team: number; seasons: number[] }[];
};

const AWARD_DEFS: { key: string; label: string; note?: string; match: (d: string) => boolean; teams?: boolean; yearOnly?: boolean }[] = [
  { key: "champion", label: "NBA優勝", match: (d) => d === "NBA Champion" },
  { key: "mvp", label: "MVP", note: "シーズンMVP", match: (d) => d === "NBA Most Valuable Player" },
  { key: "finals_mvp", label: "ファイナルMVP", match: (d) => d === "NBA Finals Most Valuable Player" },
  { key: "dpoy", label: "DPOY", note: "最優秀守備選手賞", match: (d) => d === "NBA Defensive Player of the Year" },
  { key: "roy", label: "ROY", note: "新人王", match: (d) => d === "NBA Rookie of the Year" },
  { key: "mip", label: "MIP", note: "最優秀躍進選手賞", match: (d) => d === "NBA Most Improved Player" },
  { key: "sixth_man", label: "シックスマン賞", match: (d) => d === "NBA Sixth Man of the Year" },
  { key: "clutch", label: "クラッチ・プレーヤー賞", match: (d) => d === "NBA Clutch Player of the Year" },
  { key: "all_star_mvp", label: "オールスターMVP", match: (d) => d === "NBA All-Star Most Valuable Player" },
  { key: "all_nba", label: "All-NBA", note: "オールNBAチーム", match: (d) => d === "All-NBA", teams: true },
  { key: "all_defensive", label: "All-Defensive", note: "オールディフェンシブチーム", match: (d) => d === "All-Defensive Team", teams: true },
  { key: "all_rookie", label: "All-Rookie", note: "オールルーキーチーム", match: (d) => d === "All-Rookie Team", teams: true },
  { key: "all_star", label: "オールスター選出", match: (d) => d === "NBA All-Star" },
  { key: "olympic_gold", label: "五輪 金メダル", match: (d) => d === "Olympic Gold Medal", yearOnly: true },
  { key: "hof", label: "殿堂入り", note: "バスケットボール殿堂", match: (d) => d === "Hall of Fame Inductee", yearOnly: true },
];

/** 週間・月間MVP、記念チーム(50周年・75周年は別に表示する)などは受賞歴の一覧に出さない */
const IGNORED = (d: string) =>
  /Player of the (Week|Month)|Rookie of the Month|Anniversary|Sporting News/i.test(d);

export function summarizeLegendAwards(awards: LegendAwardRow[]): { summaries: LegendAwardSummary[]; others: { description: string; season: number | null }[] } {
  const summaries: LegendAwardSummary[] = [];
  const used = new Set<LegendAwardRow>();
  for (const def of AWARD_DEFS) {
    const rows = awards.filter((a) => a.description && def.match(a.description));
    if (rows.length === 0) continue;
    rows.forEach((r) => used.add(r));
    const seasons = [...new Set(rows.map((r) => r.season).filter((s): s is number => s !== null))].sort((a, b) => a - b);
    const summary: LegendAwardSummary = { key: def.key, label: def.label, note: def.note, seasons };
    if (def.teams) {
      const teams = [...new Set(rows.map((r) => r.allNbaTeam).filter((t): t is number => t !== null))].sort();
      if (teams.length > 0) {
        summary.byTeam = teams.map((team) => ({
          team,
          seasons: rows.filter((r) => r.allNbaTeam === team && r.season !== null).map((r) => r.season!).sort((a, b) => a - b),
        }));
      }
    }
    // 回数は同じシーズンの重複を数えない(行の数ではなくシーズンの数)
    summaries.push(summary);
  }
  const others = awards
    .filter((a) => !used.has(a) && a.description && !IGNORED(a.description))
    .map((a) => ({ description: a.description!, season: a.season }));
  return { summaries, others };
}

export function awardCount(summaries: LegendAwardSummary[], key: string): number {
  return summaries.find((s) => s.key === key)?.seasons.length ?? 0;
}

/** 殿堂入り・五輪は「2010年」、それ以外は「2010-11」 */
export function isYearOnlyAward(key: string): boolean {
  return AWARD_DEFS.find((d) => d.key === key)?.yearOnly ?? false;
}

// ---------------------------------------------------------------------------
// 一覧の絞り込み・自動の紹介文
// ---------------------------------------------------------------------------

/** デビューした年代(1940年代〜2010年代) */
export function debutDecade(l: Legend): number | null {
  const first = l.regularSeason.length > 0 ? Math.min(...l.regularSeason.map((r) => r.season)) : l.fromYear;
  return first ? Math.floor(first / 10) * 10 : null;
}

export function careerSpan(l: Legend): { first: number; last: number } | null {
  if (l.regularSeason.length === 0) return null;
  const seasons = l.regularSeason.map((r) => r.season);
  return { first: Math.min(...seasons), last: Math.max(...seasons) };
}

/** 在籍したチーム(初めて在籍した順) */
export function legendTeams(l: Legend): string[] {
  const teams: string[] = [];
  for (const r of [...l.regularSeason].sort((a, b) => a.season - b.season)) {
    if (!r.isTotal && !teams.includes(r.team)) teams.push(r.team);
  }
  return teams;
}

const POSITION_JA: Record<string, string> = { G: "ガード", F: "フォワード", C: "センター", PG: "ポイントガード", SG: "シューティングガード", SF: "スモールフォワード", PF: "パワーフォワード" };

/** "G-F" → "ガード／フォワード" */
export function positionLabel(position: string | null): string {
  if (!position) return "-";
  return position.split("-").map((p) => POSITION_JA[p] ?? p).join("／");
}

/** ポジションの絞り込み(G / F / C)に当てはまるか */
export function hasPosition(position: string | null, letter: "G" | "F" | "C"): boolean {
  return (position ?? "").split("-").some((p) => p === letter || p.endsWith(letter));
}

/** 76人の中での順位(大きいほど上位の項目) */
export function rankAmongLegends(slug: string, value: (l: Legend) => number | null): { rank: number; total: number } | null {
  const values = LEGENDS.map((l) => ({ slug: l.slug, v: value(l) })).filter((x): x is { slug: string; v: number } => x.v !== null);
  const mine = values.find((x) => x.slug === slug);
  if (!mine) return null;
  return { rank: values.filter((x) => x.v > mine.v).length + 1, total: values.length };
}

export function careerPoints(l: Legend): number | null {
  return legendCareer(collapseLegendSeasons(l.regularSeason)).totals.pts;
}
