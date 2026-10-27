// 選手ページ(Profile)の「データで見る{選手名}」。サイトに登録された成績(player_stats)と年俸(lib/salary)から、
// 通算・直近シーズンの成績と年俸を文章にする(AIの文章ではなく、データだけから組み立てる)。
import { seasonLabel } from "@/lib/seasons";
import { SALARY_SEASONS, formatUsd, type SalaryPlayer } from "@/lib/salary/types";
import { formatUsdJa } from "@/lib/salary/lines";
import { deriveStats, formatStat } from "@/lib/stats";
import type { PlayerCurrentSeasonStats } from "@/lib/player-box-score-stats";

export type SummaryStatRow = {
  season: number;
  season_type: string;
  team_id: string | null;
  games_played: number | null;
  points: number | null;
  rebounds_total: number | null;
  assists: number | null;
  field_goals_made: number | null;
  field_goals_attempted: number | null;
  three_pointers_made: number | null;
  three_pointers_attempted: number | null;
};

type SeasonLine = Omit<SummaryStatRow, "team_id" | "season_type">;

const n = (v: number | null) => v ?? 0;

/** シーズンごとに1行にまとめる(移籍した年は TOT 行、無ければチーム別の行を合計) */
function seasonLines(rows: SummaryStatRow[], seasonType: string): SeasonLine[] {
  const bySeason = new Map<number, SummaryStatRow[]>();
  for (const r of rows) {
    if (r.season_type !== seasonType) continue;
    bySeason.set(r.season, [...(bySeason.get(r.season) ?? []), r]);
  }
  return [...bySeason.entries()]
    .sort(([a], [b]) => a - b)
    .map(([season, list]) => {
      const tot = list.find((r) => r.team_id === null);
      const src = tot ? [tot] : list;
      const sum = (key: keyof SeasonLine) => src.reduce((s, r) => s + n(r[key] as number | null), 0);
      return {
        season,
        games_played: sum("games_played"),
        points: sum("points"),
        rebounds_total: sum("rebounds_total"),
        assists: sum("assists"),
        field_goals_made: sum("field_goals_made"),
        field_goals_attempted: sum("field_goals_attempted"),
        three_pointers_made: sum("three_pointers_made"),
        three_pointers_attempted: sum("three_pointers_attempted"),
      };
    })
    .filter((l) => n(l.games_played) > 0);
}

function total(lines: SeasonLine[]): SeasonLine {
  const sum = (key: keyof SeasonLine) => lines.reduce((s, l) => s + n(l[key] as number | null), 0);
  return {
    season: 0,
    games_played: sum("games_played"),
    points: sum("points"),
    rebounds_total: sum("rebounds_total"),
    assists: sum("assists"),
    field_goals_made: sum("field_goals_made"),
    field_goals_attempted: sum("field_goals_attempted"),
    three_pointers_made: sum("three_pointers_made"),
    three_pointers_attempted: sum("three_pointers_attempted"),
  };
}

const avg = (value: number | null, games: number | null) => (n(value) / Math.max(n(games), 1)).toFixed(1);
const pct = (made: number | null, att: number | null) => ((n(made) / Math.max(n(att), 1)) * 100).toFixed(1);

function averagesText(l: SeasonLine): string {
  return `1試合平均${avg(l.points, l.games_played)}得点・${avg(l.rebounds_total, l.games_played)}リバウンド・${avg(l.assists, l.games_played)}アシスト`;
}

/** 今季成績の1文(説明文・データで見るで共通)。例: 「2026-27シーズンは5試合に出場し、1試合平均21.4得点・5.0リバウンド・4.2アシスト（10月26日の試合まで）。」 */
export function currentSeasonSentence(current: PlayerCurrentSeasonStats): string {
  const t = current.totals;
  const d = deriveStats(t);
  const [, m, day] = current.lastGameDate.split("-").map(Number);
  return `${seasonLabel(current.season)}シーズンは${t.gamesPlayed}試合に出場し、1試合平均${formatStat(d.ppg)}得点・${formatStat(d.rpg)}リバウンド・${formatStat(d.apg)}アシスト（${m}月${day}日の試合まで）。`;
}

/** 文章(段落の配列)。成績も年俸も無い選手は空配列 */
export function playerDataSummary({
  nameJa,
  stats,
  current,
  salary,
}: {
  nameJa: string;
  stats: SummaryStatRow[];
  /** 今季(ボックススコアから集計)。出場が無ければ null */
  current: PlayerCurrentSeasonStats | null;
  /** 年俸の文を出さない場合は null */
  salary: SalaryPlayer | null;
}): string[] {
  const out: string[] = [];
  if (current) out.push(`${nameJa}の今季成績：${currentSeasonSentence(current)}`);
  const regular = seasonLines(stats, "regular_season");
  if (regular.length > 0) {
    const t = total(regular);
    const first = regular[0].season;
    const last = regular[regular.length - 1].season;
    const range = first === last ? `${seasonLabel(first)}シーズン` : `${seasonLabel(first)}〜${seasonLabel(last)}の${regular.length}シーズン`;
    out.push(
      `${nameJa}のNBAレギュラーシーズン成績は、${range}を掲載しています。通算${n(t.games_played).toLocaleString("ja-JP")}試合で${n(t.points).toLocaleString("ja-JP")}得点、${averagesText(t)}です。`,
    );

    const latest = regular[regular.length - 1];
    const parts = [`フィールドゴール成功率${pct(latest.field_goals_made, latest.field_goals_attempted)}%`];
    if (n(latest.three_pointers_attempted) >= 20) parts.push(`3ポイント成功率${pct(latest.three_pointers_made, latest.three_pointers_attempted)}%`);
    out.push(`${current ? "" : "直近の"}${seasonLabel(latest.season)}シーズンは${n(latest.games_played)}試合に出場し、${averagesText(latest)}、${parts.join("、")}でした。`);
  }

  const playoffs = seasonLines(stats, "playoffs");
  if (playoffs.length > 0) {
    const t = total(playoffs);
    out.push(`プレーオフには${playoffs.length}シーズン・通算${n(t.games_played)}試合に出場し、${averagesText(t)}を記録しています。`);
  }

  const currentSalary = salary?.salaries[0];
  if (currentSalary !== null && currentSalary !== undefined) {
    out.push(`${SALARY_SEASONS[0]}シーズンの年俸は${formatUsd(currentSalary)}(${formatUsdJa(currentSalary)})です。`);
  }
  return out;
}
