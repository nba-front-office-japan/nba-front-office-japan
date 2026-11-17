// 選手ごとの「リーグ1位(年度別リーダー)」の履歴。オールタイムリーダーズ(/legends/leaders)の年度別リーダーと同じデータ
// (data/legends/leaders.json)を、Basketball-Reference の選手ID ごとに集計する。
// レジェンド(/legends/[slug])と、引退した名選手の解説がある選手ページ(lib/featured-players-retired.ts の brefId)で使う。
//
// 3P成功は年度別リーダーに「平均」と「合計」の2つがあるが、同じシーズンを二重に数えないよう、ここでは平均(1試合あたり)だけを使う。

import raw from "@/data/legends/leaders.json";

type YearlyLeaders = { season: number; lg: "NBA" | "ABA"; leaders: { id: string }[] };
const YEARLY = (raw as unknown as { yearly: Record<string, YearlyLeaders[]> }).yearly;

export type LeagueTitleStat = "pts" | "trb" | "ast" | "stl" | "blk" | "fg_pct" | "x3p" | "x3p_pct";

export const LEAGUE_TITLE_DEFS: { stat: LeagueTitleStat; label: string; note: string }[] = [
  { stat: "pts", label: "得点王", note: "1試合平均得点" },
  { stat: "trb", label: "リバウンド王", note: "1試合平均リバウンド" },
  { stat: "ast", label: "アシスト王", note: "1試合平均アシスト" },
  { stat: "stl", label: "スティール王", note: "1試合平均スティール" },
  { stat: "blk", label: "ブロック王", note: "1試合平均ブロック" },
  { stat: "fg_pct", label: "FG%1位", note: "フィールドゴール成功率" },
  { stat: "x3p", label: "3P成功1位", note: "1試合平均の3P成功数" },
  { stat: "x3p_pct", label: "3P%1位", note: "3ポイント成功率" },
];

export type LeagueTitle = {
  stat: LeagueTitleStat;
  label: string;
  note: string;
  /** 開始年(2023 = 2023-24)の古い順 */
  seasons: { season: number; lg: "NBA" | "ABA" }[];
};

const BY_PLAYER = (() => {
  const map = new Map<string, LeagueTitle[]>();
  for (const def of LEAGUE_TITLE_DEFS) {
    for (const y of YEARLY[def.stat] ?? []) {
      for (const e of y.leaders) {
        const list = map.get(e.id) ?? [];
        let t = list.find((x) => x.stat === def.stat);
        if (!t) {
          t = { ...def, seasons: [] };
          list.push(t);
        }
        if (!t.seasons.some((s) => s.season === y.season && s.lg === y.lg)) t.seasons.push({ season: y.season, lg: y.lg });
        map.set(e.id, list);
      }
    }
  }
  for (const list of map.values()) {
    list.sort((a, b) => LEAGUE_TITLE_DEFS.findIndex((d) => d.stat === a.stat) - LEAGUE_TITLE_DEFS.findIndex((d) => d.stat === b.stat));
    for (const t of list) t.seasons.sort((a, b) => a.season - b.season || a.lg.localeCompare(b.lg));
  }
  return map;
})();

/** その選手のリーグ1位の履歴(部門の並びは LEAGUE_TITLE_DEFS の順)。1度も無ければ空 */
export function leagueTitlesFor(brefId: string | null | undefined): LeagueTitle[] {
  return brefId ? (BY_PLAYER.get(brefId) ?? []) : [];
}

/** 年度別リーダーのその部門・リーグへのリンク */
export function leagueTitleHref(stat: LeagueTitleStat, lg: "NBA" | "ABA" | "all" = "all"): string {
  const params = new URLSearchParams();
  if (stat !== "pts") params.set("stat", stat);
  if (lg !== "all") params.set("lg", lg.toLowerCase());
  const q = params.toString();
  return q ? `/legends/leaders?${q}` : "/legends/leaders";
}

/** 「得点王10回、スティール王3回」 */
export function leagueTitleSummary(titles: LeagueTitle[]): string {
  return titles.map((t) => `${t.label}${t.seasons.length}回`).join("、");
}
