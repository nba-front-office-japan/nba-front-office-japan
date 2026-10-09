// 選手スタッツ一覧(/stats)の検索条件と、DBからの取得。
// 検索条件の変換(parseStatsQuery・statsQueryToSearch)は、絞り込みの部品(クライアント)からも使う。
// 並べ替え・絞り込み・100件ずつの取得をすべてDB(player_stats_list ビュー)で行い、
// 画面には表示する100件だけを渡す(全件を取得してから画面側で隠すことはしない)。
// 条件はすべてURLの検索パラメータで持つため、再読み込み・共有しても同じページを開ける。

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

type Client = SupabaseClient<Database>;
export type StatsListRow = Database["public"]["Views"]["player_stats_list"]["Row"];

export const STATS_PAGE_SIZE = 100;

/** 並べ替えの列(URLの ?sort= の値 → ビューの列)。ホームの「人気検索」のリンクもこの値を使う */
export const STATS_SORT_COLUMNS = {
  playerName: "player_name",
  teamLabel: "team_label",
  position: "position",
  gamesPlayed: "games_played",
  mpg: "mpg",
  ppg: "ppg",
  orbPg: "orb_pg",
  drbPg: "drb_pg",
  rpg: "rpg",
  apg: "apg",
  stlPg: "stl_pg",
  blkPg: "blk_pg",
  fgPct: "fg_pct",
  threePct: "three_pct",
  ftPct: "ft_pct",
  tsPct: "ts_pct",
  tovPg: "tov_pg",
  pfPg: "pf_pg",
} as const;

export type StatsSortKey = keyof typeof STATS_SORT_COLUMNS;

// 2026-27ロスターのPosに実際に登録されている値(旧データの G/F/C/G-F/F-C 等は使わない)
export const STATS_POSITIONS = ["PG", "SG", "SF", "PF", "C", "G", "F", "GF", "FC"];
export const STATS_MIN_GAMES = [0, 20, 50];

export type StatsQuery = {
  seasonType: "regular_season" | "playoffs";
  /** シーズン(開始年)。null はすべてのシーズン */
  season: number | null;
  position: string | null;
  /** チーム略称(例: BOS)。null はすべてのチーム */
  team: string | null;
  minGames: number;
  sort: StatsSortKey;
  dir: "asc" | "desc";
  page: number;
};

type Params = Record<string, string | string[] | undefined>;

function one(params: Params, key: string): string | undefined {
  const v = params[key];
  return Array.isArray(v) ? v[0] : v;
}

/** URLの検索パラメータを検索条件にする(不正な値は既定値に戻す)。season の既定値は最新シーズン */
export function parseStatsQuery(params: Params, latestSeason: number | null): StatsQuery {
  const sortParam = one(params, "sort");
  const sort = (sortParam && sortParam in STATS_SORT_COLUMNS ? sortParam : "ppg") as StatsSortKey;
  const seasonParam = one(params, "season");
  const minGames = Number(one(params, "minGames"));
  const page = Number(one(params, "page"));
  const position = one(params, "pos");
  const team = one(params, "team");
  return {
    seasonType: one(params, "type") === "playoffs" ? "playoffs" : "regular_season",
    season: seasonParam === "all" ? null : /^\d{4}$/.test(seasonParam ?? "") ? Number(seasonParam) : latestSeason,
    position: position && STATS_POSITIONS.includes(position) ? position : null,
    team: team && /^[A-Z]{2,3}$/.test(team) ? team : null,
    minGames: STATS_MIN_GAMES.includes(minGames) ? minGames : 0,
    sort,
    // 名前・チーム・ポジションの既定は昇順、数値の列の既定は降順
    dir: one(params, "dir") === "asc" || (one(params, "dir") !== "desc" && ["playerName", "teamLabel", "position"].includes(sort)) ? "asc" : "desc",
    page: Number.isInteger(page) && page >= 1 ? page : 1,
  };
}

/** 検索条件をURLの検索パラメータにする(既定値は省き、URLを短くする) */
export function statsQueryToSearch(q: StatsQuery, latestSeason: number | null, overrides: Partial<StatsQuery> = {}): string {
  const v = { ...q, ...overrides };
  const sp = new URLSearchParams();
  if (v.seasonType === "playoffs") sp.set("type", "playoffs");
  if (v.season === null) sp.set("season", "all");
  else if (v.season !== latestSeason) sp.set("season", String(v.season));
  if (v.position) sp.set("pos", v.position);
  if (v.team) sp.set("team", v.team);
  if (v.minGames) sp.set("minGames", String(v.minGames));
  if (v.sort !== "ppg") sp.set("sort", v.sort);
  const defaultDir = ["playerName", "teamLabel", "position"].includes(v.sort) ? "asc" : "desc";
  if (v.dir !== defaultDir) sp.set("dir", v.dir);
  if (v.page > 1) sp.set("page", String(v.page));
  const s = sp.toString();
  return s ? `?${s}` : "";
}

/** 選べるシーズン(新しい順)。種別ごと */
export async function fetchStatsSeasons(supabase: Client): Promise<{ regular_season: number[]; playoffs: number[] }> {
  const { data, error } = await supabase.from("player_stats_list_seasons").select("season, season_type");
  if (error) throw new Error(`シーズンの取得に失敗しました: ${error.message}`);
  const pick = (t: string) => [...new Set((data ?? []).filter((r) => r.season_type === t).map((r) => r.season))].sort((a, b) => b - a);
  return { regular_season: pick("regular_season"), playoffs: pick("playoffs") };
}

export type StatsPage = { rows: StatsListRow[]; total: number; page: number; lastPage: number; from: number };

/** 検索条件に合う行を、指定したページの100件だけDBから取得する */
export async function fetchStatsPage(supabase: Client, q: StatsQuery, teamId: string | null): Promise<StatsPage> {
  const filtered = (select: string, options: { count: "exact"; head?: boolean }) => {
    let query = supabase.from("player_stats_list").select(select, options).eq("season_type", q.seasonType);
    if (q.season !== null) query = query.eq("season", q.season);
    if (q.position) query = query.eq("position", q.position);
    if (teamId) query = query.contains("team_ids", [teamId]);
    if (q.minGames > 0) query = query.gte("games_played", q.minGames);
    return query;
  };
  const run = (page: number) => {
    const from = (page - 1) * STATS_PAGE_SIZE;
    return filtered("*", { count: "exact" })
      .order(STATS_SORT_COLUMNS[q.sort], { ascending: q.dir === "asc", nullsFirst: false })
      // 同じ値のときの並びを毎回同じにする(ページをまたいで重複・欠落しないように)
      .order("player_name", { ascending: true })
      .order("id", { ascending: true })
      .range(from, from + STATS_PAGE_SIZE - 1)
      .overrideTypes<StatsListRow[], { merge: false }>();
  };

  let page = q.page;
  let { data, count, error } = await run(page);
  // 範囲外のページ(条件を変えて件数が減った共有URLなど)は、件数だけを取り直して最後のページを表示する
  if (error && (error.code === "PGRST103" || /range not satisfiable/i.test(error.message))) {
    const head = await filtered("id", { count: "exact", head: true });
    if (head.error) throw new Error(`スタッツの取得に失敗しました: ${head.error.message}`);
    page = Math.max(1, Math.ceil((head.count ?? 0) / STATS_PAGE_SIZE));
    ({ data, count, error } = await run(page));
  }
  if (error) throw new Error(`スタッツの取得に失敗しました: ${error.message}`);
  const total = count ?? 0;
  const lastPage = Math.max(1, Math.ceil(total / STATS_PAGE_SIZE));
  return { rows: data ?? [], total, page, lastPage, from: (page - 1) * STATS_PAGE_SIZE };
}
