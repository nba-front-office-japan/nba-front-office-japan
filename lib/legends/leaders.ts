// オールタイムリーダーズ(/legends/leaders)のデータ。
// 元データは data/legends/leaders.json(scripts/build-all-time-leaders.py が公開データセット(Basketball-Reference の記録)から作る)。
// NBA(前身のBAAを含む)と ABA の合計。規定(試合数など)は Basketball-Reference の「Rate Statistic Requirements」に合わせている。

import raw from "@/data/legends/leaders.json";
import { LEGENDS } from "@/lib/legends/data";

export type LeaderEntry = {
  id: string;
  value: number;
  g: number;
  team?: string;
  season?: number;
  lg?: "NBA" | "ABA";
  from?: number;
  to?: number;
  lgs?: string[];
};
export type YearlyLeaders = { season: number; lg: "NBA" | "ABA"; leaders: LeaderEntry[] };

type RawFile = {
  source: string;
  generatedAt: string;
  lastSeason: number;
  players: Record<string, { name: string; active: boolean }>;
  yearly: Record<string, YearlyLeaders[]>;
  careerTotal: Record<string, LeaderEntry[]>;
  careerAvg: Record<string, LeaderEntry[]>;
  seasonBest: Record<string, LeaderEntry[]>;
};

const FILE = raw as unknown as RawFile;

export const LEADERS_LAST_SEASON = FILE.lastSeason;
export const LEADER_PLAYERS = FILE.players;

export type LeaderView = "yearly" | "total" | "average" | "best";
export type LeaderStat = "g" | "pts" | "trb" | "ast" | "stl" | "blk" | "x3p" | "fg_pct" | "x3p_pct";

export const VIEW_OPTIONS: { value: LeaderView; label: string; title: string; description: string }[] = [
  {
    value: "yearly",
    label: "年度別リーダー",
    title: "年度別リーダー（1試合平均）",
    description: "各シーズンの1位（タイトル獲得者）。規定の試合数などを満たした選手が対象です。",
  },
  { value: "total", label: "通算記録", title: "通算記録ランキング", description: "NBAとABAの通算合計の歴代上位50人です。" },
  {
    value: "average",
    label: "通算平均",
    title: "通算の1試合平均ランキング",
    description: "キャリア通算の1試合平均の歴代上位50人です（通算400試合以上。得点は400試合または10,000点以上）。",
  },
  {
    value: "best",
    label: "シーズン最高",
    title: "シーズン平均の歴代最高",
    description: "1シーズンの1試合平均（成功率）の歴代上位50シーズンです。そのシーズンの規定を満たした成績が対象です。",
  },
];

export const STAT_LABELS: Record<LeaderStat, { label: string; short: string; unit: string }> = {
  g: { label: "試合数", short: "G", unit: "試合" },
  pts: { label: "得点", short: "PTS", unit: "点" },
  trb: { label: "リバウンド", short: "TRB", unit: "本" },
  ast: { label: "アシスト", short: "AST", unit: "本" },
  stl: { label: "スティール", short: "STL", unit: "本" },
  blk: { label: "ブロック", short: "BLK", unit: "本" },
  x3p: { label: "3P成功", short: "3PM", unit: "本" },
  fg_pct: { label: "FG%", short: "FG%", unit: "" },
  x3p_pct: { label: "3P%", short: "3P%", unit: "" },
};

export const STATS_BY_VIEW: Record<LeaderView, LeaderStat[]> = {
  yearly: ["pts", "trb", "ast", "stl", "blk", "x3p", "fg_pct", "x3p_pct"],
  total: ["g", "pts", "ast", "trb", "stl", "blk", "x3p"],
  average: ["pts", "ast", "trb", "stl", "blk", "x3p"],
  best: ["pts", "ast", "trb", "stl", "blk", "x3p", "fg_pct", "x3p_pct"],
};

export function yearlyLeaders(stat: LeaderStat): YearlyLeaders[] {
  return FILE.yearly[stat] ?? [];
}
export function rankingFor(view: Exclude<LeaderView, "yearly">, stat: LeaderStat): LeaderEntry[] {
  const src = view === "total" ? FILE.careerTotal : view === "average" ? FILE.careerAvg : FILE.seasonBest;
  return src[stat] ?? [];
}

export function isPct(stat: LeaderStat): boolean {
  return stat === "fg_pct" || stat === "x3p_pct";
}

// レジェンド(76人)の Basketball-Reference ID → レジェンド
export const LEGEND_BY_BREF_ID = new Map(LEGENDS.map((l) => [l.personId, l]));

export function leaderName(id: string): { ja: string | null; en: string } {
  const legend = LEGEND_BY_BREF_ID.get(id);
  return { ja: legend?.nameJa ?? null, en: LEADER_PLAYERS[id]?.name ?? id };
}
