// 試合センターのデータ取得(サーバー専用)。
// games / game_player_stats テーブル(supabase/migrations/20261003000000_games.sql)から読む。
// テーブルが未作成の場合は「データ準備中」として扱い、画面を壊さない。

import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { addDays, jstDateOf, jstDayRangeUtc } from "./date";
import type { BoxScoreRow, GameDetailResponse, GameSummary, GameTeamLine, GamesResponse, PreseasonBoxRow, PreseasonBoxTotals } from "./types";

type Client = SupabaseClient<Database>;
type GameRow = Database["public"]["Tables"]["games"]["Row"];
type TeamRow = Database["public"]["Tables"]["teams"]["Row"];
type StatRow = Database["public"]["Tables"]["game_player_stats"]["Row"];
type PreseasonGameRow = Database["public"]["Tables"]["preseason_games"]["Row"];
type PreseasonStatRow = Database["public"]["Tables"]["preseason_player_stats"]["Row"];
type PreseasonTotalRow = Database["public"]["Tables"]["preseason_team_totals"]["Row"];

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
  const preseason = await fetchPreseasonGamesForDate(supabase, date);
  const teams = await fetchTeams(supabase, [...new Set([...games, ...preseason].flatMap((g) => [g.home_team_id, g.away_team_id]))]);
  return { status: "ok", date, games: [...games.map((g) => toSummary(g, teams)), ...preseason.map((g) => preseasonSummary(g, teams))] };
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
      overtimes: [],
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
  if (!game) return (await fetchPreseasonGameDetail(supabase, gameId)) ?? { status: "not_found" };

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
