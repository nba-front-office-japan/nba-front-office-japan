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
  /** プレシーズンの試合(管理画面のExcelから取り込んだもの)。開始時刻はなく、個人成績は PreseasonBox で持つ */
  preseason: boolean;
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

/** プレシーズンの個人成績の1行(選手名は出典の表記のまま。選手ページへのリンクは付けない) */
export type PreseasonBoxRow = {
  playerName: string;
  position: string | null;
  played: boolean;
  minutes: number | null;
  pts: number | null;
  fgm: number | null;
  fga: number | null;
  fg3m: number | null;
  fg3a: number | null;
  ftm: number | null;
  fta: number | null;
  reb: number | null;
  ast: number | null;
  stl: number | null;
  blk: number | null;
  tov: number | null;
  pf: number | null;
};

/** プレシーズンのチーム合計(Team Totals の Total 行と 成功率 行) */
export type PreseasonBoxTotals = Omit<PreseasonBoxRow, "playerName" | "position" | "played" | "minutes"> & {
  fgPct: string | null;
  fg3Pct: string | null;
  ftPct: string | null;
};

export type PreseasonBox = {
  away: PreseasonBoxRow[];
  home: PreseasonBoxRow[];
  awayTotals: PreseasonBoxTotals | null;
  homeTotals: PreseasonBoxTotals | null;
};

export type GameDetail = {
  game: GameSummary;
  homePlayers: BoxScoreRow[];
  /** プレシーズンの試合だけ。あれば homePlayers / awayPlayers の代わりにこちらで表示する */
  preseason?: PreseasonBox;
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
