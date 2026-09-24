import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/page-shell";
import {
  TeamRosterProfileTable,
  type ProfileRow,
} from "@/components/team-roster-profile-table";
import {
  TeamRosterStatsTable,
  type TeamStatsRow,
} from "@/components/team-roster-stats-table";
import { deriveStats, aggregatePlayerSeasonStats } from "@/lib/stats";
import { formatDraftInfo, draftSortValue } from "@/lib/draft-format";
import type { Database } from "@/lib/supabase/types";

type PlayerStatsRow = Database["public"]["Tables"]["player_stats"]["Row"];

const CURRENT_ROSTER_SEASON = 2026;
const PRIOR_SEASON = 2025;

// 2026-27シーズンの年齢基準日(2026年10月1日)。年齢はDBに保存せず生年月日から計算する。
const AGE_REFERENCE = { year: 2026, month: 10, day: 1 };

function calcAge(birthDate: string | null): number | null {
  if (!birthDate) return null;
  const [y, m, d] = birthDate.split("-").map(Number);
  if (!y || !m || !d) return null;
  let age = AGE_REFERENCE.year - y;
  if (m > AGE_REFERENCE.month || (m === AGE_REFERENCE.month && d > AGE_REFERENCE.day)) {
    age -= 1;
  }
  return age;
}

export default async function PlayerGuideTeamPage({
  params,
  searchParams,
}: PageProps<"/players/guide/[teamId]">) {
  const { teamId } = await params;
  const { view: viewParam } = await searchParams;
  const selectedView = viewParam === "stats" ? "stats" : "profile";

  const supabase = createServerSupabaseClient();

  const { data: team, error: teamError } = await supabase
    .from("teams")
    .select("*")
    .eq("id", teamId)
    .single();

  if (teamError || !team) {
    notFound();
  }

  const viewToggle = (
    <div className="mb-6 flex gap-2">
      {[
        { view: "profile", label: "Profile" },
        { view: "stats", label: "Stats" },
      ].map((opt) => (
        <Link
          key={opt.view}
          href={`/players/guide/${teamId}?view=${opt.view}`}
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
  );

  const header = (
    <>
      <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">
        選手名鑑 2026 · {team.abbreviation}
      </p>
      <h1 className="mb-6 text-[32px] font-semibold tracking-tight sm:text-[36px]">
        {team.name}
      </h1>
    </>
  );

  const { data: rosterAssignments } = await supabase
    .from("player_season_rosters")
    .select("*")
    .eq("team_id", teamId)
    .eq("season", CURRENT_ROSTER_SEASON);

  if (!rosterAssignments || rosterAssignments.length === 0) {
    return (
      <PageShell>
        {header}
        <div className="border border-line bg-surface p-10 text-center">
          <p className="text-lg font-bold">ロスター準備中</p>
          <p className="mt-2 text-sm text-muted">
            2026-27シーズンのロスター情報はまだ登録されていません。
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
    age: calcAge(player.birth_date),
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
  // デフォルトはPTS降順。2025-26成績がない選手はロスターから除外せず、末尾にまとめる。
  teamStatsRows.sort((a, b) => {
    const aHasStats = a.stats !== null;
    const bHasStats = b.stats !== null;
    if (aHasStats !== bHasStats) return aHasStats ? -1 : 1;
    if (aHasStats && bHasStats) return (b.stats!.ppg ?? 0) - (a.stats!.ppg ?? 0);
    return a.name.localeCompare(b.name, "ja");
  });

  return (
    <PageShell>
      {header}
      {viewToggle}

      {selectedView === "profile" ? (
        <TeamRosterProfileTable rows={profileRows} />
      ) : (
        <div>
          <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">
            2025-26 ROSTER STATS
          </p>
          <p className="mb-4 text-xs font-bold text-[#ac6811]">
            2026-27開幕時ロスターに含まれる選手の2025-26レギュラーシーズン成績です。2025-26のチーム成績ではありません。
          </p>
          <TeamRosterStatsTable rows={teamStatsRows} />
        </div>
      )}
    </PageShell>
  );
}
