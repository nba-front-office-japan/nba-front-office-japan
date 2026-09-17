import { createServerSupabaseClient } from "@/lib/supabase/server";
import { fetchAllRows } from "@/lib/supabase/fetch-all";
import { PageShell } from "@/components/page-shell";
import {
  PlayerDirectoryTable,
  type PlayerDirectoryRow,
} from "@/components/player-directory-table";
import { aggregatePlayerSeasonStats } from "@/lib/stats";
import type { Database } from "@/lib/supabase/types";

type PlayerStatsRow = Database["public"]["Tables"]["player_stats"]["Row"];

const ROSTER_SEASON = 2025;

// 移籍していればチーム別行を合算する。表示は単独チームならその略称、
// 複数チームなら「{n}TM」（Stats Labと同じ表記）。
function labelForSeasonGroup(
  rows: PlayerStatsRow[],
  teamAbbrById: Map<string, string>
): string {
  const teamRows = rows.filter((r) => r.team_id !== null);
  if (teamRows.length === 0) return "TOT";
  if (teamRows.length === 1) return teamAbbrById.get(teamRows[0].team_id!) ?? "-";
  return `${teamRows.length}TM`;
}

export default async function PlayersPage() {
  const supabase = createServerSupabaseClient();

  const { data: stats, error } = await fetchAllRows((from, to) =>
    supabase
      .from("player_stats")
      .select("*")
      .eq("season", ROSTER_SEASON)
      .eq("season_type", "regular_season")
      .range(from, to)
  );

  if (error) {
    return (
      <PageShell>
        <h1 className="mb-6 text-2xl font-semibold">Players</h1>
        <p className="text-sm text-red-600 dark:text-red-400">
          選手データの取得に失敗しました: {error.message}
        </p>
      </PageShell>
    );
  }

  const rowsByPlayer = new Map<string, PlayerStatsRow[]>();
  for (const s of stats) {
    const list = rowsByPlayer.get(s.player_id) ?? [];
    list.push(s);
    rowsByPlayer.set(s.player_id, list);
  }

  const playerIds = [...rowsByPlayer.keys()];

  const [{ data: players, error: playersError }, { data: teams, error: teamsError }] =
    await Promise.all([
      (async () => {
        const all: Database["public"]["Tables"]["players"]["Row"][] = [];
        const chunkSize = 200;
        for (let i = 0; i < playerIds.length; i += chunkSize) {
          const chunk = playerIds.slice(i, i + chunkSize);
          const { data, error: e } = await supabase
            .from("players")
            .select("*")
            .in("id", chunk);
          if (e) return { data: null, error: e };
          all.push(...(data ?? []));
        }
        return { data: all, error: null };
      })(),
      fetchAllRows((from, to) =>
        supabase.from("teams").select("*").order("abbreviation").range(from, to)
      ),
    ]);

  if (playersError || teamsError) {
    return (
      <PageShell>
        <h1 className="mb-6 text-2xl font-semibold">Players</h1>
        <p className="text-sm text-red-600 dark:text-red-400">
          選手・チームデータの取得に失敗しました:{" "}
          {playersError?.message ?? teamsError?.message}
        </p>
      </PageShell>
    );
  }

  const playerById = new Map((players ?? []).map((p) => [p.id, p]));
  const teamAbbrById = new Map((teams ?? []).map((t) => [t.id, t.abbreviation]));

  const directoryRows: PlayerDirectoryRow[] = playerIds.map((playerId) => {
    const rows = rowsByPlayer.get(playerId) ?? [];
    const player = playerById.get(playerId);
    const totals = aggregatePlayerSeasonStats(rows);
    return {
      id: playerId,
      playerName: player?.full_name_ja ?? player?.full_name ?? "不明な選手",
      englishName: player?.full_name ?? "",
      teamLabel: labelForSeasonGroup(rows, teamAbbrById),
      position: player?.position ?? null,
      ...totals!,
    };
  });

  const teamOptions = (teams ?? []).map((t) => t.abbreviation);

  return (
    <PageShell>
      <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">
        Player Database · 2025-26 Season
      </p>
      <h1 className="mb-2 text-[36px] font-semibold tracking-tight">Players</h1>
      <p className="mb-7 text-sm text-muted">
        2025-26レギュラーシーズンに出場実績がある選手を、選手名・チーム・POSITION・最低出場試合数で検索する。
      </p>
      <PlayerDirectoryTable rows={directoryRows} teamOptions={teamOptions} />
    </PageShell>
  );
}
