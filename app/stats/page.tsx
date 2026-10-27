import type { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/page-shell";
import { StatsListFilters } from "@/components/stats-list-filters";
import { StatsListTable } from "@/components/stats-list-table";
import { CURRENT_STATS_SEASON, fetchEnglishNameMatchIds, fetchStatsPage, fetchStatsSeasons, isCurrentStatsSeason, parseStatsQuery } from "@/lib/stats-list";
import { currentSeasonStatsPage, fetchCurrentSeasonStats } from "@/lib/current-season-stats-list";
import { gameDateLabel } from "@/lib/player-box-score-stats";
import { STATS_SEASON, seasonLabel } from "@/lib/seasons";

const STATS_LABEL = seasonLabel(STATS_SEASON);
const CURRENT_LABEL = seasonLabel(CURRENT_STATS_SEASON);

// 選手スタッツ一覧。並べ替え・絞り込み・100人ずつの取得はDB(player_stats_list ビュー)で行い、
// このページには表示する100人分だけを取得する。条件・ページは URL の検索パラメータ
// (?type= / season= / team= / pos= / minGames= / q= / sort= / dir= / page=)で持つ。
// 選手名の検索(q)は日本語名・英語名の部分一致で、ほかの絞り込みと一緒に使える。
// 1行 = 選手 × シーズン × 種別。シーズン中に複数チームでプレーした選手は、そのシーズンの合計成績を1行で表示する。
// 今季(2026-27)のレギュラーシーズンは、試合のボックススコアから集計した行を使う(lib/current-season-stats-list.ts)。
// 「All」(全シーズン)は player_stats のシーズンだけ(今季は含めない)。
async function loadStats(params: Record<string, string | string[] | undefined>) {
  const supabase = createServerSupabaseClient();
  const [seasonsByType, { data: teams }, current] = await Promise.all([
    fetchStatsSeasons(supabase),
    supabase.from("teams").select("id, abbreviation, name").order("abbreviation"),
    // 今季の集計に失敗しても、過去シーズンの一覧は表示する
    fetchCurrentSeasonStats(CURRENT_STATS_SEASON).catch(() => ({ rows: [], lastGameDate: null })),
  ]);
  const typeParam = Array.isArray(params.type) ? params.type[0] : params.type;
  // 今季の試合が取り込まれていれば、レギュラーシーズンの選択肢の先頭(初期表示)にする
  const regularSeasons =
    current.rows.length > 0 && !seasonsByType.regular_season.includes(CURRENT_STATS_SEASON)
      ? [CURRENT_STATS_SEASON, ...seasonsByType.regular_season]
      : seasonsByType.regular_season;
  const seasons = typeParam === "playoffs" ? seasonsByType.playoffs : regularSeasons;
  const latestSeason = seasons[0] ?? null;
  const query = parseStatsQuery(params, latestSeason);
  const teamId = query.team ? ((teams ?? []).find((t) => t.abbreviation === query.team)?.id ?? null) : null;
  // 一覧の選手名は「日本語名、なければ英語名」のため、日本語名がある選手の英語名での一致は別に探す
  const nameMatchIds = query.q ? await fetchEnglishNameMatchIds(supabase, query.q) : [];
  const isCurrent = isCurrentStatsSeason(query.season, query.seasonType);
  const result = isCurrent
    ? currentSeasonStatsPage(current.rows, query, teamId, nameMatchIds)
    : await fetchStatsPage(supabase, query, teamId, nameMatchIds);
  return {
    isCurrent,
    lastGameDate: current.lastGameDate,
    seasons,
    latestSeason,
    teams: (teams ?? []).map((t) => ({ abbreviation: t.abbreviation, name: t.name })),
    query: { ...query, page: result.page },
    result,
  };
}

export const metadata: Metadata = {
  title: `NBA選手スタッツ一覧 ${CURRENT_LABEL}（得点・リバウンド・アシスト） | NBA Front Office Japan`,
  description: `NBA全選手の${CURRENT_LABEL}シーズン成績を一覧で（試合ごとに自動更新）。得点・リバウンド・アシストなどで並べ替え、チームや選手名で絞り込めます。過去シーズンの成績も見られます。`,
  alternates: { canonical: "/stats" },
};

export default async function StatsPage({ searchParams }: PageProps<"/stats">) {
  const params = await searchParams;
  let data: Awaited<ReturnType<typeof loadStats>> | null = null;
  let errorMessage: string | null = null;
  try {
    data = await loadStats(params);
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : String(err);
  }

  if (!data) {
    return (
      <PageShell>
        <h1 className="mb-6 text-2xl font-semibold">選手スタッツ</h1>
        <p className="text-sm text-red-600 dark:text-red-400">スタッツデータの取得に失敗しました: {errorMessage}</p>
      </PageShell>
    );
  }

  return (
    <PageShell>
      {/* 現在は選手スタッツの一覧・並べ替え。比較・独自指標などの分析機能を追加したら「Stats Lab」等の表記を検討する */}
      <h1 className="mb-2 text-[36px] font-semibold tracking-tight">選手スタッツ</h1>
      <p className="mb-7 text-sm text-muted">収録選手の基本スタッツを、シーズン・チーム・ポジション・出場試合数・選手名で検索する。</p>
      {data.isCurrent && data.lastGameDate && (
        <p className="mb-3 text-xs text-muted">
          {CURRENT_LABEL}レギュラーシーズン：{gameDateLabel(data.lastGameDate)}（現地）の試合まで集計
          {data.query.minGames === "qualified" && "。規定試合数（所属チームの試合数の70%以上）に達した選手を表示しています"}
        </p>
      )}
      <StatsListFilters query={data.query} latestSeason={data.latestSeason} seasons={data.seasons} teams={data.teams} />
      <StatsListTable query={data.query} latestSeason={data.latestSeason} result={data.result} />
      {/* 収録範囲・複数チームの扱いの注意書き(ページ最下部) */}
      <div className="mt-8 space-y-1 border border-line bg-[#eaf1ff] px-4 py-3 text-xs leading-6 text-[#264c8a] dark:bg-white/[.06]">
        <p>
          {CURRENT_LABEL}シーズンの成績は、試合のボックススコアから自動で集計しています（試合の取り込みから数分で反映）。
          {STATS_LABEL}までは確定したシーズン成績です。SEASON の「All」は{STATS_LABEL}までが対象です。
        </p>
        <p>複数チームに所属した選手は、そのシーズンの合計成績です（チーム欄に「2チーム合計」などと表示）。チームで絞り込むと、そのチームに所属した選手の合計成績を表示します。</p>
      </div>
    </PageShell>
  );
}
