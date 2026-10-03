// 試合センターのAPI(/api/games, /api/games/[gameId])が返すデータの形。
// サーバーとクライアントの両方から使うため、server-only にはしない。

import type { GameStatus } from "@/lib/supabase/types";

export type GameTeamLine = {
  teamId: string;
  abbreviation: string;
  name: string;
  city: string;
  score: number | null;
  /** 1Q〜4Qの得点(未実施はnull) */
  quarters: (number | null)[];
  /** 延長の得点(延長1回目から順) */
  overtimes: number[];
};

export type GameSummary = {
  id: string;
  jstDate: string | null;
  tipoffAt: string | null;
  status: GameStatus;
  statusDetail: string | null;
  period: number | null;
  postseason: boolean;
  home: GameTeamLine;
  away: GameTeamLine;
};

export type BoxScoreRow = {
  playerId: string | null;
  playerName: string;
  secondsPlayed: number;
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  fgm: number;
  fga: number;
  fg3m: number;
  fg3a: number;
  ftm: number;
  fta: number;
  plusMinus: number | null;
};

export type GameDetail = {
  game: GameSummary;
  homePlayers: BoxScoreRow[];
  awayPlayers: BoxScoreRow[];
};

/** データ未準備(テーブル未作成・データなし)と、取得成功を区別して返す */
export type GamesResponse =
  | { status: "ok"; date: string; games: GameSummary[] }
  | { status: "not_ready"; date: string };

export type GameDetailResponse =
  | { status: "ok"; detail: GameDetail }
  | { status: "not_ready" }
  | { status: "not_found" };

export const GAME_STATUS_LABEL: Record<GameStatus, string> = {
  scheduled: "試合前",
  in_progress: "試合中",
  final: "試合終了",
  postponed: "延期",
};

/** 延長の合計得点(延長なしはnull) */
export function overtimeTotal(line: GameTeamLine): number | null {
  return line.overtimes.length > 0 ? line.overtimes.reduce((a, b) => a + b, 0) : null;
}

/** 出場時間(秒)を "MM:SS" で表す */
export function formatMinutes(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
