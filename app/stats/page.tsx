import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/page-shell";
import { StatsListFilters } from "@/components/stats-list-filters";
import { StatsListTable } from "@/components/stats-list-table";
import { fetchEnglishNameMatchIds, fetchStatsPage, fetchStatsSeasons, parseStatsQuery } from "@/lib/stats-list";
import { STATS_SEASON, ROSTER_SEASON, seasonLabel } from "@/lib/seasons";

const STATS_LABEL = seasonLabel(STATS_SEASON);

// 選手スタッツ一覧。並べ替え・絞り込み・100人ずつの取得はDB(player_stats_list ビュー)で行い、
// このページには表示する100人分だけを取得する。条件・ページは URL の検索パラメータ
// (?type= / season= / team= / pos= / minGames= / q= / sort= / dir= / page=)で持つ。
// 選手名の検索(q)は日本語名・英語名の部分一致で、ほかの絞り込みと一緒に使える。
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
  // 一覧の選手名は「日本語名、なければ英語名」のため、日本語名がある選手の英語名での一致は別に探す
  const nameMatch = query.q ? await fetchEnglishNameMatchIds(supabase, query.q) : { ids: [], truncated: false };
  const result = await fetchStatsPage(supabase, query, teamId, nameMatch.ids);
  return {
    nameMatchTruncated: nameMatch.truncated,
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
      {/* 現在は選手スタッツの一覧・並べ替え。比較・独自指標などの分析機能を追加したら「Stats Lab」等の表記を検討する */}
      <h1 className="mb-2 text-[36px] font-semibold tracking-tight">選手スタッツ</h1>
      <p className="mb-7 text-sm text-muted">収録選手の基本スタッツを、シーズン・チーム・ポジション・出場試合数・選手名で検索する。</p>
      <StatsListFilters query={data.query} latestSeason={data.latestSeason} seasons={data.seasons} teams={data.teams} />
      {data.nameMatchTruncated && (
        <p className="mb-3 text-xs font-bold text-muted">
          英語名で一致する選手が多いため、一部だけを表示しています。名前をもう少し長く入力してください。
        </p>
      )}
      <StatsListTable query={data.query} latestSeason={data.latestSeason} result={data.result} />
      {/* 収録範囲・複数チームの扱いの注意書き(ページ最下部) */}
      <div className="mt-8 space-y-1 border border-line bg-[#eaf1ff] px-4 py-3 text-xs leading-6 text-[#264c8a] dark:bg-white/[.06]">
        <p>
          選手スタッツは{STATS_LABEL}までのレギュラーシーズン・プレーオフの成績を対象にしています。
          {ROSTER_SEASON > STATS_SEASON && `${seasonLabel(ROSTER_SEASON)}シーズンの成績はまだ収録していません。`}
        </p>
        <p>複数チームに所属した選手は、そのシーズンの合計成績です（チーム欄に「2チーム合計」などと表示）。チームで絞り込むと、そのチームに所属した選手の合計成績を表示します。</p>
      </div>
    </PageShell>
  );
}
