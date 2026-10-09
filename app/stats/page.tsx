import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/page-shell";
import { StatsListFilters } from "@/components/stats-list-filters";
import { StatsListTable } from "@/components/stats-list-table";
import { fetchStatsPage, fetchStatsSeasons, parseStatsQuery } from "@/lib/stats-list";
import { STATS_SEASON, ROSTER_SEASON, seasonLabel } from "@/lib/seasons";

const STATS_LABEL = seasonLabel(STATS_SEASON);

// 選手スタッツ一覧。並べ替え・絞り込み・100人ずつの取得はDB(player_stats_list ビュー)で行い、
// このページには表示する100人分だけを取得する。条件・ページは URL の検索パラメータ
// (?type= / season= / team= / pos= / minGames= / sort= / dir= / page=)で持つ。
// 1行 = 選手 × シーズン × 種別。シーズン中に複数チームでプレーした選手は、そのシーズンの合計成績を1行で表示する。
async function loadStats(params: Record<string, string | string[] | undefined>) {
  const supabase = createServerSupabaseClient();
  const [seasonsByType, { data: teams }] = await Promise.all([
    fetchStatsSeasons(supabase),
    supabase.from("teams").select("id, abbreviation, name").order("abbreviation"),
  ]);
  const typeParam = Array.isArray(params.type) ? params.type[0] : params.type;
  const seasons = typeParam === "playoffs" ? seasonsByType.playoffs : seasonsByType.regular_season;
  const latestSeason = seasons[0] ?? null;
  const query = parseStatsQuery(params, latestSeason);
  const teamId = query.team ? ((teams ?? []).find((t) => t.abbreviation === query.team)?.id ?? null) : null;
  const result = await fetchStatsPage(supabase, query, teamId);
  return {
    seasons,
    latestSeason,
    teams: (teams ?? []).map((t) => ({ abbreviation: t.abbreviation, name: t.name })),
    query: { ...query, page: result.page },
    result,
  };
}

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
      <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">Player Stats · {STATS_LABEL} Season</p>
      {/* 現在は選手スタッツの一覧・並べ替え。比較・独自指標などの分析機能を追加したら「Stats Lab」等の表記を検討する */}
      <h1 className="mb-2 text-[36px] font-semibold tracking-tight">選手スタッツ</h1>
      <p className="mb-2 text-sm text-muted">収録選手の基本スタッツを、シーズン・チーム・ポジション・出場試合数で検索する。</p>
      <div className="mb-7 space-y-1 border border-line bg-[#eaf1ff] px-4 py-3 text-xs leading-6 text-[#264c8a] dark:bg-white/[.06]">
        <p>
          選手スタッツは{STATS_LABEL}までのレギュラーシーズン・プレーオフの成績を対象にしています。
          {ROSTER_SEASON > STATS_SEASON && `${seasonLabel(ROSTER_SEASON)}シーズンの成績はまだ収録していません。`}
        </p>
        <p>複数チームに所属した選手は、そのシーズンの合計成績です（チーム欄に「2チーム合計」などと表示）。チームで絞り込むと、そのチームに所属した選手の合計成績を表示します。</p>
      </div>
      <StatsListFilters query={data.query} latestSeason={data.latestSeason} seasons={data.seasons} teams={data.teams} />
      <StatsListTable query={data.query} latestSeason={data.latestSeason} result={data.result} />
    </PageShell>
  );
}
