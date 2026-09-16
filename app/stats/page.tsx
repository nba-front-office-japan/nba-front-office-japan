import { createServerSupabaseClient } from "@/lib/supabase/server";
import { fetchAllRows } from "@/lib/supabase/fetch-all";
import { PageShell } from "@/components/page-shell";
import { StatsTable, type StatRow, type SortKey } from "@/components/stats-table";

const SORT_KEYS: readonly SortKey[] = [
  "playerName",
  "teamLabel",
  "gamesPlayed",
  "ppg",
  "rpg",
  "apg",
  "fgPct",
  "threePct",
  "tsPct",
];

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
        .select("id, full_name, position")
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

  const rows: StatRow[] = stats.map((s) => {
    const player = playerById.get(s.player_id);
    return {
      id: s.id,
      playerName: player?.full_name ?? "不明な選手",
      position: player?.position ?? null,
      season: s.season,
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
    };
  });

  return (
    <PageShell>
      <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">
        Data Explorer · 2026 Season
      </p>
      <h1 className="mb-2 text-[36px] font-semibold tracking-tight">
        Stats Lab
      </h1>
      <p className="mb-7 text-sm text-muted">
        収録選手の基本スタッツを、シーズン・ポジション・出場試合数で検索する。
      </p>
      <StatsTable rows={rows} initialSortKey={initialSortKey} />
    </PageShell>
  );
}
