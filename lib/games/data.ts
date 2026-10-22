// 試合センターのデータ取得(サーバー専用)。
// games / game_player_stats テーブル(supabase/migrations/20261003000000_games.sql)から読む。
// テーブルが未作成の場合は「データ準備中」として扱い、画面を壊さない。

import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { fetchAllRows } from "@/lib/supabase/fetch-all";
import { addDays, jstDateOf, jstDayRangeUtc } from "./date";
import type {
  BoxScoreRow,
  FullBox,
  FullBoxRow,
  FullBoxTotals,
  GameCalendarResponse,
  GameDayStatus,
  GameDetailResponse,
  GameSummary,
  GameTeamLine,
  GamesResponse,
  PreseasonBoxRow,
  PreseasonBoxTotals,
} from "./types";

type Client = SupabaseClient<Database>;
type GameRow = Database["public"]["Tables"]["games"]["Row"];
type TeamRow = Database["public"]["Tables"]["teams"]["Row"];
type StatRow = Database["public"]["Tables"]["game_player_stats"]["Row"];
type PreseasonGameRow = Database["public"]["Tables"]["preseason_games"]["Row"];
type PreseasonStatRow = Database["public"]["Tables"]["preseason_player_stats"]["Row"];
type PreseasonTotalRow = Database["public"]["Tables"]["preseason_team_totals"]["Row"];
type BoxGameRow = Database["public"]["Tables"]["box_score_games"]["Row"];
type BoxPlayerRow = Database["public"]["Tables"]["box_score_players"]["Row"];
type BoxTotalRow = Database["public"]["Tables"]["box_score_team_totals"]["Row"];

// テーブルが存在しないときにPostgREST/Postgresが返すエラーコード
const MISSING_TABLE_CODES = new Set(["PGRST205", "42P01"]);

function isMissingTable(error: { code?: string } | null): boolean {
  return Boolean(error?.code && MISSING_TABLE_CODES.has(error.code));
}

function teamLine(team: TeamRow | undefined, side: "home" | "away", g: GameRow): GameTeamLine {
  const q = side === "home" ? [g.home_q1, g.home_q2, g.home_q3, g.home_q4] : [g.away_q1, g.away_q2, g.away_q3, g.away_q4];
  return {
    teamId: side === "home" ? g.home_team_id : g.away_team_id,
    abbreviation: team?.abbreviation ?? "—",
    name: team?.name ?? "（不明）",
    city: team?.city ?? "",
    score: side === "home" ? g.home_score : g.away_score,
    quarters: q,
    overtimes: (side === "home" ? g.home_ot_scores : g.away_ot_scores) ?? [],
  };
}

function toSummary(g: GameRow, teams: Map<string, TeamRow>): GameSummary {
  return {
    id: g.id,
    jstDate: g.tipoff_at ? jstDateOf(g.tipoff_at) : null,
    tipoffAt: g.tipoff_at,
    status: g.status,
    statusDetail: g.status_detail,
    period: g.period,
    postseason: g.postseason,
    preseason: false,
    home: teamLine(teams.get(g.home_team_id), "home", g),
    away: teamLine(teams.get(g.away_team_id), "away", g),
  };
}

async function fetchTeams(supabase: Client, ids: string[]): Promise<Map<string, TeamRow>> {
  if (ids.length === 0) return new Map();
  const { data, error } = await supabase.from("teams").select("*").in("id", ids);
  if (error) throw new Error(`teamsの取得に失敗しました: ${error.message}`);
  return new Map((data ?? []).map((t) => [t.id, t]));
}

/** 日本時間のその日に始まる試合(開始時刻順) */
export async function fetchGamesForJstDate(supabase: Client, date: string): Promise<GamesResponse> {
  const { start, end } = jstDayRangeUtc(date);
  const { data, error } = await supabase
    .from("games")
    .select("*")
    .gte("tipoff_at", start)
    .lt("tipoff_at", end)
    .order("tipoff_at", { ascending: true });

  if (isMissingTable(error)) return { status: "not_ready", date };
  if (error) throw new Error(`gamesの取得に失敗しました: ${error.message}`);

  const games = data ?? [];
  // プレシーズン(Excel取り込み)の試合。開始時刻がないため、日本時間のその日の試合の後ろに並べる
  const [preseason, box, csvGameIds] = await Promise.all([
    fetchPreseasonGamesForDate(supabase, date),
    fetchBoxScoreGamesForDate(supabase, date, games),
    fetchCsvBoxScoreGameIds(supabase, games.map((g) => g.id)),
  ]);
  const teams = await fetchTeams(
    supabase,
    [...new Set([...games, ...preseason, ...box.standalone].flatMap((g) => [g.home_team_id, g.away_team_id]))]
  );
  return {
    status: "ok",
    date,
    games: [
      ...games.map((g) => {
        const b = box.matched.get(g.id);
        return b ? withBoxScore(toSummary(g, teams), b) : { ...toSummary(g, teams), hasBoxScore: csvGameIds.has(g.id) };
      }),
      // 日程(games)に無い試合のボックススコア。開始時刻がないため、日程の試合の後ろに並べる
      ...box.standalone.map((b) => boxSummary(b, teams)),
      ...preseason.map((g) => ({ ...preseasonSummary(g, teams), hasBoxScore: true })),
    ],
  };
}

/** CSV で個人成績を登録済みの試合 */
async function fetchCsvBoxScoreGameIds(supabase: Client, gameIds: string[]): Promise<Set<string>> {
  if (gameIds.length === 0) return new Set();
  const { data, error } = await supabase.from("game_player_stats").select("game_id").in("game_id", gameIds);
  if (error) return new Set();
  return new Set((data ?? []).map((r) => r.game_id));
}

// ==========================================================================
// プレシーズン(preseason_* テーブル。管理画面の Excel から取り込み)
// ==========================================================================

// Excel の Game Date は米国側の日付。日本時間ではその翌日に行われるため、公開側(試合センターの日付・
// 今日/前日/翌日の判定・試合詳細の日付)では1日加えた日付を日本時間の日付として使う。
// 保存している game_date(管理画面・Excel取込・Game ID・Coverage の元の日付)は変えない。
// レギュラーシーズン(games.tipoff_at から日本時間を計算)には関係しない。
const PRESEASON_JST_OFFSET_DAYS = 1;

/** プレシーズンの試合の、日本時間の日付(Excel の Game Date + 1日) */
function preseasonJstDate(gameDate: string): string {
  return addDays(gameDate, PRESEASON_JST_OFFSET_DAYS);
}

/** 日本時間のその日に表示するプレシーズンの試合(= Excel の Game Date がその前日の試合) */
async function fetchPreseasonGamesForDate(supabase: Client, jstDate: string): Promise<PreseasonGameRow[]> {
  const gameDate = addDays(jstDate, -PRESEASON_JST_OFFSET_DAYS);
  const { data, error } = await supabase.from("preseason_games").select("*").eq("game_date", gameDate).order("game_key");
  // テーブル未作成のときは、プレシーズンの試合がないものとして扱う
  if (isMissingTable(error)) return [];
  if (error) throw new Error(`preseason_gamesの取得に失敗しました: ${error.message}`);
  return data ?? [];
}

function preseasonSummary(g: PreseasonGameRow, teams: Map<string, TeamRow>): GameSummary {
  const line = (side: "home" | "away"): GameTeamLine => {
    const team = teams.get(side === "home" ? g.home_team_id : g.away_team_id);
    return {
      teamId: side === "home" ? g.home_team_id : g.away_team_id,
      abbreviation: team?.abbreviation ?? "—",
      name: team?.name ?? (side === "home" ? g.home_team_label : g.away_team_label),
      city: team?.city ?? "",
      score: side === "home" ? g.home_score : g.away_score,
      quarters: side === "home" ? [g.home_q1, g.home_q2, g.home_q3, g.home_q4] : [g.away_q1, g.away_q2, g.away_q3, g.away_q4],
      // プレシーズンのExcelは延長の合計得点だけを持つ(延長の回ごとの内訳はない)。OT列追加前のデータは undefined
      overtimes: (side === "home" ? g.home_ot : g.away_ot) != null ? [(side === "home" ? g.home_ot : g.away_ot)!] : [],
    };
  };
  return {
    id: g.id,
    jstDate: preseasonJstDate(g.game_date),
    tipoffAt: null,
    status: g.status,
    statusDetail: g.status_detail,
    period: null,
    postseason: false,
    preseason: true,
    home: line("home"),
    away: line("away"),
  };
}

function toPreseasonRow(s: PreseasonStatRow): PreseasonBoxRow {
  return {
    playerName: s.player_name,
    position: s.position,
    played: s.played,
    minutes: s.minutes,
    pts: s.pts,
    fgm: s.fgm,
    fga: s.fga,
    fg3m: s.fg3m,
    fg3a: s.fg3a,
    ftm: s.ftm,
    fta: s.fta,
    oreb: s.oreb,
    dreb: s.dreb,
    reb: s.reb,
    ast: s.ast,
    stl: s.stl,
    blk: s.blk,
    tov: s.tov,
    pf: s.pf,
  };
}

function toPreseasonTotals(t: PreseasonTotalRow | undefined): PreseasonBoxTotals | null {
  if (!t) return null;
  return {
    pts: t.pts,
    fgm: t.fgm,
    fga: t.fga,
    fg3m: t.fg3m,
    fg3a: t.fg3a,
    ftm: t.ftm,
    fta: t.fta,
    oreb: t.oreb,
    dreb: t.dreb,
    reb: t.reb,
    ast: t.ast,
    stl: t.stl,
    blk: t.blk,
    tov: t.tov,
    pf: t.pf,
    fgPct: t.fg_pct,
    fg3Pct: t.fg3_pct,
    ftPct: t.ft_pct,
  };
}

/** プレシーズンの試合の詳細。見つからなければ null */
async function fetchPreseasonGameDetail(supabase: Client, gameId: string): Promise<GameDetailResponse | null> {
  const { data: game, error } = await supabase.from("preseason_games").select("*").eq("id", gameId).maybeSingle();
  if (isMissingTable(error)) return null;
  if (error) throw new Error(`preseason_gamesの取得に失敗しました: ${error.message}`);
  if (!game) return null;

  const [teams, statsResult, totalsResult] = await Promise.all([
    fetchTeams(supabase, [game.home_team_id, game.away_team_id]),
    supabase.from("preseason_player_stats").select("*").eq("game_id", gameId).order("row_order"),
    supabase.from("preseason_team_totals").select("*").eq("game_id", gameId),
  ]);
  if (statsResult.error) throw new Error(`preseason_player_statsの取得に失敗しました: ${statsResult.error.message}`);
  if (totalsResult.error) throw new Error(`preseason_team_totalsの取得に失敗しました: ${totalsResult.error.message}`);

  const stats = statsResult.data ?? [];
  const totals = totalsResult.data ?? [];
  return {
    status: "ok",
    detail: {
      game: preseasonSummary(game, teams),
      homePlayers: [],
      awayPlayers: [],
      preseason: {
        // 出典(Excel)の並び順のまま(先発 → 控え → 出場なし)
        away: stats.filter((s) => s.side === "away").map(toPreseasonRow),
        home: stats.filter((s) => s.side === "home").map(toPreseasonRow),
        awayTotals: toPreseasonTotals(totals.find((t) => t.side === "away")),
        homeTotals: toPreseasonTotals(totals.find((t) => t.side === "home")),
      },
    },
  };
}

function toBoxRow(s: StatRow): BoxScoreRow {
  return {
    playerId: s.player_id,
    playerName: s.player_name,
    secondsPlayed: s.seconds_played,
    pts: s.pts,
    reb: s.reb,
    ast: s.ast,
    stl: s.stl,
    blk: s.blk,
    fgm: s.fgm,
    fga: s.fga,
    fg3m: s.fg3m,
    fg3a: s.fg3a,
    ftm: s.ftm,
    fta: s.fta,
    plusMinus: s.plus_minus,
  };
}

/** 試合の詳細(スコアと両チームのボックススコア) */
export async function fetchGameDetail(supabase: Client, gameId: string): Promise<GameDetailResponse> {
  const { data: game, error } = await supabase.from("games").select("*").eq("id", gameId).maybeSingle();
  if (isMissingTable(error)) return { status: "not_ready" };
  if (error) throw new Error(`gamesの取得に失敗しました: ${error.message}`);
  if (!game) {
    return (await fetchPreseasonGameDetail(supabase, gameId)) ?? (await fetchStandaloneBoxDetail(supabase, gameId)) ?? { status: "not_found" };
  }

  // 同じ日付・同じ対戦のボックススコア(新書式Excel)があれば、そちらを表示する
  const box = await findBoxScoreForGame(supabase, game);
  if (box) {
    const [teams, full] = await Promise.all([fetchTeams(supabase, [game.home_team_id, game.away_team_id]), fetchFullBox(supabase, box)]);
    return { status: "ok", detail: { game: withBoxScore(toSummary(game, teams), box), homePlayers: [], awayPlayers: [], full } };
  }

  const [teams, statsResult] = await Promise.all([
    fetchTeams(supabase, [game.home_team_id, game.away_team_id]),
    supabase.from("game_player_stats").select("*").eq("game_id", gameId),
  ]);
  if (statsResult.error && !isMissingTable(statsResult.error)) {
    throw new Error(`game_player_statsの取得に失敗しました: ${statsResult.error.message}`);
  }

  // 出場時間の長い順(同じなら得点の多い順)
  const rows = [...(statsResult.data ?? [])].sort((a, b) => b.seconds_played - a.seconds_played || b.pts - a.pts);
  return {
    status: "ok",
    detail: {
      game: toSummary(game, teams),
      homePlayers: rows.filter((r) => r.team_id === game.home_team_id).map(toBoxRow),
      awayPlayers: rows.filter((r) => r.team_id === game.away_team_id).map(toBoxRow),
    },
  };
}

// ==========================================================================
// ボックススコア(box_score_* テーブル。管理画面の新書式Excelから取り込み)
// ==========================================================================

// Excel の Date は米国東部時間の試合日。日程(games)の同じ日付・同じ対戦の試合があれば、その試合にボックススコアを表示する。
// 日程に無い試合は、プレシーズンと同じく1日加えた日付を日本時間の日付として表示する。
const BOX_SCORE_JST_OFFSET_DAYS = 1;

function matchKey(gameDate: string, homeTeamId: string, awayTeamId: string): string {
  return `${gameDate}|${homeTeamId}|${awayTeamId}`;
}

/**
 * 日本時間のその日に表示するボックススコア。
 * matched: その日の日程(games)の試合ID → ボックススコア / standalone: 日程に無い試合(Excel の Date がその前日)
 */
async function fetchBoxScoreGamesForDate(
  supabase: Client,
  jstDate: string,
  games: GameRow[]
): Promise<{ matched: Map<string, BoxGameRow>; standalone: BoxGameRow[] }> {
  const empty = { matched: new Map<string, BoxGameRow>(), standalone: [] as BoxGameRow[] };
  const usDate = addDays(jstDate, -BOX_SCORE_JST_OFFSET_DAYS);
  const dates = [...new Set([usDate, ...games.map((g) => g.game_date)])];
  const { data, error } = await supabase.from("box_score_games").select("*").in("game_date", dates);
  // テーブル未作成のときは、ボックススコアがないものとして扱う
  if (isMissingTable(error)) return empty;
  if (error) throw new Error(`box_score_gamesの取得に失敗しました: ${error.message}`);
  const boxes = data ?? [];
  if (boxes.length === 0) return empty;

  const gameIdByKey = new Map(games.map((g) => [matchKey(g.game_date, g.home_team_id, g.away_team_id), g.id]));
  const matched = new Map<string, BoxGameRow>();
  const candidates: BoxGameRow[] = [];
  for (const b of boxes) {
    const gameId = gameIdByKey.get(matchKey(b.game_date, b.home_team_id, b.away_team_id));
    if (gameId) matched.set(gameId, b);
    else if (b.game_date === usDate) candidates.push(b);
  }
  if (candidates.length === 0) return { matched, standalone: [] };

  // 日程(games)にある試合は、その試合の日付(日本時間)の方に表示するため、ここでは出さない
  const { data: sameDay } = await supabase.from("games").select("game_date, home_team_id, away_team_id").eq("game_date", usDate);
  const scheduled = new Set((sameDay ?? []).map((g) => matchKey(g.game_date, g.home_team_id, g.away_team_id)));
  return { matched, standalone: candidates.filter((b) => !scheduled.has(matchKey(b.game_date, b.home_team_id, b.away_team_id))) };
}

function boxTeamLine(team: TeamRow | undefined, side: "home" | "away", b: BoxGameRow): GameTeamLine {
  return {
    teamId: side === "home" ? b.home_team_id : b.away_team_id,
    abbreviation: team?.abbreviation ?? "—",
    name: team?.name ?? "（不明）",
    city: team?.city ?? "",
    score: side === "home" ? b.home_score : b.away_score,
    quarters: side === "home" ? [b.home_q1, b.home_q2, b.home_q3, b.home_q4] : [b.away_q1, b.away_q2, b.away_q3, b.away_q4],
    overtimes: (side === "home" ? b.home_ot_scores : b.away_ot_scores) ?? [],
  };
}

function boxStatus(b: BoxGameRow): Pick<GameSummary, "status" | "statusDetail" | "period"> {
  const ot = Math.max(b.home_ot_scores?.length ?? 0, b.away_ot_scores?.length ?? 0);
  return { status: "final", statusDetail: ot > 0 ? (ot === 1 ? "Final/OT" : `Final/${ot}OT`) : "Final", period: 4 + ot };
}

/** 日程(games)に無い試合の、ボックススコアだけで作る一覧の1件 */
function boxSummary(b: BoxGameRow, teams: Map<string, TeamRow>): GameSummary {
  return {
    id: b.id,
    jstDate: addDays(b.game_date, BOX_SCORE_JST_OFFSET_DAYS),
    tipoffAt: null,
    ...boxStatus(b),
    postseason: false,
    preseason: false,
    hasBoxScore: true,
    home: boxTeamLine(teams.get(b.home_team_id), "home", b),
    away: boxTeamLine(teams.get(b.away_team_id), "away", b),
  };
}

/** 日程(games)の試合に、ボックススコアの得点(検査済みの最終結果)を重ねる。試合ID・開始時刻は日程のまま */
function withBoxScore(summary: GameSummary, b: BoxGameRow): GameSummary {
  const line = (side: "home" | "away"): GameTeamLine => ({
    ...summary[side],
    score: side === "home" ? b.home_score : b.away_score,
    quarters: side === "home" ? [b.home_q1, b.home_q2, b.home_q3, b.home_q4] : [b.away_q1, b.away_q2, b.away_q3, b.away_q4],
    overtimes: (side === "home" ? b.home_ot_scores : b.away_ot_scores) ?? [],
  });
  return { ...summary, ...boxStatus(b), hasBoxScore: true, home: line("home"), away: line("away") };
}

function toFullRow(p: BoxPlayerRow): FullBoxRow {
  return {
    playerId: p.player_id,
    playerName: p.player_name,
    role: p.role,
    dnpReason: p.dnp_reason,
    secondsPlayed: p.seconds_played,
    fgm: p.fgm,
    fga: p.fga,
    fg3m: p.fg3m,
    fg3a: p.fg3a,
    ftm: p.ftm,
    fta: p.fta,
    oreb: p.oreb,
    dreb: p.dreb,
    reb: p.reb,
    ast: p.ast,
    stl: p.stl,
    blk: p.blk,
    tov: p.tov,
    pf: p.pf,
    pts: p.pts,
    plusMinus: p.plus_minus,
  };
}

function toFullTotals(t: BoxTotalRow | undefined): FullBoxTotals | null {
  if (!t) return null;
  return {
    fgm: t.fgm,
    fga: t.fga,
    fg3m: t.fg3m,
    fg3a: t.fg3a,
    ftm: t.ftm,
    fta: t.fta,
    oreb: t.oreb,
    dreb: t.dreb,
    reb: t.reb,
    ast: t.ast,
    stl: t.stl,
    blk: t.blk,
    tov: t.tov,
    pf: t.pf,
    pts: t.pts,
  };
}

async function fetchFullBox(supabase: Client, b: BoxGameRow): Promise<FullBox> {
  const [playersResult, totalsResult] = await Promise.all([
    supabase.from("box_score_players").select("*").eq("game_id", b.id).order("row_order"),
    supabase.from("box_score_team_totals").select("*").eq("game_id", b.id),
  ]);
  if (playersResult.error) throw new Error(`box_score_playersの取得に失敗しました: ${playersResult.error.message}`);
  if (totalsResult.error) throw new Error(`box_score_team_totalsの取得に失敗しました: ${totalsResult.error.message}`);
  const players = playersResult.data ?? [];
  const totals = totalsResult.data ?? [];
  return {
    // 出典(Excel)の並び順のまま(先発 → 控え → DNP)
    away: players.filter((p) => p.side === "away").map(toFullRow),
    home: players.filter((p) => p.side === "home").map(toFullRow),
    awayTotals: toFullTotals(totals.find((t) => t.side === "away")),
    homeTotals: toFullTotals(totals.find((t) => t.side === "home")),
    sourceUrl: b.source_url,
  };
}

/** 日程(games)の試合と同じ日付・同じ対戦のボックススコア。なければ null(テーブル未作成のときも null) */
async function findBoxScoreForGame(supabase: Client, g: GameRow): Promise<BoxGameRow | null> {
  const { data, error } = await supabase
    .from("box_score_games")
    .select("*")
    .eq("game_date", g.game_date)
    .eq("home_team_id", g.home_team_id)
    .eq("away_team_id", g.away_team_id)
    .maybeSingle();
  if (error) return null;
  return data ?? null;
}

/** 日程に無い試合のボックススコアの詳細。見つからなければ null */
async function fetchStandaloneBoxDetail(supabase: Client, gameId: string): Promise<GameDetailResponse | null> {
  const { data: b, error } = await supabase.from("box_score_games").select("*").eq("id", gameId).maybeSingle();
  if (error || !b) return null;
  const [teams, full] = await Promise.all([fetchTeams(supabase, [b.home_team_id, b.away_team_id]), fetchFullBox(supabase, b)]);
  return { status: "ok", detail: { game: boxSummary(b, teams), homePlayers: [], awayPlayers: [], full } };
}

// ==========================================================================
// 試合カレンダー(日本時間の日付ごとの試合数。結果は含まない)
// ==========================================================================

function firstDayOfNextMonth(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, "0")}-01`;
}

/**
 * その月(YYYY-MM)の、日本時間の日付ごとの試合数と入力状況(日程・日程に無いボックススコア・プレシーズンの合計)。
 * 入力状況は保存済みのデータから数える(結果: 試合終了の得点がある / ボックススコア: 個人成績の行がある / 予定: 試合前でまだ始まっていない)。
 * 対戦カード・得点・勝敗は返さない(ネタバレ防止)。
 */
export async function fetchGameCountsForMonth(supabase: Client, month: string, now: Date = new Date()): Promise<GameCalendarResponse> {
  const first = `${month}-01`;
  const nextFirst = firstDayOfNextMonth(month);
  const start = jstDayRangeUtc(first).start;
  const end = jstDayRangeUtc(nextFirst).start;
  // 米国の日付で保存している試合(ボックススコア・プレシーズン)は、日本時間の日付 = 米国の日付 + 1日
  const usFrom = addDays(first, -1);
  const usTo = addDays(nextFirst, -1);
  const today = jstDateOf(now.toISOString());
  const counts: Record<string, number> = {};
  const statuses: Record<string, GameDayStatus> = {};
  const add = (date: string, game: { result: boolean; box: boolean; upcoming: boolean }) => {
    if (date < first || date >= nextFirst) return;
    counts[date] = (counts[date] ?? 0) + 1;
    const s = (statuses[date] ??= { total: 0, results: 0, boxScores: 0, upcoming: 0 });
    s.total += 1;
    if (game.result) s.results += 1;
    if (game.box) s.boxScores += 1;
    if (game.upcoming) s.upcoming += 1;
  };

  const [gamesResult, scheduledResult, boxResult, preseasonResult] = await Promise.all([
    supabase.from("games").select("id, tipoff_at, status, home_score, away_score, game_date, home_team_id, away_team_id").gte("tipoff_at", start).lt("tipoff_at", end).limit(1000),
    supabase.from("games").select("game_date, home_team_id, away_team_id").gte("game_date", usFrom).lt("game_date", usTo).limit(1000),
    supabase.from("box_score_games").select("game_date, home_team_id, away_team_id").gte("game_date", usFrom).lt("game_date", usTo).limit(1000),
    supabase.from("preseason_games").select("id, game_date, status, home_score, away_score").gte("game_date", usFrom).lt("game_date", usTo).limit(1000),
  ]);
  if (gamesResult.error && !isMissingTable(gamesResult.error)) throw new Error(`gamesの取得に失敗しました: ${gamesResult.error.message}`);
  const games = gamesResult.data ?? [];
  const preseason = preseasonResult.data ?? [];

  // 個人成績が登録されている試合(CSV の game_player_stats・プレシーズンの preseason_player_stats)
  const [csvRows, preseasonRows] = await Promise.all([
    games.length > 0
      ? fetchAllRows<{ game_id: string }>((f, t) => supabase.from("game_player_stats").select("game_id").in("game_id", games.map((g) => g.id)).order("id").range(f, t))
      : Promise.resolve({ data: [] as { game_id: string }[], error: null }),
    preseason.length > 0
      ? fetchAllRows<{ game_id: string }>((f, t) => supabase.from("preseason_player_stats").select("game_id").in("game_id", preseason.map((g) => g.id)).order("id").range(f, t))
      : Promise.resolve({ data: [] as { game_id: string }[], error: null }),
  ]);
  const csvGameIds = new Set(csvRows.data.map((r) => r.game_id));
  const preseasonBoxIds = new Set(preseasonRows.data.map((r) => r.game_id));
  const boxKeys = new Set((boxResult.data ?? []).map((b) => matchKey(b.game_date, b.home_team_id, b.away_team_id)));
  const nowIso = now.toISOString();

  for (const g of games) {
    if (!g.tipoff_at) continue;
    const hasFullBox = boxKeys.has(matchKey(g.game_date, g.home_team_id, g.away_team_id));
    add(jstDateOf(g.tipoff_at), {
      // 新書式のボックススコアがある試合は、検査済みの最終結果として結果も入力済み
      result: hasFullBox || (g.status === "final" && g.home_score !== null && g.away_score !== null),
      box: hasFullBox || csvGameIds.has(g.id),
      upcoming: !hasFullBox && g.status === "scheduled" && g.tipoff_at > nowIso,
    });
  }

  // 日程(games)にある試合のボックススコアは、日程の試合として数え済み
  const scheduled = new Set((scheduledResult.data ?? []).map((g) => matchKey(g.game_date, g.home_team_id, g.away_team_id)));
  for (const b of boxResult.data ?? []) {
    if (!scheduled.has(matchKey(b.game_date, b.home_team_id, b.away_team_id))) {
      add(addDays(b.game_date, BOX_SCORE_JST_OFFSET_DAYS), { result: true, box: true, upcoming: false });
    }
  }
  for (const p of preseason) {
    const jst = preseasonJstDate(p.game_date);
    add(jst, {
      result: p.status === "final" && p.home_score !== null && p.away_score !== null,
      box: preseasonBoxIds.has(p.id),
      upcoming: p.status === "scheduled" && jst >= today,
    });
  }
  return { month, counts, statuses };
}

/** その日より前で試合がある直近の日付と、その日より後で試合がある直近の日付(日本時間。なければ null) */
export async function fetchAdjacentGameDates(supabase: Client, date: string): Promise<{ prev: string | null; next: string | null }> {
  const { start, end } = jstDayRangeUtc(date);
  const usDate = addDays(date, -1);
  const [gPrev, gNext, pPrev, pNext, bPrev, bNext] = await Promise.all([
    supabase.from("games").select("tipoff_at").lt("tipoff_at", start).order("tipoff_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("games").select("tipoff_at").gte("tipoff_at", end).order("tipoff_at", { ascending: true }).limit(1).maybeSingle(),
    supabase.from("preseason_games").select("game_date").lt("game_date", usDate).order("game_date", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("preseason_games").select("game_date").gt("game_date", usDate).order("game_date", { ascending: true }).limit(1).maybeSingle(),
    supabase.from("box_score_games").select("game_date").lt("game_date", usDate).order("game_date", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("box_score_games").select("game_date").gt("game_date", usDate).order("game_date", { ascending: true }).limit(1).maybeSingle(),
  ]);
  const prevs = [
    gPrev.data?.tipoff_at ? jstDateOf(gPrev.data.tipoff_at) : null,
    pPrev.data ? addDays(pPrev.data.game_date, 1) : null,
    bPrev.data ? addDays(bPrev.data.game_date, BOX_SCORE_JST_OFFSET_DAYS) : null,
  ].filter((d): d is string => d !== null && d < date);
  const nexts = [
    gNext.data?.tipoff_at ? jstDateOf(gNext.data.tipoff_at) : null,
    pNext.data ? addDays(pNext.data.game_date, 1) : null,
    bNext.data ? addDays(bNext.data.game_date, BOX_SCORE_JST_OFFSET_DAYS) : null,
  ].filter((d): d is string => d !== null && d > date);
  return { prev: prevs.length ? prevs.sort()[prevs.length - 1] : null, next: nexts.length ? nexts.sort()[0] : null };
}
