// 選手スタッツ一覧(/stats)の今季(2026-27)分: 管理画面から取り込んだ試合のボックススコア(box_score_*)から、
// 全選手のレギュラーシーズン累計を集計し、一覧(player_stats_list ビュー)と同じ形の行にする。
// ・試合の判定(レギュラーシーズンだけ・同じ試合の重複は最後に取り込んだ方)は Teams の 2026-27 Stats・選手ページの今季成績と同じ
// ・シーズン中に移籍した選手は1行(全チームの合計。チーム欄は「2チーム合計」など)
// ・規定試合数: 所属チーム(最後に出場したチーム)の試合数の70%以上に出場(NBA公式のリーダーと同じ考え方)
// ・集計結果は保存しない。全選手分の集計は5分間使い回す(取り込み後、最大5分で一覧に反映される)
// 絞り込み・並べ替え・100人ずつの切り出しは、集計した行に対してここで行う(1シーズン分で最大600人程度のため)。
import "server-only";
import { unstable_cache } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import { fetchAllRows } from "@/lib/supabase/fetch-all";
import { addGame, classifyGame, matchupKey, ZERO } from "@/lib/team-box-score-stats";
import type { RawStatTotals } from "@/lib/stats";
import { STATS_PAGE_SIZE, STATS_SORT_COLUMNS, type StatsListRow, type StatsPage, type StatsQuery } from "@/lib/stats-list";

type BoxGameRow = Database["public"]["Tables"]["box_score_games"]["Row"];
type BoxPlayerRow = Database["public"]["Tables"]["box_score_players"]["Row"];

// 規定試合数の割合(チームの試合数に対して)
const QUALIFY_RATIO = 0.7;
// .in() に一度に渡すIDの数(URLが長くなりすぎないように)
const IN_CHUNK = 100;

export type CurrentSeasonStatsRow = StatsListRow & {
  // 規定試合数に達しているか
  qualified: boolean;
};

export type CurrentSeasonStats = {
  rows: CurrentSeasonStatsRow[];
  // 集計した最後の試合日(米国の日付、YYYY-MM-DD)。試合が無ければ null
  lastGameDate: string | null;
};

function chunk<T>(items: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(items.length / size) }, (_, i) => items.slice(i * size, (i + 1) * size));
}

async function loadCurrentSeasonStats(season: number): Promise<CurrentSeasonStats> {
  const supabase = createServerSupabaseClient();
  const [boxGamesRes, scheduledRes] = await Promise.all([
    fetchAllRows<BoxGameRow>((from, to) =>
      supabase
        .from("box_score_games")
        .select("*")
        .gte("game_date", `${season}-08-01`)
        .lt("game_date", `${season + 1}-08-01`)
        .order("id")
        .range(from, to)
    ),
    fetchAllRows<{ game_date: string; home_team_id: string; away_team_id: string }>((from, to) =>
      supabase
        .from("games")
        .select("game_date, home_team_id, away_team_id")
        .eq("season", season)
        .eq("postseason", false)
        .order("id")
        .range(from, to)
    ),
  ]);
  if (boxGamesRes.error) throw new Error(`今季の試合の取得に失敗しました: ${boxGamesRes.error.message}`);
  const scheduledRegular = new Set(scheduledRes.data.map((g) => matchupKey(g.game_date, g.home_team_id, g.away_team_id)));

  // 同じ日付・同じ対戦は1試合として数える(最後に取り込んだ方を使う)
  const regularByMatchup = new Map<string, BoxGameRow>();
  for (const game of boxGamesRes.data) {
    if (classifyGame(game, season, scheduledRegular) !== "regular") continue;
    const key = matchupKey(game.game_date, game.home_team_id, game.away_team_id);
    const existing = regularByMatchup.get(key);
    if (!existing || game.last_imported_at > existing.last_imported_at) regularByMatchup.set(key, game);
  }
  const counted = new Map([...regularByMatchup.values()].map((g) => [g.id, g]));
  if (counted.size === 0) return { rows: [], lastGameDate: null };

  // チームごとの試合数(規定試合数の基準)
  const teamGames = new Map<string, number>();
  let lastGameDate: string | null = null;
  for (const g of counted.values()) {
    teamGames.set(g.home_team_id, (teamGames.get(g.home_team_id) ?? 0) + 1);
    teamGames.set(g.away_team_id, (teamGames.get(g.away_team_id) ?? 0) + 1);
    if (lastGameDate === null || g.game_date > lastGameDate) lastGameDate = g.game_date;
  }

  const playerParts = await Promise.all(
    chunk([...counted.keys()], IN_CHUNK).map(async (ids) => {
      const { data, error } = await fetchAllRows<BoxPlayerRow>((from, to) =>
        supabase.from("box_score_players").select("*").in("game_id", ids).neq("role", "dnp").order("id").range(from, to)
      );
      if (error) throw new Error(`今季の個人成績の取得に失敗しました: ${error.message}`);
      return data;
    })
  );

  type Acc = { totals: RawStatTotals; byTeam: Map<string, number>; lastTeam: string; lastDate: string };
  const byPlayer = new Map<string, Acc>();
  for (const row of playerParts.flat()) {
    const game = counted.get(row.game_id);
    // 選手データと照合できなかった行は一覧に出せないため除く(チームの 2026-27 Stats と同じ)
    if (!game || !row.player_id) continue;
    const acc = byPlayer.get(row.player_id) ?? { totals: ZERO, byTeam: new Map(), lastTeam: row.team_id, lastDate: "" };
    acc.totals = addGame(acc.totals, row);
    acc.byTeam.set(row.team_id, (acc.byTeam.get(row.team_id) ?? 0) + 1);
    if (game.game_date >= acc.lastDate) {
      acc.lastDate = game.game_date;
      acc.lastTeam = row.team_id;
    }
    byPlayer.set(row.player_id, acc);
  }
  const playerIds = [...byPlayer.keys()];

  const [players, rosters, teamsRes] = await Promise.all([
    Promise.all(
      chunk(playerIds, IN_CHUNK).map(async (ids) => {
        const { data, error } = await supabase.from("players").select("id, full_name, full_name_ja").in("id", ids);
        if (error) throw new Error(`選手の取得に失敗しました: ${error.message}`);
        return data ?? [];
      })
    ),
    // ポジションは一覧(player_stats_list)と同じく、最新シーズンのロスターの値
    Promise.all(
      chunk(playerIds, IN_CHUNK).map(async (ids) => {
        const { data, error } = await supabase
          .from("player_season_rosters")
          .select("player_id, position, season")
          .in("player_id", ids)
          .order("season", { ascending: false });
        if (error) throw new Error(`ロスターの取得に失敗しました: ${error.message}`);
        return data ?? [];
      })
    ),
    supabase.from("teams").select("id, abbreviation"),
  ]);
  const nameById = new Map(players.flat().map((p) => [p.id, p.full_name_ja ?? p.full_name]));
  const rosterRows = rosters.flat();
  const latestRosterSeason = rosterRows.reduce((max, r) => Math.max(max, r.season), 0);
  const positionById = new Map<string, string | null>();
  for (const r of rosterRows) {
    if (r.season === latestRosterSeason && !positionById.has(r.player_id)) positionById.set(r.player_id, r.position);
  }
  const abbrById = new Map((teamsRes.data ?? []).map((t) => [t.id, t.abbreviation]));

  const per = (v: number, g: number) => (g > 0 ? v / g : null);
  const pct = (m: number, a: number) => (a > 0 ? (m * 100) / a : null);
  const rows: CurrentSeasonStatsRow[] = [];
  for (const [playerId, acc] of byPlayer) {
    const name = nameById.get(playerId);
    if (!name) continue;
    const t = acc.totals;
    const g = t.gamesPlayed;
    const teamIds = [...acc.byTeam.keys()].sort();
    const tsa = 2 * (t.fieldGoalsAttempted + 0.44 * t.freeThrowsAttempted);
    rows.push({
      id: `${playerId}:${season}:regular_season`,
      player_id: playerId,
      season,
      season_type: "regular_season",
      player_name: name,
      position: positionById.get(playerId) ?? null,
      team_count: teamIds.length,
      has_total_row: false,
      team_ids: teamIds,
      team_label: teamIds.length === 1 ? (abbrById.get(teamIds[0]) ?? "-") : `${teamIds.length}チーム合計`,
      games_played: g,
      minutes_played: t.minutesPlayed,
      points: t.points,
      rebounds_offensive: t.reboundsOffensive,
      rebounds_defensive: t.reboundsDefensive,
      rebounds_total: t.reboundsTotal,
      assists: t.assists,
      steals: t.steals,
      blocks: t.blocks,
      turnovers: t.turnovers,
      personal_fouls: t.personalFouls,
      field_goals_made: t.fieldGoalsMade,
      field_goals_attempted: t.fieldGoalsAttempted,
      three_pointers_made: t.threePointersMade,
      three_pointers_attempted: t.threePointersAttempted,
      free_throws_made: t.freeThrowsMade,
      free_throws_attempted: t.freeThrowsAttempted,
      mpg: per(t.minutesPlayed, g),
      ppg: per(t.points, g),
      orb_pg: per(t.reboundsOffensive, g),
      drb_pg: per(t.reboundsDefensive, g),
      rpg: per(t.reboundsTotal, g),
      apg: per(t.assists, g),
      stl_pg: per(t.steals, g),
      blk_pg: per(t.blocks, g),
      tov_pg: per(t.turnovers, g),
      pf_pg: per(t.personalFouls, g),
      fg_pct: pct(t.fieldGoalsMade, t.fieldGoalsAttempted),
      three_pct: pct(t.threePointersMade, t.threePointersAttempted),
      ft_pct: pct(t.freeThrowsMade, t.freeThrowsAttempted),
      ts_pct: tsa > 0 ? (t.points * 100) / tsa : null,
      qualified: g >= Math.ceil((teamGames.get(acc.lastTeam) ?? 0) * QUALIFY_RATIO),
    });
  }
  return { rows, lastGameDate };
}

/** 今季の全選手の集計(5分間使い回す) */
export const fetchCurrentSeasonStats = unstable_cache(loadCurrentSeasonStats, ["current-season-stats-list"], { revalidate: 300 });

/** 一覧の検索条件で、今季の行を絞り込み・並べ替えて、指定したページの100件を返す */
export function currentSeasonStatsPage(
  all: CurrentSeasonStatsRow[],
  q: StatsQuery,
  teamId: string | null,
  // 英語名で一致した、日本語名で表示している選手のID(fetchEnglishNameMatchIds)
  nameMatchIds: string[] = []
): StatsPage {
  const term = q.q?.toLowerCase() ?? null;
  const englishMatch = new Set(nameMatchIds);
  const filtered = all.filter(
    (r) =>
      (!q.position || r.position === q.position) &&
      (!teamId || r.team_ids.includes(teamId)) &&
      (q.minGames === "qualified" ? r.qualified : r.games_played >= q.minGames) &&
      (!term || r.player_name.toLowerCase().includes(term) || englishMatch.has(r.player_id))
  );

  const column = STATS_SORT_COLUMNS[q.sort];
  const sign = q.dir === "asc" ? 1 : -1;
  filtered.sort((a, b) => {
    const va = a[column];
    const vb = b[column];
    // 値が無い行(試投0のFG%など)は向きにかかわらず末尾(DBの nullsFirst: false と同じ)
    if (va !== vb) {
      if (va === null) return 1;
      if (vb === null) return -1;
      const diff = typeof va === "number" && typeof vb === "number" ? va - vb : String(va).localeCompare(String(vb), "ja");
      if (diff !== 0) return diff * sign;
    }
    return a.player_name.localeCompare(b.player_name, "ja") || a.id.localeCompare(b.id);
  });

  const total = filtered.length;
  const lastPage = Math.max(1, Math.ceil(total / STATS_PAGE_SIZE));
  const page = Math.min(q.page, lastPage);
  const from = (page - 1) * STATS_PAGE_SIZE;
  return { rows: filtered.slice(from, from + STATS_PAGE_SIZE), total, page, lastPage, from };
}
