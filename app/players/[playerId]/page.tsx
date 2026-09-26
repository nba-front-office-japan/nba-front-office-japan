import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/page-shell";
import { PlayerHeader, type PlayerSnapshot } from "@/components/player-header";
import {
  PlayerSeasonStats,
  type PlayerStatRow,
} from "@/components/player-season-stats";
import { deriveStats, aggregatePlayerSeasonStats } from "@/lib/stats";
import { AWARDS_SEASON, getAwardLabel } from "@/lib/awards/constants";

const CURRENT_SEASON = 2026;
const PRIOR_SEASON = 2025;

export default async function PlayerDetailPage({
  params,
}: PageProps<"/players/[playerId]">) {
  const { playerId } = await params;
  const supabase = createServerSupabaseClient();

  const { data: player, error: playerError } = await supabase
    .from("players")
    .select("*")
    .eq("id", playerId)
    .single();

  if (playerError || !player) {
    notFound();
  }

  // 2026-27の現在所属（player_team_historyの日付範囲モデルとは別の、
  // シーズン単位の単純な所属テーブル）。行が無ければ「ロスター準備中」。
  const { data: currentRoster } = await supabase
    .from("player_season_rosters")
    .select("team_id")
    .eq("player_id", playerId)
    .eq("season", CURRENT_SEASON)
    .maybeSingle();

  const { data: currentTeam } = currentRoster
    ? await supabase.from("teams").select("*").eq("id", currentRoster.team_id).single()
    : { data: null };

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

  // 2025-26 レギュラーシーズン成績（移籍していれば全チーム分を合算する。
  // どれか1チーム行を任意に選ぶ処理はしない）。
  const priorSeasonRegularRows = (stats ?? []).filter(
    (s) => s.season === PRIOR_SEASON && s.season_type === "regular_season"
  );
  const seasonTotals = aggregatePlayerSeasonStats(priorSeasonRegularRows);

  const snapshot: PlayerSnapshot | null = seasonTotals
    ? { gamesPlayed: seasonTotals.gamesPlayed, ...deriveStats(seasonTotals) }
    : null;

  // 2025-26 アワード（受賞・選出がある場合のみ表示。成績スナップショットとは別枠）。
  const { data: awards } = await supabase
    .from("season_player_awards")
    .select("*")
    .eq("player_id", playerId)
    .eq("season", AWARDS_SEASON)
    .order("display_order");

  const awardLabels = (awards ?? []).map((a) =>
    getAwardLabel(a.award_key, a.selection_team)
  );

  return (
    <PageShell>
      <PlayerHeader
        player={player}
        currentTeam={currentTeam ?? null}
        currentTeamPending={!currentRoster}
        snapshot={snapshot}
      />
      {awardLabels.length > 0 && (
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
    </PageShell>
  );
}
