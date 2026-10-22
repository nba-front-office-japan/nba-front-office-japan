// Teams(/teams/[teamId])と選手名鑑(/players/guide/[teamId])で、シーズンごとのチームの選手一覧を読む。
// ・固定スナップショット(roster_snapshots)があるシーズン: その時点のロスターとプロフィールをスナップショットの値で表示する
// ・成績(player_stats)があるシーズン: そのシーズンにこのチームでプレーした選手を成績から復元する
// どちらもない場合は空(画面側で「未登録」「準備中」と表示する)。
import type { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import type { ProfileRow } from "@/components/team-roster-profile-table";
import type { TeamStatsRow } from "@/components/team-roster-stats-table";
import { aggregatePlayerSeasonStats, deriveStats } from "@/lib/stats";
import { formatDraftInfo, draftSortValue } from "@/lib/draft-format";
import { ageAt, todayInJapan, type AgeReference } from "@/lib/age";

type ServerClient = ReturnType<typeof createServerSupabaseClient>;
type PlayerRow = Database["public"]["Tables"]["players"]["Row"];
type PlayerStatsRow = Database["public"]["Tables"]["player_stats"]["Row"];
type SnapshotRow = Database["public"]["Tables"]["roster_snapshots"]["Row"];

export interface TeamSnapshotRoster {
  snapshot: Pick<SnapshotRow, "id" | "season" | "as_of" | "source_name" | "source_note">;
  rows: ProfileRow[];
  twoWayCount: number;
  rookieCount: number;
  averageAge: number | null;
}

// そのシーズンの最新のスナップショットから、このチームの選手を読む。スナップショットが無いシーズンは null。
// 身長・体重・生年月日・ポジション・経験年数・出身校・背番号はスナップショットの値(元ファイルの値)をそのまま使う。
// 日本語名・国籍・ドラフト情報はスナップショットに無いため、選手データ(players)の値を使う。
export async function fetchTeamSnapshotRoster(
  supabase: ServerClient,
  teamId: string,
  season: number
): Promise<TeamSnapshotRoster | null> {
  const { data: snapshot } = await supabase
    .from("roster_snapshots")
    .select("id, season, as_of, source_name, source_note")
    .eq("season", season)
    .order("as_of", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!snapshot) return null;

  const { data: snapshotPlayers } = await supabase
    .from("roster_snapshot_players")
    .select("*")
    .eq("snapshot_id", snapshot.id)
    .eq("team_id", teamId);
  const entries = snapshotPlayers ?? [];

  const playerIds = entries.map((e) => e.player_id);
  const { data: players } =
    playerIds.length > 0
      ? await supabase.from("players").select("*").in("id", playerIds)
      : { data: [] as PlayerRow[] };
  const playerById = new Map((players ?? []).map((p) => [p.id, p]));

  // 年齢は表示した日(日本時間)時点で生年月日から計算する(選手名鑑のこれまでの表示と同じ)
  const today = todayInJapan();
  const rows: ProfileRow[] = entries.map((entry) => {
    const player = playerById.get(entry.player_id);
    const nameEn = player?.full_name ?? entry.source_player_name.replace(/\s*\(TW\)$/, "");
    return {
      id: entry.player_id,
      name: player?.full_name_ja ?? nameEn,
      nameEn,
      position: entry.position,
      jerseyNumber: entry.jersey_number,
      birthDate: entry.birth_date,
      age: ageAt(entry.birth_date, today),
      heightCm: entry.height_cm,
      weightKg: entry.weight_kg === null ? null : Number(entry.weight_kg),
      preDraftTeam: entry.college,
      nationality: player?.nationality ?? null,
      yearsOfService: entry.years_of_service,
      draftText: player ? formatDraftInfo(player) : null,
      draftSort: player ? draftSortValue(player) : null,
      twoWay: entry.two_way,
    };
  });
  rows.sort((a, b) => a.name.localeCompare(b.name, "ja"));

  const ages = rows.map((r) => r.age).filter((a): a is number => a !== null);
  return {
    snapshot,
    rows,
    twoWayCount: entries.filter((e) => e.two_way).length,
    rookieCount: entries.filter((e) => e.years_of_service === 0).length,
    averageAge: ages.length ? ages.reduce((a, b) => a + b, 0) / ages.length : null,
  };
}

// 移籍があった選手は、このチーム在籍分の行(team_id一致)を優先し、
// 無ければTOT行(team_id=NULL)にフォールバックする。
function resolveTeamStatsRows(stats: PlayerStatsRow[], teamId: string): PlayerStatsRow[] {
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

export interface TeamStatsSeasonRecord {
  // このチーム在籍分を優先した、選手 × 種別(レギュラー/プレーオフ)ごとの成績
  resolvedStats: PlayerStatsRow[];
  regularSeasonStats: PlayerStatsRow[];
  // そのチームでのレギュラーシーズン出場試合数(チーム別行のみ。TOT行は使わない)
  gamesForTeamByPlayer: Map<string, number>;
  players: PlayerRow[];
  playersError: string | null;
}

// そのシーズンにこのチームでプレーした選手と成績を、成績(player_stats)から復元する。
// このチームの在籍歴は「team_id一致の行がある選手」で判定する(途中移籍した選手も含む)。
// 成績がまだ登録されていないシーズンは、すべて空で返す。
export async function fetchTeamStatsSeasonRecord(
  supabase: ServerClient,
  teamId: string,
  season: number
): Promise<TeamStatsSeasonRecord> {
  const { data: teamRows } = await supabase
    .from("player_stats")
    .select("player_id")
    .eq("season", season)
    .eq("team_id", teamId);
  const playerIds = [...new Set((teamRows ?? []).map((r) => r.player_id))];
  if (playerIds.length === 0) {
    return { resolvedStats: [], regularSeasonStats: [], gamesForTeamByPlayer: new Map(), players: [], playersError: null };
  }

  const { data: relevantStats } = await supabase
    .from("player_stats")
    .select("*")
    .eq("season", season)
    .in("player_id", playerIds);
  const resolvedStats = resolveTeamStatsRows(relevantStats ?? [], teamId);
  const regularSeasonStats = resolvedStats.filter((s) => s.season_type === "regular_season");
  const gamesForTeamByPlayer = new Map(
    (relevantStats ?? [])
      .filter((s) => s.team_id === teamId && s.season_type === "regular_season")
      .map((s) => [s.player_id, s.games_played])
  );

  const regularPlayerIds = [...new Set(regularSeasonStats.map((s) => s.player_id))];
  const { data: players, error } =
    regularPlayerIds.length > 0
      ? await supabase.from("players").select("*").in("id", regularPlayerIds)
      : { data: [] as PlayerRow[], error: null };

  return {
    resolvedStats,
    regularSeasonStats,
    gamesForTeamByPlayer,
    players: players ?? [],
    playersError: error?.message ?? null,
  };
}

// 成績から復元した選手のプロフィール一覧(出場試合数の多い順)。
// 当時の背番号・経験年数はDBに無いため出さず、そのチームでの出場試合数を出す。
export function buildSeasonProfileRows(record: TeamStatsSeasonRecord, ageReference: AgeReference): ProfileRow[] {
  const rows: ProfileRow[] = record.players.map((player) => ({
    id: player.id,
    name: player.full_name_ja ?? player.full_name,
    nameEn: player.full_name,
    position: player.position,
    jerseyNumber: null,
    birthDate: player.birth_date,
    age: ageAt(player.birth_date, ageReference),
    heightCm: player.height_cm,
    weightKg: player.weight_kg,
    preDraftTeam: player.pre_draft_team ?? null,
    nationality: player.nationality ?? null,
    yearsOfService: null,
    draftText: formatDraftInfo(player),
    draftSort: draftSortValue(player),
    gamesPlayed: record.gamesForTeamByPlayer.get(player.id) ?? null,
  }));
  rows.sort((a, b) => (b.gamesPlayed ?? -1) - (a.gamesPlayed ?? -1) || a.name.localeCompare(b.name, "ja"));
  return rows;
}

// 選手名鑑の Stats: ロスターの選手ごとの、そのシーズン(前のシーズン)のレギュラーシーズン最終成績。
// 移籍した選手は TOT 行(シーズン合計)を優先し、無ければチーム別の行を合算する(lib/stats.ts の aggregatePlayerSeasonStats)。
// チーム欄はそのシーズンの所属チーム(複数なら「LAL/DAL」)。成績がない選手もロスターから外さず、末尾にまとめる(PTS 降順)。
export async function fetchPriorSeasonStatsRows(
  supabase: ServerClient,
  rosterRows: Pick<ProfileRow, "id" | "name" | "position">[],
  season: number
): Promise<TeamStatsRow[]> {
  const playerIds = rosterRows.map((r) => r.id);
  const [{ data: stats }, { data: teams }] = await Promise.all([
    playerIds.length > 0
      ? supabase.from("player_stats").select("*").eq("season", season).eq("season_type", "regular_season").in("player_id", playerIds)
      : Promise.resolve({ data: [] as PlayerStatsRow[] }),
    supabase.from("teams").select("id, abbreviation"),
  ]);
  const abbrById = new Map((teams ?? []).map((t) => [t.id, t.abbreviation]));
  const statsByPlayer = new Map<string, PlayerStatsRow[]>();
  for (const row of stats ?? []) {
    const list = statsByPlayer.get(row.player_id) ?? [];
    list.push(row);
    statsByPlayer.set(row.player_id, list);
  }

  const rows: TeamStatsRow[] = rosterRows.map((r) => {
    const list = statsByPlayer.get(r.id) ?? [];
    const totals = aggregatePlayerSeasonStats(list);
    const teamAbbrs = [...new Set(list.flatMap((s) => (s.team_id ? [abbrById.get(s.team_id) ?? "—"] : [])))];
    return {
      id: r.id,
      name: r.name,
      teamAbbr: teamAbbrs.length > 0 ? teamAbbrs.join("/") : "—",
      position: r.position,
      gamesPlayed: totals?.gamesPlayed ?? null,
      stats: totals ? deriveStats(totals) : null,
    };
  });
  rows.sort((a, b) => {
    if ((a.stats !== null) !== (b.stats !== null)) return a.stats ? -1 : 1;
    if (a.stats && b.stats) return (b.stats.ppg ?? 0) - (a.stats.ppg ?? 0);
    return a.name.localeCompare(b.name, "ja");
  });
  return rows;
}

// 「2026年10月21日」
export function formatJapaneseDate(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return `${y}年${m}月${d}日`;
}
