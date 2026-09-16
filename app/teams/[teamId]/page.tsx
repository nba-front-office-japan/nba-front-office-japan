import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getLatestSeason } from "@/lib/supabase/current-season";
import { PageShell } from "@/components/page-shell";
import { TeamHeader } from "@/components/team-header";
import { TeamDirectory } from "@/components/team-directory";
import { TeamTabs } from "@/components/team-tabs";
import { TeamRoster, type RosterRow } from "@/components/team-roster";
import { StatsTable, type StatRow } from "@/components/stats-table";
import { deriveStats, formatStat, toRawStatTotals } from "@/lib/stats";
import type { Database } from "@/lib/supabase/types";

type PlayerStatsRow = Database["public"]["Tables"]["player_stats"]["Row"];

function calcAge(birthDate: string | null): number | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const hasHadBirthdayThisYear =
    now.getMonth() > birth.getMonth() ||
    (now.getMonth() === birth.getMonth() && now.getDate() >= birth.getDate());
  if (!hasHadBirthdayThisYear) age -= 1;
  return age;
}

// 移籍があった選手は、このチーム在籍分の行(team_id一致)を優先し、
// 無ければTOT行(team_id=NULL)にフォールバックする。
function resolveTeamStatsRows(
  stats: PlayerStatsRow[],
  teamId: string
): PlayerStatsRow[] {
  const bestByKey = new Map<string, PlayerStatsRow>();
  for (const row of stats) {
    const key = `${row.player_id}:${row.season_type}`;
    const existing = bestByKey.get(key);
    const isTeamSpecific = row.team_id === teamId;
    if (!existing || (isTeamSpecific && existing.team_id !== teamId)) {
      bestByKey.set(key, row);
    }
  }
  return [...bestByKey.values()];
}

export default async function TeamDetailPage({
  params,
}: PageProps<"/teams/[teamId]">) {
  const { teamId } = await params;
  const supabase = createServerSupabaseClient();

  const { data: team, error: teamError } = await supabase
    .from("teams")
    .select("*")
    .eq("id", teamId)
    .single();

  if (teamError || !team) {
    notFound();
  }

  const { data: allTeams } = await supabase.from("teams").select("*").order("name");

  const { data: history, error: historyError } = await supabase
    .from("player_team_history")
    .select("player_id")
    .eq("team_id", teamId)
    .is("end_date", null);

  const playerIds = (history ?? []).map((row) => row.player_id);

  const { data: players, error: playersError } =
    playerIds.length > 0
      ? await supabase.from("players").select("*").in("id", playerIds)
      : { data: [], error: null };

  const latestSeason = await getLatestSeason(supabase);

  let resolvedStats: PlayerStatsRow[] = [];
  if (latestSeason !== null && playerIds.length > 0) {
    const { data: stats } = await supabase
      .from("player_stats")
      .select("*")
      .eq("season", latestSeason)
      .in("player_id", playerIds);
    resolvedStats = resolveTeamStatsRows(stats ?? [], teamId);
  }

  const regularSeasonStats = resolvedStats.filter(
    (s) => s.season_type === "regular_season"
  );

  const playerNameById = new Map((players ?? []).map((p) => [p.id, p.full_name]));
  const teamAbbrById = new Map(
    (allTeams ?? []).map((t) => [t.id, t.abbreviation])
  );

  const rosterRows: RosterRow[] = (players ?? []).map((player) => {
    const statRow = regularSeasonStats.find((s) => s.player_id === player.id);
    const derived = statRow ? deriveStats(toRawStatTotals(statRow)) : null;
    return {
      id: player.id,
      fullName: player.full_name,
      position: player.position,
      age: calcAge(player.birth_date),
      ppg: derived?.ppg ?? null,
      rpg: derived?.rpg ?? null,
      apg: derived?.apg ?? null,
    };
  });

  const withStats = rosterRows.filter((r) => r.ppg !== null);
  const leadingScorer = withStats.length
    ? withStats.reduce((a, b) => ((b.ppg ?? 0) > (a.ppg ?? 0) ? b : a))
    : null;
  const teamPpg = withStats.reduce((sum, r) => sum + (r.ppg ?? 0), 0);
  const teamRpg = withStats.reduce((sum, r) => sum + (r.rpg ?? 0), 0);
  const teamApg = withStats.reduce((sum, r) => sum + (r.apg ?? 0), 0);

  const threePctValues = regularSeasonStats
    .map((s) => deriveStats(toRawStatTotals(s)).threePct)
    .filter((v): v is number => v !== null);
  const avgThreePct = threePctValues.length
    ? threePctValues.reduce((a, b) => a + b, 0) / threePctValues.length
    : null;

  const agesKnown = rosterRows
    .map((r) => r.age)
    .filter((a): a is number => a !== null);
  const avgAge = agesKnown.length
    ? agesKnown.reduce((a, b) => a + b, 0) / agesKnown.length
    : null;

  const statRows: StatRow[] = resolvedStats.map((s) => ({
    id: s.id,
    playerName: playerNameById.get(s.player_id) ?? "不明な選手",
    teamLabel: s.team_id ? teamAbbrById.get(s.team_id) ?? "-" : "TOT",
    seasonType: s.season_type,
    gamesPlayed: s.games_played,
    points: s.points,
    reboundsTotal: s.rebounds_total,
    assists: s.assists,
    fieldGoalsMade: s.field_goals_made,
    fieldGoalsAttempted: s.field_goals_attempted,
    threePointersMade: s.three_pointers_made,
    threePointersAttempted: s.three_pointers_attempted,
    freeThrowsAttempted: s.free_throws_attempted,
  }));

  return (
    <PageShell>
      <TeamHeader
        team={team}
        playerCount={rosterRows.length}
        teamPpg={withStats.length ? teamPpg : null}
        team3pPct={avgThreePct}
      />

      <div className="section mt-8 border border-line bg-surface p-6">
        <TeamDirectory teams={allTeams ?? []} activeTeamId={teamId} />
      </div>

      <div className="mt-8">
        {historyError || playersError ? (
          <p className="text-sm text-red-600 dark:text-red-400">
            在籍選手データの取得に失敗しました:{" "}
            {historyError?.message ?? playersError?.message}
          </p>
        ) : (
          <TeamTabs
            overview={
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
                <div className="border border-line bg-surface p-6">
                  <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">
                    2026 Team Snapshot
                  </p>
                  <h2 className="mb-4 text-xl font-semibold">{team.name}</h2>
                  <div className="grid grid-cols-1 gap-px bg-line sm:grid-cols-3">
                    {[
                      ["LEADING SCORER", leadingScorer?.fullName ?? "-"],
                      [
                        "TOP PPG",
                        leadingScorer ? `${formatStat(leadingScorer.ppg)} PPG` : "-",
                      ],
                      ["TEAM RPG", withStats.length ? formatStat(teamRpg) : "-"],
                      ["TEAM APG", withStats.length ? formatStat(teamApg) : "-"],
                      ["AVERAGE AGE", avgAge === null ? "-" : avgAge.toFixed(1)],
                      [
                        "3P%",
                        avgThreePct === null ? "-" : `${avgThreePct.toFixed(1)}%`,
                      ],
                    ].map(([label, value]) => (
                      <div key={label} className="bg-surface p-4">
                        <span className="mb-1.5 block text-[11px] text-muted">
                          {label}
                        </span>
                        <b className="text-[15px]">{value}</b>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="border border-line bg-surface p-6">
                  <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">
                    Database Coverage
                  </p>
                  <h2 className="mb-2 text-lg font-semibold">収録データ</h2>
                  <p className="text-sm text-muted">
                    ロスター、年齢、ポジション、出場試合、得点、リバウンド、アシスト、シュート指標。
                  </p>
                </div>
              </div>
            }
            roster={
              <div className="border border-line bg-surface p-6">
                <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">
                  Roster · 2026 Basic Stats
                </p>
                <h2 className="mb-4 text-lg font-semibold">Player Roster</h2>
                <TeamRoster rows={rosterRows} />
              </div>
            }
            stats={
              <div className="border border-line bg-surface p-6">
                <StatsTable rows={statRows} />
              </div>
            }
          />
        )}
      </div>
    </PageShell>
  );
}
