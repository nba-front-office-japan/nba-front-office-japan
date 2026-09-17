import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/page-shell";
import { TeamHeader } from "@/components/team-header";
import { TeamDirectory } from "@/components/team-directory";
import { TeamTabs } from "@/components/team-tabs";
import { TeamRoster, type RosterRow } from "@/components/team-roster";
import { StatsTable, type StatRow } from "@/components/stats-table";
import { deriveStats, formatStat, toRawStatTotals, aggregatePlayerSeasonStats } from "@/lib/stats";
import type { Database } from "@/lib/supabase/types";

type PlayerStatsRow = Database["public"]["Tables"]["player_stats"]["Row"];

const CURRENT_SEASON = 2026;
const PRIOR_SEASON = 2025;

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

function toStatRow(
  s: PlayerStatsRow,
  playerName: string,
  teamAbbrById: Map<string, string>
): StatRow {
  return {
    id: s.id,
    playerName,
    teamLabel: s.team_id ? teamAbbrById.get(s.team_id) ?? "-" : "TOT",
    seasonType: s.season_type,
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
  };
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
    dateStyle: "short",
    timeStyle: "short",
  });
}

export default async function TeamDetailPage({
  params,
  searchParams,
}: PageProps<"/teams/[teamId]">) {
  const { teamId } = await params;
  const { season: seasonParam } = await searchParams;
  const selectedSeason = seasonParam === String(CURRENT_SEASON) ? CURRENT_SEASON : PRIOR_SEASON;

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
  const teamAbbrById = new Map((allTeams ?? []).map((t) => [t.id, t.abbreviation]));

  const seasonToggle = (
    <div className="mb-6 flex gap-2">
      {[
        { season: PRIOR_SEASON, label: "2025-26" },
        { season: CURRENT_SEASON, label: "2026-27" },
      ].map((opt) => (
        <Link
          key={opt.season}
          href={`/teams/${teamId}?season=${opt.season}`}
          className={`px-4 py-2 text-sm font-bold transition-colors ${
            selectedSeason === opt.season
              ? "bg-blue text-white"
              : "border border-line text-muted hover:text-foreground"
          }`}
        >
          {opt.label}
        </Link>
      ))}
    </div>
  );

  // ==========================================================================
  // 2026-27シーズン（現在ロスター。player_season_rostersが未整備の間は「準備中」）
  // ==========================================================================
  if (selectedSeason === CURRENT_SEASON) {
    const { data: rosterAssignments } = await supabase
      .from("player_season_rosters")
      .select("*")
      .eq("team_id", teamId)
      .eq("season", CURRENT_SEASON);

    if (!rosterAssignments || rosterAssignments.length === 0) {
      return (
        <PageShell>
          <TeamHeader
            team={team}
            playerCount={0}
            teamPpg={null}
            team3pPct={null}
            seasonLabel="2026-27"
          />
          <div className="section mt-8 border border-line bg-surface p-6">
            <TeamDirectory teams={allTeams ?? []} activeTeamId={teamId} />
          </div>
          <div className="mt-8">
            {seasonToggle}
            <div className="border border-line bg-surface p-10 text-center">
              <p className="text-lg font-bold">ロスター準備中</p>
              <p className="mt-2 text-sm text-muted">
                2026-27シーズンのロスター情報はまだ登録されていません。
              </p>
            </div>
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

    const rosterRows: RosterRow[] = (players ?? []).map((player) => {
      const rows = priorStatsByPlayer.get(player.id) ?? [];
      const seasonTotals = aggregatePlayerSeasonStats(rows);
      const derived = seasonTotals ? deriveStats(seasonTotals) : null;
      return {
        id: player.id,
        fullName: player.full_name_ja ?? player.full_name,
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

    const threePctValues = [...priorStatsByPlayer.values()]
      .map((rows) => aggregatePlayerSeasonStats(rows))
      .filter((totals): totals is NonNullable<typeof totals> => Boolean(totals))
      .map((totals) => deriveStats(totals).threePct)
      .filter((v): v is number => v !== null);
    const avgThreePct = threePctValues.length
      ? threePctValues.reduce((a, b) => a + b, 0) / threePctValues.length
      : null;

    const lastUpdated = rosterAssignments.reduce<string | null>((latest, r) => {
      if (!latest || r.updated_at > latest) return r.updated_at;
      return latest;
    }, null);

    return (
      <PageShell>
        <TeamHeader
          team={team}
          playerCount={rosterRows.length}
          teamPpg={withStats.length ? teamPpg : null}
          team3pPct={avgThreePct}
          seasonLabel="2026-27"
        />
        <div className="section mt-8 border border-line bg-surface p-6">
          <TeamDirectory teams={allTeams ?? []} activeTeamId={teamId} />
        </div>
        <div className="mt-8">
          {seasonToggle}
          <p className="mb-4 text-xs text-muted">
            ロスター最終更新日: {formatDateTime(lastUpdated)}
          </p>

          <div className="mb-6 border border-line bg-surface p-6">
            <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">
              2026-27ロスター × 2025-26 Team Snapshot
            </p>
            <h2 className="mb-4 text-xl font-semibold">{team.name}</h2>
            <div className="grid grid-cols-1 gap-px bg-line sm:grid-cols-3">
              {[
                ["LEADING SCORER（2025-26）", leadingScorer?.fullName ?? "-"],
                ["TOP PPG（2025-26）", leadingScorer ? `${formatStat(leadingScorer.ppg)} PPG` : "-"],
                ["TEAM RPG（2025-26合算）", withStats.length ? formatStat(teamRpg) : "-"],
                ["TEAM APG（2025-26合算）", withStats.length ? formatStat(teamApg) : "-"],
                ["3P%（2025-26平均）", avgThreePct === null ? "-" : `${avgThreePct.toFixed(1)}%`],
              ].map(([label, value]) => (
                <div key={label} className="bg-surface p-4">
                  <span className="mb-1.5 block text-[11px] text-muted">{label}</span>
                  <b className="text-[15px]">{value}</b>
                </div>
              ))}
            </div>
          </div>

          <div className="border border-line bg-surface p-6">
            <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">
              2026-27 現在ロスター
            </p>
            <h2 className="mb-1 text-lg font-semibold">Player Roster</h2>
            <p className="mb-4 text-xs font-bold text-[#ac6811]">
              各選手の成績は2025-26 レギュラーシーズン成績です（2026-27シーズンの成績ではありません）。
            </p>
            <TeamRoster rows={rosterRows} />
          </div>
        </div>
      </PageShell>
    );
  }

  // ==========================================================================
  // 2025-26シーズン（実績のある選手をplayer_statsから復元して表示）
  // ==========================================================================
  const { data: seasonStats } = await supabase
    .from("player_stats")
    .select("*")
    .eq("season", PRIOR_SEASON);

  // このチームの在籍歴は「team_id一致の行がある選手」で判定する（player_stats全体を
  // resolveTeamStatsRowsに渡すと、全チームの全選手が1件ずつ拾われてしまうため、
  // 先にこのチーム所属だった選手だけへ絞り込む）。
  const teamSpecificStats = (seasonStats ?? []).filter((s) => s.team_id === teamId);
  const rosterPlayerIdSet = new Set(teamSpecificStats.map((s) => s.player_id));
  const relevantStats = (seasonStats ?? []).filter((s) => rosterPlayerIdSet.has(s.player_id));

  const resolvedStats = resolveTeamStatsRows(relevantStats, teamId);
  const regularSeasonStats = resolvedStats.filter((s) => s.season_type === "regular_season");

  const playerIds = [...new Set(regularSeasonStats.map((s) => s.player_id))];
  const { data: players, error: playersError } =
    playerIds.length > 0
      ? await supabase.from("players").select("*").in("id", playerIds)
      : { data: [], error: null };

  const playerNameById = new Map(
    (players ?? []).map((p) => [p.id, p.full_name_ja ?? p.full_name])
  );

  const rosterRows: RosterRow[] = (players ?? []).map((player) => {
    const statRow = regularSeasonStats.find((s) => s.player_id === player.id);
    const derived = statRow ? deriveStats(toRawStatTotals(statRow)) : null;
    return {
      id: player.id,
      fullName: player.full_name_ja ?? player.full_name,
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

  const agesKnown = rosterRows.map((r) => r.age).filter((a): a is number => a !== null);
  const avgAge = agesKnown.length
    ? agesKnown.reduce((a, b) => a + b, 0) / agesKnown.length
    : null;

  const statRows: StatRow[] = resolvedStats.map((s) =>
    toStatRow(s, playerNameById.get(s.player_id) ?? "不明な選手", teamAbbrById)
  );

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
        {seasonToggle}
        {playersError ? (
          <p className="text-sm text-red-600 dark:text-red-400">
            在籍選手データの取得に失敗しました: {playersError.message}
          </p>
        ) : (
          <TeamTabs
            overview={
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
                <div className="border border-line bg-surface p-6">
                  <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">
                    2025-26 Team Snapshot
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
                    2025-26レギュラーシーズンの成績から復元したロスターです。年齢、ポジション、出場試合、得点、リバウンド、アシスト、シュート指標。
                  </p>
                </div>
              </div>
            }
            roster={
              <div className="border border-line bg-surface p-6">
                <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">
                  Roster · 2025-26 Basic Stats
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
