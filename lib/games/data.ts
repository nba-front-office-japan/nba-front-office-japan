// 試合センターのデータ取得(サーバー専用)。
// games / game_player_stats テーブル(supabase/migrations/20261003000000_games.sql)から読む。
// テーブルが未作成の場合は「データ準備中」として扱い、画面を壊さない。

import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { jstDateOf, jstDayRangeUtc } from "./date";
import type { BoxScoreRow, GameDetailResponse, GameSummary, GameTeamLine, GamesResponse } from "./types";

type Client = SupabaseClient<Database>;
type GameRow = Database["public"]["Tables"]["games"]["Row"];
type TeamRow = Database["public"]["Tables"]["teams"]["Row"];
type StatRow = Database["public"]["Tables"]["game_player_stats"]["Row"];

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
  const teams = await fetchTeams(supabase, [...new Set(games.flatMap((g) => [g.home_team_id, g.away_team_id]))]);
  return { status: "ok", date, games: games.map((g) => toSummary(g, teams)) };
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
  if (!game) return { status: "not_found" };

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
