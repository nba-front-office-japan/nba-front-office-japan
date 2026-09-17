import { createServerSupabaseClient } from "@/lib/supabase/server";
import { fetchAllRows } from "@/lib/supabase/fetch-all";
import { PageShell } from "@/components/page-shell";
import { StatsTable, type StatRow, type SortKey } from "@/components/stats-table";
import { aggregatePlayerSeasonStats } from "@/lib/stats";
import type { Database } from "@/lib/supabase/types";

type PlayerStatsRow = Database["public"]["Tables"]["player_stats"]["Row"];

const STATS_LAB_SEASON = 2025;

const SORT_KEYS: readonly SortKey[] = [
  "playerName",
  "position",
  "gamesPlayed",
  "mpg",
  "ppg",
  "orbPg",
  "drbPg",
  "rpg",
  "apg",
  "stlPg",
  "blkPg",
  "fgPct",
  "threePct",
  "ftPct",
  "tovPg",
  "pfPg",
  "teamLabel",
];

// 2025-26レギュラーシーズンは選手1人につき1行に合算する（移籍していればチーム別の
// 部分成績を合算し、どれか1チーム行を任意に選ぶ処理はしない）。
function labelForSeasonGroup(
  rows: PlayerStatsRow[],
  teamAbbrById: Map<string, string>
): string {
  const teamRows = rows.filter((r) => r.team_id !== null);
  if (teamRows.length === 0) return "TOT";
  if (teamRows.length === 1) return teamAbbrById.get(teamRows[0].team_id!) ?? "-";
  return `${teamRows.length}TM`;
}

export default async function StatsPage({
  searchParams,
}: PageProps<"/stats">) {
  const params = await searchParams;
  const sortParam = Array.isArray(params.sort) ? params.sort[0] : params.sort;
  const initialSortKey = SORT_KEYS.find((key) => key === sortParam);

  const supabase = createServerSupabaseClient();

  const { data: stats, error } = await fetchAllRows((from, to) =>
    supabase.from("player_stats").select("*").range(from, to)
  );

  if (error) {
    return (
      <PageShell>
        <h1 className="mb-6 text-2xl font-semibold">Stats Lab</h1>
        <p className="text-sm text-red-600 dark:text-red-400">
          スタッツデータの取得に失敗しました: {error.message}
        </p>
      </PageShell>
    );
  }

  // player_statsの選手数はteamsと違って多くなり得るため、.in()でIDを直接渡すと
  // URLが長くなりすぎて失敗することがある（実際に発生した不具合）。
  // players全件を取得してMapで引く方式にする。
  const [
    { data: players, error: playersError },
    { data: teams, error: teamsError },
  ] = await Promise.all([
    fetchAllRows((from, to) =>
      supabase
        .from("players")
        .select("id, full_name, full_name_ja, position")
        .range(from, to)
    ),
    fetchAllRows((from, to) =>
      supabase.from("teams").select("id, abbreviation").range(from, to)
    ),
  ]);

  if (playersError || teamsError) {
    return (
      <PageShell>
        <h1 className="mb-6 text-2xl font-semibold">Stats Lab</h1>
        <p className="text-sm text-red-600 dark:text-red-400">
          選手・チームデータの取得に失敗しました:{" "}
          {playersError?.message ?? teamsError?.message}
        </p>
      </PageShell>
    );
  }

  const playerById = new Map(players.map((p) => [p.id, p]));
  const teamAbbrById = new Map(teams.map((t) => [t.id, t.abbreviation]));

  const isStatsLabRegularSeason = (s: PlayerStatsRow) =>
    s.season === STATS_LAB_SEASON && s.season_type === "regular_season";

  const regularSeasonRowsByPlayer = new Map<string, PlayerStatsRow[]>();
  const otherRows: PlayerStatsRow[] = [];
  for (const s of stats) {
    if (isStatsLabRegularSeason(s)) {
      const list = regularSeasonRowsByPlayer.get(s.player_id) ?? [];
      list.push(s);
      regularSeasonRowsByPlayer.set(s.player_id, list);
    } else {
      otherRows.push(s);
    }
  }

  // 2025-26レギュラーシーズン：選手1人につき1行（移籍していれば合算）。
  const aggregatedRegularSeasonRows: StatRow[] = [...regularSeasonRowsByPlayer.entries()].map(
    ([playerId, rows]) => {
      const player = playerById.get(playerId);
      const totals = aggregatePlayerSeasonStats(rows);
      return {
        id: playerId,
        playerName: player?.full_name_ja ?? player?.full_name ?? "不明な選手",
        position: player?.position ?? null,
        season: STATS_LAB_SEASON,
        teamLabel: labelForSeasonGroup(rows, teamAbbrById),
        seasonType: "regular_season",
        ...totals!,
      };
    }
  );

  // それ以外（プレーオフ・他シーズン）は従来どおり行単位のまま扱う。
  const otherStatRows: StatRow[] = otherRows.map((s) => {
    const player = playerById.get(s.player_id);
    return {
      id: s.id,
      playerName: player?.full_name_ja ?? player?.full_name ?? "不明な選手",
      position: player?.position ?? null,
      season: s.season,
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
  });

  const rows: StatRow[] = [...aggregatedRegularSeasonRows, ...otherStatRows];

  return (
    <PageShell>
      <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">
        Data Explorer · 2025-26 Season
      </p>
      <h1 className="mb-2 text-[36px] font-semibold tracking-tight">
        Stats Lab
      </h1>
      <p className="mb-2 text-sm text-muted">
        収録選手の基本スタッツを、シーズン・ポジション・出場試合数で検索する。
      </p>
      <p className="mb-7 border border-line bg-[#eaf1ff] px-4 py-3 text-xs leading-6 text-[#264c8a] dark:bg-white/[.06]">
        Stats
        Labは2025-26レギュラーシーズン・プレーオフの確定成績のみを対象にしています。2026-27シーズンの成績はまだ収録していません。
      </p>
      <StatsTable rows={rows} initialSortKey={initialSortKey} />
    </PageShell>
  );
}
