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
  const minGames = Number(one(params, "minGames"));
  const page = Number(one(params, "page"));
  const position = one(params, "pos");
  const team = one(params, "team");
  const q = normalizeSearchTerm(one(params, "q"));
  return {
    seasonType: one(params, "type") === "playoffs" ? "playoffs" : "regular_season",
    season: seasonParam === "all" ? null : /^\d{4}$/.test(seasonParam ?? "") ? Number(seasonParam) : latestSeason,
    position: position && STATS_POSITIONS.includes(position) ? position : null,
    team: team && /^[A-Z]{2,3}$/.test(team) ? team : null,
    minGames: STATS_MIN_GAMES.includes(minGames) ? minGames : 0,
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
  if (v.minGames) sp.set("minGames", String(v.minGames));
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

// 英語名で一致した選手のIDを1回の問い合わせに入れる数(URL が長くなりすぎないように分ける)
const NAME_ID_CHUNK = 150;
// 同時に送る問い合わせの数。全シーズン×1文字の検索など問い合わせが多いときに、DB の時間制限を超えないように抑える
const MAX_PARALLEL_QUERIES = 1;
// DB から1回に取れる行数の上限
const MAX_ROWS_PER_REQUEST = 1000;

type SelectOptions = { count: "exact"; head?: boolean };
function selectList(supabase: Client, select: string, options: SelectOptions) {
  return supabase.from("player_stats_list").select(select, options);
}
type ListQuery = ReturnType<typeof selectList>;

/**
 * 検索条件に合う行を、指定したページの100件だけ取得する。
 * 選手名の検索で、英語名だけが一致する選手(日本語名で表示している選手)がいる場合は、
 * 「表示名が一致する行」と「英語名だけが一致する行(ID を100人ずつ)」を別々に、どれも同じ並び順で問い合わせ、
 * 表示するページまでの行だけを取り出してから1つの並びにまとめる(重ならないように、後者は表示名が一致しない行に限る)。
 * 件数はそれぞれの件数の合計。人数の上限はなく、取りこぼさない。
 */
export async function fetchStatsPage(
  supabase: Client,
  q: StatsQuery,
  teamId: string | null,
  // 英語名で一致した、日本語名で表示している選手のID(fetchEnglishNameMatchIds)
  nameMatchIds: string[] = []
): Promise<StatsPage> {
  const filtered = (select: string, options: SelectOptions) => {
    let query = selectList(supabase, select, options).eq("season_type", q.seasonType);
    if (q.season !== null) query = query.eq("season", q.season);
    if (q.position) query = query.eq("position", q.position);
    if (teamId) query = query.contains("team_ids", [teamId]);
    if (q.minGames > 0) query = query.gte("games_played", q.minGames);
    return query;
  };
  const ordered = <T extends ListQuery>(query: T) =>
    query
      .order(STATS_SORT_COLUMNS[q.sort], { ascending: q.dir === "asc", nullsFirst: false })
      // 同じ値のときの並びを毎回同じにする(ページをまたいで重複・欠落しないように)
      .order("player_name", { ascending: true })
      .order("id", { ascending: true });

  const namePattern = q.q ? `*${q.q}*` : null;
  // 問い合わせの単位(検索なし・英語名の一致なしなら1つだけ)
  const sources: ((select: string, options: SelectOptions) => ListQuery)[] = [
    (select, options) => (namePattern ? filtered(select, options).ilike("player_name", namePattern) : filtered(select, options)),
  ];
  if (namePattern) {
    for (let i = 0; i < nameMatchIds.length; i += NAME_ID_CHUNK) {
      const chunk = nameMatchIds.slice(i, i + NAME_ID_CHUNK);
      sources.push((select, options) => filtered(select, options).in("player_id", chunk).not("player_name", "ilike", namePattern));
    }
  }

  if (sources.length === 1) return fetchSinglePage(sources[0], ordered, q.page);

  // 複数の問い合わせ: それぞれ「表示するページの最後の行」までを取り、まとめて並べ替えてから切り出す
  const need = q.page * STATS_PAGE_SIZE;
  const parts = await mapWithConcurrency(
    sources,
    MAX_PARALLEL_QUERIES,
    async (source) => {
      const rows: StatsListRow[] = [];
      let count = 0;
      for (let from = 0; from < need; from += MAX_ROWS_PER_REQUEST) {
        const to = Math.min(need, from + MAX_ROWS_PER_REQUEST) - 1;
        const { data, count: c, error } = await ordered(source("*", { count: "exact" }))
          .range(from, to)
          .overrideTypes<StatsListRow[], { merge: false }>();
        if (error) throw new Error(`スタッツの取得に失敗しました: ${error.message}`);
        count = c ?? 0;
        rows.push(...(data ?? []));
        if (!data || data.length < to - from + 1) break;
      }
      return { rows, count };
    }
  );
  const total = parts.reduce((sum, p) => sum + p.count, 0);
  const lastPage = Math.max(1, Math.ceil(total / STATS_PAGE_SIZE));
  // 範囲外のページは最後のページにする(取った行は最後のページまでを含む)
  const page = Math.min(q.page, lastPage);
  const from = (page - 1) * STATS_PAGE_SIZE;
  const merged = parts.flatMap((p) => p.rows).sort(compareRows(STATS_SORT_COLUMNS[q.sort], q.dir));
  return { rows: merged.slice(from, from + STATS_PAGE_SIZE), total, page, lastPage, from };
}

// items を同時に limit 件までの処理で順に変換する(結果は items と同じ順)
async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await fn(items[index]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

// DB の並び順(ORDER BY 列 [asc|desc] NULLS LAST, player_name, id)と同じ比較
function compareRows(column: (typeof STATS_SORT_COLUMNS)[StatsSortKey], dir: "asc" | "desc") {
  const sign = dir === "asc" ? 1 : -1;
  const cmp = (a: unknown, b: unknown) => (a === b ? 0 : (a as string | number) < (b as string | number) ? -1 : 1);
  return (a: StatsListRow, b: StatsListRow) => {
    const va = a[column];
    const vb = b[column];
    if (va === null && vb !== null) return 1;
    if (va !== null && vb === null) return -1;
    return sign * cmp(va, vb) || cmp(a.player_name, b.player_name) || cmp(a.id, b.id);
  };
}

/** 問い合わせが1つのとき: 指定したページの100件だけを取得する(範囲外のページは最後のページ) */
async function fetchSinglePage(
  source: (select: string, options: SelectOptions) => ListQuery,
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
