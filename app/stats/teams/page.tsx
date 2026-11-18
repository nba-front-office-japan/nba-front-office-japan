import Link from "next/link";
import type { Metadata } from "next";
import { BriefSheet, BriefSide } from "@/components/brief-sheet";
import { PageShell } from "@/components/page-shell";
import { StatsKindTabs } from "@/components/stats-kind-tabs";
import { TeamStatsListTable } from "@/components/team-stats-list-table";
import { gameDateLabel } from "@/lib/player-box-score-stats";
import { ROSTER_SEASON, seasonLabel } from "@/lib/seasons";
import { fetchTeamStatsList } from "@/lib/team-stats-data";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// チームスタッツ一覧。今季のレギュラーシーズンを、取り込んだ試合のボックススコア(チーム合計)から集計する(lib/team-stats-data.ts)。
// 取り込んだ試合が再デプロイなしで反映されるよう、順位表・選手スタッツ一覧の今季分と同じ5分ごとに集計し直す。
export const revalidate = 300;

const SEASON = ROSTER_SEASON;
const LABEL = seasonLabel(SEASON);

export const metadata: Metadata = {
  title: `NBAチームスタッツ ${LABEL}（得点・失点・FG%・リバウンド） | NBA Front Office Japan`,
  description: `NBA全30チームの${LABEL}シーズン成績を一覧で（試合ごとに自動更新）。得点・失点・得失点差・FG%・3P%・リバウンド・アシストなどで並べ替えられます。相手チームの成績（被FG%など）も見られます。`,
  alternates: { canonical: "/stats/teams" },
};

export default async function TeamStatsPage() {
  let data: Awaited<ReturnType<typeof fetchTeamStatsList>> | null = null;
  let error: string | null = null;
  try {
    data = await fetchTeamStatsList(createServerSupabaseClient(), SEASON);
  } catch (cause) {
    error = cause instanceof Error ? cause.message : "チームスタッツの取得に失敗しました。";
  }

  return (
    <PageShell>
      <BriefSheet
        file="03"
        mark={["TEAM", "STATS"]}
        edition={`${LABEL} REGULAR SEASON`}
        report="LEAGUE-WIDE TEAM DATA"
        kicker="Team Stats"
        title="チームスタッツ"
        lead={`${LABEL}レギュラーシーズンの30チームの成績を、1試合平均で並べる。見出しを押すと並べ替えられる。`}
        side={
          <>
            {data && data.gamesCounted > 0 && (
              <BriefSide label="Data status">
                <p>
                  集計済み: <strong className="text-foreground">{data.gamesCounted}試合</strong>
                </p>
                {data.lastGameDate && <p>{gameDateLabel(data.lastGameDate)}（現地）の試合まで</p>}
              </BriefSide>
            )}
            <BriefSide label="Related files">
              <p>
                <Link href="/standings" className="inline-flex min-h-7 items-center font-bold text-blue hover:underline">
                  NBA順位表 ›
                </Link>
              </p>
              <p>
                <Link href="/guide/stats-basics" className="inline-flex min-h-7 items-center font-bold text-blue hover:underline">
                  スタッツ表の見方（初心者向け） ›
                </Link>
              </p>
            </BriefSide>
          </>
        }
      >
        <StatsKindTabs active="teams" />
        {error ? (
          <p className="border-l-4 border-red-500 bg-red-50 px-4 py-3 text-sm text-red-800 dark:bg-red-950/30 dark:text-red-200">{error}</p>
        ) : !data || data.gamesCounted === 0 ? (
          <p className="border border-line bg-surface px-4 py-8 text-sm text-muted">レギュラーシーズンの試合結果がまだないため、チームスタッツは開幕後に表示します。</p>
        ) : (
          <>
            <TeamStatsListTable rows={data.rows} />
            <div className="mt-8 space-y-1 border border-line bg-surface px-4 py-3 text-xs leading-6 text-muted">
              <p>試合のボックススコア（チーム合計）から自動で集計しています（試合終了後に更新）。プレシーズン・NBAカップ決勝は含みません。</p>
              <p>PTS：得点／OPP：失点／DIFF：得失点差／FG%・3P%・FT%：成功率（合計の成功数÷試投数）／3PM：3ポイント成功数／ORB・DRB・TRB：オフェンス・ディフェンス・合計リバウンド／AST：アシスト／STL：スティール／BLK：ブロック／TOV：ターンオーバー／PF：ファウル</p>
              {data.incompleteGames > 0 && <p>チーム合計がそろっていない{data.incompleteGames}試合は集計していません。</p>}
            </div>
          </>
        )}
      </BriefSheet>
    </PageShell>
  );
}
