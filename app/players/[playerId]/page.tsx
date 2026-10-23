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
import {
  fetchPlayerPageBase,
  playerIntroSentence,
  playerPageDescription,
  playerPageTitle,
} from "@/lib/player-page";

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

  const title = playerPageTitle(base.player, view);
  const description = playerPageDescription(base);
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

  return (
    <PageShell>
      <PlayerHeader
        player={player}
        currentTeam={currentTeam}
        currentTeamPending={base.currentRosterTeamId === null}
      />
      {selectedView === "profile" && <p className="mt-4 text-sm text-muted">{playerIntroSentence(base)}</p>}
      <div className="mt-6 flex flex-wrap gap-2">
        {VIEW_OPTIONS.map((opt) => (
          <Link
            key={opt.view}
            href={opt.view === "profile" ? `/players/${playerId}` : `/players/${playerId}?view=${opt.view}`}
            aria-current={selectedView === opt.view ? "page" : undefined}
            className={`px-4 py-2 text-sm font-bold transition-colors ${
              selectedView === opt.view
                ? "bg-blue text-white"
                : "border border-line text-muted hover:text-foreground"
            }`}
          >
            {opt.label}
          </Link>
        ))}
      </div>
      {selectedView === "profile" && awardSummaries.length > 0 && <PlayerAwardHistory summaries={awardSummaries} />}
      {selectedView === "profile" && awardLabels.length > 0 && (
        <div className="mt-8 border border-line bg-surface p-6">
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
