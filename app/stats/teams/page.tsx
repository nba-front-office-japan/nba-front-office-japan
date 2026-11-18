import Link from "next/link";
import type { Metadata } from "next";
import { BriefSheet, BriefSide } from "@/components/brief-sheet";
import { PageShell } from "@/components/page-shell";
import { StatsKindTabs } from "@/components/stats-kind-tabs";
import { TeamStatsListTable } from "@/components/team-stats-list-table";
import { gameDateLabel } from "@/lib/player-box-score-stats";
import { ROSTER_SEASON, seasonLabel } from "@/lib/seasons";
import { SeasonSelect } from "@/components/season-select";
import { PLAYER_TOTALS_SEASONS, fetchTeamStatsFromPlayerTotals, fetchTeamStatsList } from "@/lib/team-stats-data";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// チームスタッツ一覧。今季のレギュラーシーズンを、取り込んだ試合のボックススコア(チーム合計)から集計する(lib/team-stats-data.ts)。
// 過去シーズン(?season=2025 など)は、選手のシーズン成績(player_stats)の合算で表示する(勝敗・失点・相手チームの成績は無し)。
// canonical はシーズンによらず /stats/teams(選手スタッツ一覧 /stats と同じ考え方)。
// 取り込んだ試合が再デプロイなしで反映されるよう、順位表・選手スタッツ一覧の今季分と同じ5分ごとに集計し直す。
export const revalidate = 300;

const SEASON = ROSTER_SEASON;
const LABEL = seasonLabel(SEASON);
// 選べるシーズン(新しい順)。初期表示は今季
const SEASONS = [SEASON, ...Object.keys(PLAYER_TOTALS_SEASONS).map(Number).sort((a, b) => b - a)];

function parseSeason(value: string | string[] | undefined): number {
  const season = Number(Array.isArray(value) ? value[0] : value);
  return SEASONS.includes(season) ? season : SEASON;
}

const DESCRIPTION = `NBA全30チームの${LABEL}シーズン成績を一覧で（試合ごとに自動更新）。得点・失点・得失点差・FG%・3P%・リバウンド・アシストなどで並べ替えられます。相手チームの成績（被FG%など）や過去シーズンも見られます。`;

// タイトルは表示中のシーズンにする。説明文と canonical は今季(/stats/teams)のまま
export async function generateMetadata({ searchParams }: PageProps<"/stats/teams">): Promise<Metadata> {
  const label = seasonLabel(parseSeason((await searchParams).season));
  return {
    title: `NBAチームスタッツ ${label}（得点・失点・FG%・リバウンド） | NBA Front Office Japan`,
    description: DESCRIPTION,
    alternates: { canonical: "/stats/teams" },
  };
}

export default async function TeamStatsPage({ searchParams }: PageProps<"/stats/teams">) {
  const season = parseSeason((await searchParams).season);
  const isCurrent = season === SEASON;
  const label = seasonLabel(season);
  let data: Awaited<ReturnType<typeof fetchTeamStatsList>> | null = null;
  let error: string | null = null;
  try {
    data = isCurrent ? await fetchTeamStatsList(createServerSupabaseClient(), season) : await fetchTeamStatsFromPlayerTotals(createServerSupabaseClient(), season);
  } catch (cause) {
    error = cause instanceof Error ? cause.message : "チームスタッツの取得に失敗しました。";
  }

  return (
    <PageShell>
      <BriefSheet
        file="03"
        mark={["TEAM", "STATS"]}
        edition={`${label} REGULAR SEASON`}
        report="LEAGUE-WIDE TEAM DATA"
        kicker="Team Stats"
        title="チームスタッツ"
        lead={`${label}レギュラーシーズンの30チームの成績を、1試合平均で並べる。見出しを押すと並べ替えられる。`}
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
        <SeasonSelect
          season={season}
          options={SEASONS.map((s) => ({ season: s, label: seasonLabel(s), href: s === SEASON ? "/stats/teams" : `/stats/teams?season=${s}` }))}
        />
        {error ? (
          <p className="border-l-4 border-red-500 bg-red-50 px-4 py-3 text-sm text-red-800 dark:bg-red-950/30 dark:text-red-200">{error}</p>
        ) : !data || (data.source === "box" && data.gamesCounted === 0) ? (
          <p className="border border-line bg-surface px-4 py-8 text-sm text-muted">レギュラーシーズンの試合結果がまだないため、チームスタッツは開幕後に表示します。</p>
        ) : (
          <>
            <TeamStatsListTable key={season} rows={data.rows} hasOpponent={data.source === "box"} />
            <div className="mt-8 space-y-1 border border-line bg-surface px-4 py-3 text-xs leading-6 text-muted">
              {data.source === "box" ? (
                <p>試合のボックススコア（チーム合計）から自動で集計しています（試合終了後に更新）。プレシーズン・NBAカップ決勝は含みません。</p>
              ) : (
                <p>
                  {label}は、収録している選手のシーズン成績をチームごとに足して、レギュラーシーズンの{PLAYER_TOTALS_SEASONS[season]?.games}試合で割った値です。
                  勝敗・失点・相手チームの成績はまだ表示できません（過去の試合結果の取り込み後に追加予定）。
                </p>
              )}
              <p>PTS：得点／OPP：失点／DIFF：得失点差／FG%・3P%・FT%：成功率（合計の成功数÷試投数）／3PM：3ポイント成功数／ORB・DRB・TRB：オフェンス・ディフェンス・合計リバウンド／AST：アシスト／STL：スティール／BLK：ブロック／TOV：ターンオーバー／PF：ファウル</p>
              {data.incompleteGames > 0 && <p>チーム合計がそろっていない{data.incompleteGames}試合は集計していません。</p>}
            </div>
          </>
        )}
      </BriefSheet>
    </PageShell>
  );
}
