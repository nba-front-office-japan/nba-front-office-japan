import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/page-shell";
import { TeamHeader } from "@/components/team-header";
import { TeamTabs } from "@/components/team-tabs";
import { StatsTable, type StatRow } from "@/components/stats-table";
import {
  TeamRosterProfileTable,
  type ProfileRow,
} from "@/components/team-roster-profile-table";
import { deriveStats, formatStat, toRawStatTotals } from "@/lib/stats";
import { formatDraftInfo, draftSortValue } from "@/lib/draft-format";
import { ageAt, AGE_REFERENCE_2025_26 } from "@/lib/age";
import { teamThemeBackground } from "@/lib/team-colors";
import type { Database } from "@/lib/supabase/types";

// /teams/[teamId] は「2025-26シーズンのチーム記録」(Overview / Roster / Stats)。
// 2026-27のロスターと Team Profile は選手名鑑 2026(/players/guide/[teamId])に置く。

type PlayerStatsRow = Database["public"]["Tables"]["player_stats"]["Row"];

const RECORD_SEASON = 2025;

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

export default async function TeamDetailPage({
  params,
  searchParams,
}: PageProps<"/teams/[teamId]">) {
  const { teamId } = await params;
  const { season: seasonParam, view: viewParam, tab: tabParam } = await searchParams;

  // 移した表示は選手名鑑 2026 へ恒久転送する(公開済みURLのリンク切れを防ぐ)
  if (viewParam === "profile") {
    permanentRedirect(`/players/guide/${teamId}?view=team-profile`);
  }
  if (seasonParam === "2026") {
    permanentRedirect(`/players/guide/${teamId}`);
  }

  const initialTab =
    tabParam === "roster" ? "Roster" : tabParam === "stats" ? "Stats" : "Overview";

  const supabase = createServerSupabaseClient();

  const { data: team, error: teamError } = await supabase
    .from("teams")
    .select("*")
    .eq("id", teamId)
    .single();

  if (teamError || !team) {
    notFound();
  }

  // ヘッダーより下の背景をチームのメインカラーにする(白文字が読める濃さに補正済み)
  const teamColor = teamThemeBackground(team.abbreviation);

  const { data: allTeams } = await supabase.from("teams").select("*").order("name");
  const teamAbbrById = new Map((allTeams ?? []).map((t) => [t.id, t.abbreviation]));

  // 2025-26シーズンの記録(実績のある選手を player_stats から復元して表示)
  const { data: seasonStats } = await supabase
    .from("player_stats")
    .select("*")
    .eq("season", RECORD_SEASON);

  // このチームの在籍歴は「team_id一致の行がある選手」で判定する(player_stats全体を
  // resolveTeamStatsRowsに渡すと、全チームの全選手が1件ずつ拾われてしまうため、
  // 先にこのチーム所属だった選手だけへ絞り込む)。途中移籍した選手も含む。
  const teamSpecificStats = (seasonStats ?? []).filter((s) => s.team_id === teamId);
  const rosterPlayerIdSet = new Set(teamSpecificStats.map((s) => s.player_id));
  const relevantStats = (seasonStats ?? []).filter((s) => rosterPlayerIdSet.has(s.player_id));

  const resolvedStats = resolveTeamStatsRows(relevantStats, teamId);
  const regularSeasonStats = resolvedStats.filter((s) => s.season_type === "regular_season");

  // そのチームでのレギュラーシーズン出場試合数(チーム別行のみ。TOT行は使わない)
  const gamesForTeamByPlayer = new Map(
    teamSpecificStats
      .filter((s) => s.season_type === "regular_season")
      .map((s) => [s.player_id, s.games_played])
  );

  const playerIds = [...new Set(regularSeasonStats.map((s) => s.player_id))];
  const { data: players, error: playersError } =
    playerIds.length > 0
      ? await supabase.from("players").select("*").in("id", playerIds)
      : { data: [], error: null };

  const playerNameById = new Map(
    (players ?? []).map((p) => [p.id, p.full_name_ja ?? p.full_name])
  );

  // Overview のスナップショット用(1試合平均は合計値からその場で計算する)
  const playerSummaries = (players ?? []).map((player) => {
    const statRow = regularSeasonStats.find((s) => s.player_id === player.id);
    const derived = statRow ? deriveStats(toRawStatTotals(statRow)) : null;
    return {
      fullName: player.full_name_ja ?? player.full_name,
      age: ageAt(player.birth_date, AGE_REFERENCE_2025_26),
      ppg: derived?.ppg ?? null,
      rpg: derived?.rpg ?? null,
      apg: derived?.apg ?? null,
    };
  });

  const withStats = playerSummaries.filter((r) => r.ppg !== null);
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

  const agesKnown = playerSummaries.map((r) => r.age).filter((a): a is number => a !== null);
  const avgAge = agesKnown.length
    ? agesKnown.reduce((a, b) => a + b, 0) / agesKnown.length
    : null;

  // Roster: 2025-26にこのチームでプレーした選手のプロフィール一覧(出場試合数の多い順)
  const rosterProfileRows: ProfileRow[] = (players ?? []).map((player) => ({
    id: player.id,
    name: player.full_name_ja ?? player.full_name,
    nameEn: player.full_name,
    position: player.position,
    jerseyNumber: null,
    birthDate: player.birth_date,
    age: ageAt(player.birth_date, AGE_REFERENCE_2025_26),
    heightCm: player.height_cm,
    weightKg: player.weight_kg,
    preDraftTeam: player.pre_draft_team ?? null,
    nationality: player.nationality ?? null,
    yearsOfService: null,
    draftText: formatDraftInfo(player),
    draftSort: draftSortValue(player),
    gamesPlayed: gamesForTeamByPlayer.get(player.id) ?? null,
  }));
  rosterProfileRows.sort(
    (a, b) => (b.gamesPlayed ?? -1) - (a.gamesPlayed ?? -1) || a.name.localeCompare(b.name, "ja")
  );

  const statRows: StatRow[] = resolvedStats.map((s) =>
    toStatRow(s, playerNameById.get(s.player_id) ?? "不明な選手", teamAbbrById)
  );

  return (
    <PageShell teamColor={teamColor}>
      <TeamHeader
        team={team}
        playerCount={playerSummaries.length}
        teamPpg={withStats.length ? teamPpg : null}
        team3pPct={avgThreePct}
      />

      <p className="mt-4 text-sm">
        <Link
          href={`/players/guide/${teamId}`}
          className="font-semibold text-foreground underline underline-offset-4 hover:no-underline"
        >
          選手名鑑 2026（2026-27ロスター・Team Profile）→
        </Link>
      </p>

      <div className="mt-8">
        {playersError ? (
          <p className="text-sm text-red-600 dark:text-red-400">
            在籍選手データの取得に失敗しました: {playersError.message}
          </p>
        ) : (
          <TeamTabs
            initialTab={initialTab}
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
                    2025-26レギュラーシーズンの成績から復元した、このチームの記録です。Rosterは2025-26にこのチームでプレーした選手のプロフィール、Statsは2025-26の選手成績です。年齢は2025年10月1日時点。
                  </p>
                </div>
              </div>
            }
            roster={
              <div className="border border-line bg-surface p-6">
                <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">
                  Roster · 2025-26
                </p>
                <h2 className="mb-1 text-lg font-semibold">Player Roster</h2>
                <p className="mb-4 text-xs text-muted">
                  2025-26レギュラーシーズンにこのチームで出場した選手です（シーズン途中の移籍選手を含む）。出場試合はこのチームでの試合数。POSは現在の登録値、年齢は2025年10月1日時点です。
                </p>
                <TeamRosterProfileTable rows={rosterProfileRows} variant="season" />
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
