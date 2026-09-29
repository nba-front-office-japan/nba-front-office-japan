import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/page-shell";
import { teamThemeBackground } from "@/lib/team-colors";
import {
  TeamRosterProfileTable,
  type ProfileRow,
} from "@/components/team-roster-profile-table";
import {
  TeamRosterStatsTable,
  type TeamStatsRow,
} from "@/components/team-roster-stats-table";
import { TeamProfileView } from "@/components/team-profile-view";
import { deriveStats, aggregatePlayerSeasonStats } from "@/lib/stats";
import { formatDraftInfo, draftSortValue } from "@/lib/draft-format";
import { ageAt } from "@/lib/age";
import { ROSTER_SEASON, STATS_SEASON, seasonLabel, ageReferenceFor } from "@/lib/seasons";
import { fetchTeamProfileData } from "@/lib/team-profile-data";
import type { Database } from "@/lib/supabase/types";

type PlayerStatsRow = Database["public"]["Tables"]["player_stats"]["Row"];

// ロスターはロスターシーズン、Statsは成績シーズン(ロスターの選手の直近の成績)を読む
const CURRENT_ROSTER_SEASON = ROSTER_SEASON;
const PRIOR_SEASON = STATS_SEASON;
const ROSTER_LABEL = seasonLabel(CURRENT_ROSTER_SEASON);
const STATS_LABEL = seasonLabel(PRIOR_SEASON);

type GuideView = "profile" | "stats" | "team-profile";

const VIEW_OPTIONS: { view: GuideView; label: string }[] = [
  { view: "profile", label: "Profile" },
  { view: "stats", label: "Stats" },
  { view: "team-profile", label: "Team Profile" },
];

export default async function PlayerGuideTeamPage({
  params,
  searchParams,
}: PageProps<"/players/guide/[teamId]">) {
  const { teamId } = await params;
  const { view: viewParam } = await searchParams;
  const selectedView: GuideView =
    viewParam === "stats" ? "stats" : viewParam === "team-profile" ? "team-profile" : "profile";

  const supabase = createServerSupabaseClient();

  const { data: team, error: teamError } = await supabase
    .from("teams")
    .select("*")
    .eq("id", teamId)
    .single();

  if (teamError || !team) {
    notFound();
  }

  // チームページ(/teams/[teamId])と同じく、ヘッダーより下の背景をチームのメインカラーにする
  const teamColor = teamThemeBackground(team.abbreviation);

  const viewToggle = (
    <div className="mb-6 flex flex-wrap gap-2">
      {VIEW_OPTIONS.map((opt) => (
        <Link
          key={opt.view}
          href={`/players/guide/${teamId}?view=${opt.view}`}
          className={`px-4 py-2 text-sm font-bold transition-colors ${
            selectedView === opt.view
              ? teamColor
                ? "border border-surface bg-surface text-foreground"
                : "bg-blue text-white"
              : "border border-line text-muted hover:text-foreground"
          }`}
        >
          {opt.label}
        </Link>
      ))}
    </div>
  );

  const header = (
    <>
      <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">
        選手名鑑 {ROSTER_LABEL} · {team.abbreviation}
      </p>
      <h1 className="mb-3 text-[32px] font-semibold tracking-tight sm:text-[36px]">
        {team.name}
      </h1>
      <p className="mb-6 text-sm">
        <Link
          href={`/teams/${teamId}`}
          className="font-semibold text-foreground underline underline-offset-4 hover:no-underline"
        >
          {STATS_LABEL}チーム記録（Overview・Profile・Stats）→
        </Link>
      </p>
    </>
  );

  // Team Profile(基本情報・ホームアリーナ・フロント・2026-27のコーチ陣・確認情報)
  if (selectedView === "team-profile") {
    const { profile, staff, arena, valuation } = await fetchTeamProfileData(supabase, teamId);
    return (
      <PageShell teamColor={teamColor}>
        {header}
        {viewToggle}
        <TeamProfileView
          team={team}
          profile={profile}
          arena={arena}
          valuation={valuation}
          assistantCoaches={staff}
        />
      </PageShell>
    );
  }

  const { data: rosterAssignments } = await supabase
    .from("player_season_rosters")
    .select("*")
    .eq("team_id", teamId)
    .eq("season", CURRENT_ROSTER_SEASON);

  if (!rosterAssignments || rosterAssignments.length === 0) {
    return (
      <PageShell teamColor={teamColor}>
        {header}
        <div className="border border-line bg-surface p-10 text-center">
          <p className="text-lg font-bold">ロスター準備中</p>
          <p className="mt-2 text-sm text-muted">
            {ROSTER_LABEL}シーズンのロスター情報はまだ登録されていません。
          </p>
        </div>
      </PageShell>
    );
  }

  const playerIds = rosterAssignments.map((r) => r.player_id);
  const { data: players } = await supabase.from("players").select("*").in("id", playerIds);

  const { data: priorStats } = await supabase
    .from("player_stats")
    .select("*")
    .eq("season", PRIOR_SEASON)
    .eq("season_type", "regular_season")
    .in("player_id", playerIds);

  const priorStatsByPlayer = new Map<string, PlayerStatsRow[]>();
  for (const row of priorStats ?? []) {
    const list = priorStatsByPlayer.get(row.player_id) ?? [];
    list.push(row);
    priorStatsByPlayer.set(row.player_id, list);
  }

  const positionByPlayerId = new Map(
    rosterAssignments.map((r) => [r.player_id, r.position])
  );
  const yosByPlayerId = new Map(
    rosterAssignments.map((r) => [r.player_id, r.years_of_service ?? null])
  );
  const jerseyByPlayerId = new Map(
    rosterAssignments.map((r) => [r.player_id, r.jersey_number ?? null])
  );

  const profileRows: ProfileRow[] = (players ?? []).map((player) => ({
    id: player.id,
    name: player.full_name_ja ?? player.full_name,
    nameEn: player.full_name,
    position: positionByPlayerId.get(player.id) ?? null,
    jerseyNumber: jerseyByPlayerId.get(player.id) ?? null,
    birthDate: player.birth_date,
    age: ageAt(player.birth_date, ageReferenceFor(CURRENT_ROSTER_SEASON)),
    heightCm: player.height_cm,
    weightKg: player.weight_kg,
    preDraftTeam: player.pre_draft_team ?? null,
    nationality: player.nationality ?? null,
    yearsOfService: yosByPlayerId.get(player.id) ?? null,
    draftText: formatDraftInfo(player),
    draftSort: draftSortValue(player),
  }));
  profileRows.sort((a, b) => a.name.localeCompare(b.name, "ja"));

  const teamStatsRows: TeamStatsRow[] = (players ?? []).map((player) => {
    const totals = aggregatePlayerSeasonStats(priorStatsByPlayer.get(player.id) ?? []);
    return {
      id: player.id,
      name: player.full_name_ja ?? player.full_name,
      teamAbbr: team.abbreviation,
      position: positionByPlayerId.get(player.id) ?? null,
      gamesPlayed: totals?.gamesPlayed ?? null,
      stats: totals ? deriveStats(totals) : null,
    };
  });
  // デフォルトはPTS降順。成績シーズンの成績がない選手はロスターから除外せず、末尾にまとめる。
  teamStatsRows.sort((a, b) => {
    const aHasStats = a.stats !== null;
    const bHasStats = b.stats !== null;
    if (aHasStats !== bHasStats) return aHasStats ? -1 : 1;
    if (aHasStats && bHasStats) return (b.stats!.ppg ?? 0) - (a.stats!.ppg ?? 0);
    return a.name.localeCompare(b.name, "ja");
  });

  return (
    <PageShell teamColor={teamColor}>
      {header}
      {viewToggle}

      {selectedView === "profile" ? (
        <TeamRosterProfileTable rows={profileRows} />
      ) : (
        <div>
          <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">
            {STATS_LABEL} ROSTER STATS
          </p>
          <p className="mb-4 border-l-[3px] border-gold pl-3 text-xs font-bold text-foreground">
            {ROSTER_LABEL}ロスターに含まれる選手の{STATS_LABEL}レギュラーシーズン成績です。{STATS_LABEL}のチーム成績ではありません。
          </p>
          <TeamRosterStatsTable rows={teamStatsRows} />
        </div>
      )}
    </PageShell>
  );
}
