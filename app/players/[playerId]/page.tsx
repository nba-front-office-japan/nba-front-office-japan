import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/page-shell";
import { PlayerHeader } from "@/components/player-header";
import {
  PlayerSeasonStats,
  type PlayerStatRow,
} from "@/components/player-season-stats";
import { AWARDS_SEASON, getAwardLabel } from "@/lib/awards/constants";
import { summarizeAwards } from "@/lib/awards/history";
import { PlayerAwardHistory } from "@/components/player-award-history";
import { FeaturedPlayerProfile } from "@/components/featured-player-profile";
import { featuredPlayerFor } from "@/lib/featured-players";
import { salaryPlayerByName, salaryPlayersByName } from "@/lib/salary/data";
import { playerDataSummary } from "@/lib/player-summary";
import {
  fetchPlayerPageBase,
  playerPageDescription,
  playerPageTitle,
} from "@/lib/player-page";
import { fetchPlayerCurrentSeasonStats, gameDateLabel } from "@/lib/player-box-score-stats";
import { ROSTER_SEASON, seasonLabel } from "@/lib/seasons";
import { deriveStats, formatPct, formatStat } from "@/lib/stats";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { fetchPlayerRelatedArticles } from "@/lib/news/player-articles";
import { formatArticleDate } from "@/components/news/article-view";

// 選手ページは Profile(基本情報・受賞歴)と Stats(シーズン別成績)を ?view= で切り替える。
// 上部の選手情報(PlayerHeader)はどちらの表示でも出す。
type PlayerView = "profile" | "stats";

const VIEW_OPTIONS: { view: PlayerView; label: string }[] = [
  { view: "profile", label: "Profile" },
  { view: "stats", label: "Stats" },
];

// タイトル・説明文・canonical。canonical は Profile が /players/{id}、Stats が /players/{id}?view=stats(ほかのクエリは付けない)
export async function generateMetadata({ params, searchParams }: PageProps<"/players/[playerId]">): Promise<Metadata> {
  const { playerId } = await params;
  const { view: viewParam } = await searchParams;
  const view: PlayerView = viewParam === "stats" ? "stats" : "profile";
  const base = await fetchPlayerPageBase(playerId);
  if (!base) return {};

  const current = await fetchPlayerCurrentSeasonStats(playerId, ROSTER_SEASON);
  const title = playerPageTitle(base.player, view, current);
  const description = playerPageDescription(base, current);
  const canonical = view === "stats" ? `/players/${playerId}?view=stats` : `/players/${playerId}`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical },
  };
}

export default async function PlayerDetailPage({
  params,
  searchParams,
}: PageProps<"/players/[playerId]">) {
  const { playerId } = await params;
  const { view: viewParam } = await searchParams;
  const selectedView: PlayerView = viewParam === "stats" ? "stats" : "profile";
  const supabase = createServerSupabaseClient();

  // 選手と2026-27の現在所属（player_team_historyの日付範囲モデルとは別の、
  // シーズン単位の単純な所属テーブル）。所属の行が無ければ「ロスター準備中」。
  // generateMetadata と同じ取得(lib/player-page.ts の cache())なので、DBへの問い合わせは1回だけ
  const base = await fetchPlayerPageBase(playerId);
  if (!base) {
    notFound();
  }
  const { player, currentTeam } = base;

  // 今季(2026-27)のレギュラーシーズン成績。ボックススコアを取り込むたびに自動で最新になる(generateMetadata と共通の取得)
  const current = await fetchPlayerCurrentSeasonStats(playerId, ROSTER_SEASON);
  const currentDerived = current ? deriveStats(current.totals) : null;

  const { data: stats, error: statsError } = await supabase
    .from("player_stats")
    .select("*")
    .eq("player_id", playerId);

  const teamIds = [
    ...new Set(
      (stats ?? [])
        .map((s) => s.team_id)
        .filter((id): id is string => id !== null)
    ),
  ];

  const { data: statTeams } =
    teamIds.length > 0
      ? await supabase.from("teams").select("id, abbreviation").in("id", teamIds)
      : { data: [] as { id: string; abbreviation: string }[] };

  const teamAbbrById = new Map(
    (statTeams ?? []).map((t) => [t.id, t.abbreviation])
  );

  const statRows: PlayerStatRow[] = (stats ?? []).map((s) => ({
    id: s.id,
    season: s.season,
    teamLabel: s.team_id ? teamAbbrById.get(s.team_id) ?? "-" : "TOT",
    seasonType: s.season_type,
    isTotal: s.team_id === null,
    gamesPlayed: s.games_played,
    minutesPlayed: s.minutes_played,
    points: s.points,
    reboundsOffensive: s.rebounds_offensive,
    reboundsDefensive: s.rebounds_defensive,
    reboundsTotal: s.rebounds_total,
    assists: s.assists,
    steals: s.steals,
    blocks: s.blocks,
    turnovers: s.turnovers,
    personalFouls: s.personal_fouls,
    fieldGoalsMade: s.field_goals_made,
    fieldGoalsAttempted: s.field_goals_attempted,
    threePointersMade: s.three_pointers_made,
    threePointersAttempted: s.three_pointers_attempted,
    freeThrowsMade: s.free_throws_made,
    freeThrowsAttempted: s.free_throws_attempted,
  }));

  // 2025-26 アワード（受賞・選出がある場合のみ表示）。
  const { data: awards } = await supabase
    .from("season_player_awards")
    .select("*")
    .eq("player_id", playerId)
    .eq("season", AWARDS_SEASON)
    .order("display_order");

  const awardLabels = (awards ?? []).map((a) =>
    getAwardLabel(a.award_key, a.selection_team)
  );

  // 個人賞・表彰の履歴(管理画面のExcelから取り込んだもの)。表彰歴がない選手には表示しない。
  // テーブルが未作成・取得に失敗した場合も、プロフィールのほかの表示は変えない
  const { data: awardHistory } =
    selectedView === "profile"
      ? await supabase.from("player_award_records").select("award_key, season, selection_team").eq("player_id", playerId)
      : { data: null };
  const awardSummaries = summarizeAwards(awardHistory ?? []);

  // 有名選手(lib/featured-players.ts)は、Profile に日本語の解説(経歴・プレースタイル・年俸など)を出す
  const featured = featuredPlayerFor(player.full_name);
  // 全選手の「データで見る」: 成績と年俸から作る文章。年俸は有名選手なら解説の「年俸・契約」に出すので省き、
  // それ以外はサラリーデータに同じ名前の行が1つだけのとき出す(解雇後の支払いで複数行ある選手は誤解を招くため出さない)
  const salaryRows = featured ? [] : salaryPlayersByName(player.full_name);
  const dataSummary =
    selectedView === "profile"
      ? playerDataSummary({
          nameJa: player.full_name_ja ?? player.full_name,
          stats: stats ?? [],
          current,
          salary: salaryRows.length === 1 ? salaryRows[0] : null,
        })
      : [];

  // 関連ニュース: 公開記事のタイトル・本文に日本語名が出てくるもの(lib/news/player-articles.ts)
  const relatedArticles =
    selectedView === "profile" ? await fetchPlayerRelatedArticles(createAdminSupabaseClient(), player.full_name_ja) : [];

  return (
    <PageShell>
      <PlayerHeader
        player={player}
        currentTeam={currentTeam}
        currentTeamPending={base.currentRosterTeamId === null}
        actions={
          <div className="mb-4 flex flex-wrap gap-2">
            {VIEW_OPTIONS.map((opt) => (
              <Link
                key={opt.view}
                href={opt.view === "profile" ? `/players/${playerId}` : `/players/${playerId}?view=${opt.view}`}
                aria-current={selectedView === opt.view ? "page" : undefined}
                className={`selection-button selection-blue rounded-lg px-4 py-2 text-sm font-bold transition-all duration-200 ${
                  selectedView === opt.view
                    ? "bg-blue text-white"
                    : "border border-line text-muted hover:text-foreground"
                }`}
              >
                {opt.label}
              </Link>
            ))}
          </div>
        }
      />
      {current && currentDerived && (
        <section aria-labelledby="player-current-season" className="mt-6 border border-line bg-surface p-5 sm:p-6">
          <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">This Season</p>
          <h2 id="player-current-season" className="text-lg font-semibold">
            {seasonLabel(current.season)} 今季成績
          </h2>
          <p className="mb-4 mt-1 text-xs text-muted">
            レギュラーシーズン・{gameDateLabel(current.lastGameDate)}の試合まで（現地日付）
          </p>
          <dl className="grid grid-cols-3 gap-x-4 gap-y-3 text-sm sm:grid-cols-6">
            {[
              { label: "試合", value: String(current.totals.gamesPlayed) },
              { label: "平均得点", value: formatStat(currentDerived.ppg) },
              { label: "平均リバウンド", value: formatStat(currentDerived.rpg) },
              { label: "平均アシスト", value: formatStat(currentDerived.apg) },
              { label: "平均出場時間", value: formatStat(currentDerived.mpg) },
              { label: "FG%", value: formatPct(currentDerived.fgPct) },
              { label: "3P%", value: formatPct(currentDerived.threePct) },
              { label: "FT%", value: formatPct(currentDerived.ftPct) },
              { label: "平均スティール", value: formatStat(currentDerived.stlPg) },
              { label: "平均ブロック", value: formatStat(currentDerived.blkPg) },
            ].map((item) => (
              <div key={item.label}>
                <dt className="text-muted">{item.label}</dt>
                <dd className="font-semibold tabular-nums">{item.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
      {selectedView === "profile" && awardSummaries.length > 0 && <PlayerAwardHistory summaries={awardSummaries} />}
      {selectedView === "profile" && awardLabels.length > 0 && (
        <div className="mt-6 border border-line bg-surface p-6">
          <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">
            Awards
          </p>
          <h2 className="mb-4 text-lg font-semibold">2025-26 Awards</h2>
          <ul className="space-y-2">
            {awardLabels.map((label) => (
              <li key={label} className="border-l-[3px] border-gold pl-3 text-sm font-bold">
                {label}
              </li>
            ))}
          </ul>
        </div>
      )}
      {selectedView === "profile" && featured && (
        <FeaturedPlayerProfile featured={featured} salary={salaryPlayerByName(featured.name)} />
      )}
      {dataSummary.length > 0 && (
        <section aria-labelledby="player-data-summary" className="mt-8 border border-line bg-surface p-5 sm:p-6">
          <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">By the Numbers</p>
          <h2 id="player-data-summary" className="mb-4 text-lg font-semibold">
            データで見る{player.full_name_ja ?? player.full_name}
          </h2>
          <div className="space-y-3 text-sm leading-7">
            {dataSummary.map((text) => (
              <p key={text}>{text}</p>
            ))}
          </div>
        </section>
      )}
      {relatedArticles.length > 0 && (
        <section aria-labelledby="player-related-news" className="mt-8 border border-line bg-surface p-5 sm:p-6">
          <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">News</p>
          <h2 id="player-related-news" className="mb-4 text-lg font-semibold">
            {player.full_name_ja ?? player.full_name}の関連ニュース
          </h2>
          <ul className="space-y-3 text-sm">
            {relatedArticles.map((article) => (
              <li key={article.id} className="border-l-[3px] border-blue pl-3">
                <Link href={`/news/${article.id}`} className="font-semibold hover:text-blue hover:underline">
                  {article.headlineJa}
                </Link>
                {article.publishedAt && (
                  <span className="ml-2 text-xs text-muted">{formatArticleDate(article.publishedAt)}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
      {selectedView === "profile" && (
        <p className="mt-6 text-sm text-muted">
          シーズン別成績（全期間）は
          <Link
            href={`/players/${playerId}?view=stats`}
            className="mx-1 font-semibold text-blue underline-offset-2 hover:underline"
          >
            Stats
          </Link>
          で確認できます。
        </p>
      )}
      {selectedView === "stats" && (
        <div className="mt-8 border border-line bg-surface p-6">
          <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">
            Season Stats
          </p>
          <h2 className="mb-4 text-lg font-semibold">シーズン別成績（全期間）</h2>
          {statsError ? (
            <p className="text-sm text-red-600 dark:text-red-400">
              スタッツデータの取得に失敗しました: {statsError.message}
            </p>
          ) : (
            <PlayerSeasonStats rows={statRows} />
          )}
        </div>
      )}
    </PageShell>
  );
}
