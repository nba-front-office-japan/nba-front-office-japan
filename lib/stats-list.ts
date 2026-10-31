// 選手スタッツ一覧(/stats)の検索条件と、DBからの取得。
// 検索条件の変換(parseStatsQuery・statsQueryToSearch)は、絞り込みの部品(クライアント)からも使う。
// 並べ替え・絞り込み・100件ずつの取得をすべてDB(player_stats_list ビュー)で行い、
// 画面には表示する100件だけを渡す(全件を取得してから画面側で隠すことはしない)。
// 条件はすべてURLの検索パラメータで持つため、再読み込み・共有しても同じページを開ける。

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { ROSTER_SEASON } from "@/lib/seasons";

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

// 試合のボックススコアから集計して一覧に出す今季(lib/current-season-stats-list.ts)。それより前は player_stats(DB のビュー)
export const CURRENT_STATS_SEASON = ROSTER_SEASON;

/** 最低試合数。"qualified" は規定試合数(所属チームの試合数の70%以上。今季のレギュラーシーズンだけ選べる) */
export type StatsMinGames = number | "qualified";

/** 今季のレギュラーシーズンか(ボックススコアから集計する一覧か) */
export function isCurrentStatsSeason(season: number | null, seasonType: StatsQuery["seasonType"]): boolean {
  return season === CURRENT_STATS_SEASON && seasonType === "regular_season";
}

/** 最低試合数の既定値。どのシーズンも All(全選手)。規定試合数は絞り込みで選べる */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function defaultMinGames(season: number | null, seasonType: StatsQuery["seasonType"]): StatsMinGames {
  return 0;
}

/** NBA何年目かの絞り込み(1=ルーキー〜4=4年目)。今季のレギュラーシーズンだけ選べる */
export const STATS_EXPERIENCE_OPTIONS = [1, 2, 3, 4] as const;

export function experienceLabel(year: number): string {
  return year === 1 ? "ルーキー" : `${year}年目`;
}

/** 絞り込みで選べる最低試合数 */
export function minGamesOptions(season: number | null, seasonType: StatsQuery["seasonType"]): StatsMinGames[] {
  return isCurrentStatsSeason(season, seasonType) ? [0, "qualified"] : STATS_MIN_GAMES;
}

export type StatsQuery = {
  seasonType: "regular_season" | "playoffs";
  /** シーズン(開始年)。null はすべてのシーズン */
  season: number | null;
  position: string | null;
  /** チーム略称(例: BOS)。null はすべてのチーム */
  team: string | null;
  minGames: StatsMinGames;
  /** NBA何年目か(1=ルーキー)。null はすべて。今季のレギュラーシーズンだけ有効 */
  experience: number | null;
  /** 選手名の検索語(日本語名・英語名の部分一致)。null は検索なし */
  q: string | null;
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
  const minGamesParam = one(params, "minGames");
  const page = Number(one(params, "page"));
  const position = one(params, "pos");
  const team = one(params, "team");
  const q = normalizeSearchTerm(one(params, "q"));
  const seasonType = one(params, "type") === "playoffs" ? "playoffs" : "regular_season";
  const season = seasonParam === "all" ? null : /^\d{4}$/.test(seasonParam ?? "") ? Number(seasonParam) : latestSeason;
  // URL の値(規定試合数は "q")がそのシーズンで選べなければ既定値にする
  const minGamesValue: StatsMinGames | null = minGamesParam === "q" ? "qualified" : /^\d+$/.test(minGamesParam ?? "") ? Number(minGamesParam) : null;
  const options = minGamesOptions(season, seasonType);
  const expParam = Number(one(params, "exp"));
  const experience =
    isCurrentStatsSeason(season, seasonType) && (STATS_EXPERIENCE_OPTIONS as readonly number[]).includes(expParam) ? expParam : null;
  return {
    seasonType,
    season,
    position: position && STATS_POSITIONS.includes(position) ? position : null,
    team: team && /^[A-Z]{2,3}$/.test(team) ? team : null,
    minGames: minGamesValue !== null && options.includes(minGamesValue) ? minGamesValue : defaultMinGames(season, seasonType),
    experience,
    q,
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
  if (v.minGames !== defaultMinGames(v.season, v.seasonType)) sp.set("minGames", v.minGames === "qualified" ? "q" : String(v.minGames));
  if (v.experience !== null && isCurrentStatsSeason(v.season, v.seasonType)) sp.set("exp", String(v.experience));
  if (v.q) sp.set("q", v.q);
  if (v.sort !== "ppg") sp.set("sort", v.sort);
  const defaultDir = ["playerName", "teamLabel", "position"].includes(v.sort) ? "asc" : "desc";
  if (v.dir !== defaultDir) sp.set("dir", v.dir);
  if (v.page > 1) sp.set("page", String(v.page));
  const s = sp.toString();
  return s ? `?${s}` : "";
}

/**
 * 選手名の検索語を整える。前後の空白を除き、DBの検索条件の区切りに使われる記号(, ( ) * % \ " :)は空白にする。
 * 空なら null。長すぎる語は 40 文字までにする
 */
export function normalizeSearchTerm(raw: string | null | undefined): string | null {
  const term = (raw ?? "").replace(/[,()*%\\":]/g, " ").replace(/\s+/g, " ").trim().slice(0, 40);
  return term === "" ? null : term;
}

/**
 * 選手名の検索で、英語名が一致する「日本語名で表示している選手」のIDを、上限なしですべて探す。
 * 一覧(player_stats_list)の選手名は「日本語名、なければ英語名」のため、日本語名がある選手の英語名はここで補う
 * (日本語名がない選手は、一覧の選手名=英語名の部分一致で見つかる)。日本語名がある選手は数百人のため、1〜数回で取り終わる
 */
export async function fetchEnglishNameMatchIds(supabase: Client, q: string): Promise<string[]> {
  const ids: string[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from("players")
      .select("id")
      .not("full_name_ja", "is", null)
      .ilike("full_name", `%${q}%`)
      .order("id")
      .range(from, from + 999);
    if (error) throw new Error(`選手名の検索に失敗しました: ${error.message}`);
    ids.push(...(data ?? []).map((p) => p.id));
    if (!data || data.length < 1000) return ids;
  }
}

/** 選べるシーズン(新しい順)。種別ごと */
export async function fetchStatsSeasons(supabase: Client): Promise<{ regular_season: number[]; playoffs: number[] }> {
  const { data, error } = await supabase.from("player_stats_list_seasons").select("season, season_type");
  if (error) throw new Error(`シーズンの取得に失敗しました: ${error.message}`);
  const pick = (t: string) => [...new Set((data ?? []).filter((r) => r.season_type === t).map((r) => r.season))].sort((a, b) => b - a);
  return { regular_season: pick("regular_season"), playoffs: pick("playoffs") };
}

export type StatsPage = { rows: StatsListRow[]; total: number; page: number; lastPage: number; from: number };

// DB から1回に取れる行数の上限
const MAX_ROWS_PER_REQUEST = 1000;

type SelectOptions = { count: "exact"; head?: boolean };
function selectList(supabase: Client, select: string, options?: SelectOptions) {
  return supabase.from("player_stats_list").select(select, options);
}
type ListQuery = ReturnType<typeof selectList>;

/**
 * 検索条件に合う行を、指定したページの100件だけ取得する。
 * 選手名の検索があるときは fetchNameSearchPage(人数の上限なし・短い検索語でも取りこぼさない)。
 */
export async function fetchStatsPage(
  supabase: Client,
  q: StatsQuery,
  teamId: string | null,
  // 英語名で一致した、日本語名で表示している選手のID(fetchEnglishNameMatchIds)
  nameMatchIds: string[] = []
): Promise<StatsPage> {
  const filtered = (select: string, options?: SelectOptions) => {
    let query = selectList(supabase, select, options).eq("season_type", q.seasonType);
    if (q.season !== null) query = query.eq("season", q.season);
    if (q.position) query = query.eq("position", q.position);
    if (teamId) query = query.contains("team_ids", [teamId]);
    if (typeof q.minGames === "number" && q.minGames > 0) query = query.gte("games_played", q.minGames);
    return query;
  };
  const ordered = <T extends ListQuery>(query: T) =>
    query
      .order(STATS_SORT_COLUMNS[q.sort], { ascending: q.dir === "asc", nullsFirst: false })
      // 同じ値のときの並びを毎回同じにする(ページをまたいで重複・欠落しないように)
      .order("player_name", { ascending: true })
      .order("id", { ascending: true });

  if (q.q) return fetchNameSearchPage(supabase, q, filtered, ordered, nameMatchIds);
  return fetchSinglePage(filtered, ordered, q.page);
}

/**
 * 選手名の検索。一覧の選手名は「日本語名、なければ英語名」のため、
 * 「表示名に検索語を含む」または「英語名が一致した日本語名の選手(nameMatchIds)」の行を対象にする。
 * 名前以外の条件(種別・シーズン・チーム・ポジション・最低試合数)に合う行を、並べ替えに使う列だけ DB の並び順で取り、
 * 名前の判定はここで行う(DB で名前の部分一致をすると、1文字の検索語×全シーズンで DB の時間制限を超えるため)。
 * そのあと表示するページの100件だけ、全部の列を取り直す。人数の上限はなく、取りこぼさない。
 */
async function fetchNameSearchPage(
  supabase: Client,
  q: StatsQuery,
  filtered: (select: string, options?: SelectOptions) => ListQuery,
  ordered: <T extends ListQuery>(query: T) => T,
  nameMatchIds: string[]
): Promise<StatsPage> {
  const term = (q.q ?? "").toLowerCase();
  const englishMatch = new Set(nameMatchIds);
  const sortColumn = STATS_SORT_COLUMNS[q.sort];
  const columns = [...new Set(["id", "player_id", "player_name", sortColumn])].join(", ");

  type KeyRow = { id: string; player_id: string; player_name: string };
  // 1回目で件数も取り、残りの範囲はまとめて同時に取る(DB の並び順のまま連結する)
  const fetchRange = async (from: number, withCount: boolean) => {
    const { data, count, error } = await ordered(filtered(columns, withCount ? { count: "exact" } : undefined))
      .range(from, from + MAX_ROWS_PER_REQUEST - 1)
      .overrideTypes<KeyRow[], { merge: false }>();
    if (error) throw new Error(`スタッツの取得に失敗しました: ${error.message}`);
    return { rows: data ?? [], count: count ?? 0 };
  };
  const first = await fetchRange(0, true);
  const rest = await Promise.all(
    Array.from({ length: Math.max(0, Math.ceil(first.count / MAX_ROWS_PER_REQUEST) - 1) }, (_, i) =>
      fetchRange((i + 1) * MAX_ROWS_PER_REQUEST, false)
    )
  );
  const keys: KeyRow[] = [first, ...rest].flatMap((part) => part.rows);

  // DB の並び順のまま、名前が一致する行だけを残す
  const matched = keys.filter((r) => r.player_name.toLowerCase().includes(term) || englishMatch.has(r.player_id));
  const total = matched.length;
  const lastPage = Math.max(1, Math.ceil(total / STATS_PAGE_SIZE));
  // 範囲外のページ(条件を変えて件数が減った共有URLなど)は最後のページにする
  const page = Math.min(q.page, lastPage);
  const from = (page - 1) * STATS_PAGE_SIZE;
  const pageIds = matched.slice(from, from + STATS_PAGE_SIZE).map((r) => r.id);
  if (pageIds.length === 0) return { rows: [], total, page, lastPage, from };

  const { data, error } = await selectList(supabase, "*").in("id", pageIds).overrideTypes<StatsListRow[], { merge: false }>();
  if (error) throw new Error(`スタッツの取得に失敗しました: ${error.message}`);
  const byId = new Map((data ?? []).map((r) => [r.id, r]));
  const rows = pageIds.map((id) => byId.get(id)).filter((r): r is StatsListRow => r !== undefined);
  return { rows, total, page, lastPage, from };
}

/** 選手名の検索がないとき: 指定したページの100件だけを取得する(範囲外のページは最後のページ) */
async function fetchSinglePage(
  source: (select: string, options?: SelectOptions) => ListQuery,
  ordered: <T extends ListQuery>(query: T) => T,
  requestedPage: number
): Promise<StatsPage> {
  const run = (page: number) => {
    const from = (page - 1) * STATS_PAGE_SIZE;
    return ordered(source("*", { count: "exact" }))
      .range(from, from + STATS_PAGE_SIZE - 1)
      .overrideTypes<StatsListRow[], { merge: false }>();
  };

  let page = requestedPage;
  let { data, count, error } = await run(page);
  // 範囲外のページ(条件を変えて件数が減った共有URLなど)は、件数だけを取り直して最後のページを表示する
  if (error && (error.code === "PGRST103" || /range not satisfiable/i.test(error.message))) {
    const head = await source("id", { count: "exact", head: true });
    if (head.error) throw new Error(`スタッツの取得に失敗しました: ${head.error.message}`);
    page = Math.max(1, Math.ceil((head.count ?? 0) / STATS_PAGE_SIZE));
    ({ data, count, error } = await run(page));
  }
  if (error) throw new Error(`スタッツの取得に失敗しました: ${error.message}`);
  const total = count ?? 0;
  const lastPage = Math.max(1, Math.ceil(total / STATS_PAGE_SIZE));
  return { rows: data ?? [], total, page, lastPage, from: (page - 1) * STATS_PAGE_SIZE };
}
