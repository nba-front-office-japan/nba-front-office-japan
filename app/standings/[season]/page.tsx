import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { BriefSheet, BriefSide } from "@/components/brief-sheet";
import { PageShell } from "@/components/page-shell";
import { SeasonSelect } from "@/components/season-select";
import { StandingsBoard } from "@/components/standings-board";
import { ROSTER_SEASON, seasonLabel } from "@/lib/seasons";
import {
  SEASON_NOTES,
  fetchHistoricalStandings,
  standingsSeasonOptions,
  historicalStandingsSeasons,
  parseSeasonSlug,
  seasonSlug,
} from "@/lib/historical-standings";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// 過去シーズンの最終順位表(/standings/2024-25 など)。今季は /standings。
// 過去の試合結果(historical_games)は取り込み後に変わらないため、1日1回だけ作り直す。
export const revalidate = 86400;
export const dynamicParams = false;

export function generateStaticParams() {
  return historicalStandingsSeasons().map((season) => ({ season: seasonSlug(season) }));
}

export async function generateMetadata({ params }: PageProps<"/standings/[season]">): Promise<Metadata> {
  const season = parseSeasonSlug((await params).season);
  if (season === null) return {};
  const label = seasonLabel(season);
  return {
    title: `NBA順位表 ${label}｜東西カンファレンス別の最終順位 | NBA Front Office Japan`,
    description: `NBA ${label}シーズンの最終順位表。東西カンファレンス・ディビジョン別に、勝敗・勝率・ゲーム差・ホーム・ロード・直近10試合・連勝連敗をまとめました。`,
    alternates: { canonical: `/standings/${seasonSlug(season)}` },
  };
}

export default async function HistoricalStandingsPage({ params }: PageProps<"/standings/[season]">) {
  const season = parseSeasonSlug((await params).season);
  if (season === null) notFound();
  const label = seasonLabel(season);

  let data: Awaited<ReturnType<typeof fetchHistoricalStandings>> | null = null;
  let error: string | null = null;
  try {
    data = await fetchHistoricalStandings(createServerSupabaseClient(), season);
  } catch (cause) {
    error = cause instanceof Error ? cause.message : "順位表の取得に失敗しました。";
  }
  const hasRows = !!data && data.gamesCounted > 0;

  return (
    <PageShell>
      <BriefSheet
        file="01"
        mark={["LEAGUE", "STANDINGS"]}
        edition={`${label} REGULAR SEASON`}
        report="FINAL STANDINGS"
        kicker="Standings"
        title={`NBA順位表 ${label}`}
        lead={`${label}レギュラーシーズンの最終順位です。チーム名と地区は当時のものです。プレーオフ・プレーイントーナメントは含みません。`}
        side={
          <>
            {data && hasRows && (
              <BriefSide label="Data status">
                <p>
                  集計済み: <strong className="text-foreground">{data.gamesCounted}試合</strong>
                </p>
              </BriefSide>
            )}
            <BriefSide label="Related files">
              <p>
                <Link href="/standings" className="inline-flex min-h-7 items-center font-bold text-blue hover:underline">
                  今季（{seasonLabel(ROSTER_SEASON)}）の順位表 ›
                </Link>
              </p>
              <p>
                <Link href="/stats/teams" className="inline-flex min-h-7 items-center font-bold text-blue hover:underline">
                  チームスタッツ ›
                </Link>
              </p>
            </BriefSide>
          </>
        }
      >
        <SeasonSelect season={season} options={standingsSeasonOptions()} />
        {error ? (
          <p className="border-l-4 border-red-500 bg-red-50 px-4 py-3 text-sm text-red-800 dark:bg-red-950/30 dark:text-red-200">{error}</p>
        ) : !data || !hasRows ? (
          <p className="border border-line bg-surface px-4 py-8 text-sm text-muted">このシーズンの試合結果はまだ登録されていません。</p>
        ) : (
          <>
            {SEASON_NOTES[season] && <p className="mb-4 border-l-4 border-gold bg-surface px-4 py-3 text-sm leading-6">{SEASON_NOTES[season]}</p>}
            <StandingsBoard rows={data.rows} />
            <p className="mt-5 text-xs leading-6 text-muted">同率チームは勝率・勝数・敗数・チーム名の順で並べています。NBA公式のタイブレーク基準による順位（プレーオフのシード）とは異なる場合があります。</p>
            <p className="mt-1 text-xs leading-6 text-muted">WIN%：勝率／GB：首位とのゲーム差／CONF：同カンファレンスとの対戦成績／DIV：同ディビジョンとの対戦成績／HOME・ROAD：ホーム・アウェイの成績／LAST10：シーズン最後の10試合の成績／STREAK：シーズン終了時の連勝（W）・連敗（L）</p>
          </>
        )}
      </BriefSheet>
    </PageShell>
  );
}
