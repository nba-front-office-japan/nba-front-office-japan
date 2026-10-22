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
  /** 個人成績(ボックススコア)が登録されているか。一覧の「ボックススコアを表示」を出すかどうかに使う */
  hasBoxScore?: boolean;
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
  /** オフェンス・ディフェンス・合計リバウンド(Excel の「O-D-合計」) */
  oreb: number | null;
  dreb: number | null;
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

/** ボックススコア(新書式Excelから取り込み)の個人成績の1行。DNP など空欄の項目は null */
export type FullBoxRow = {
  playerId: string | null;
  playerName: string;
  role: "starter" | "bench" | "dnp";
  dnpReason: string | null;
  secondsPlayed: number | null;
  fgm: number | null;
  fga: number | null;
  fg3m: number | null;
  fg3a: number | null;
  ftm: number | null;
  fta: number | null;
  oreb: number | null;
  dreb: number | null;
  reb: number | null;
  ast: number | null;
  stl: number | null;
  blk: number | null;
  tov: number | null;
  pf: number | null;
  pts: number | null;
  plusMinus: number | null;
};

export type FullBoxTotals = Omit<FullBoxRow, "playerId" | "playerName" | "role" | "dnpReason" | "secondsPlayed" | "plusMinus">;

export type FullBox = {
  away: FullBoxRow[];
  home: FullBoxRow[];
  awayTotals: FullBoxTotals | null;
  homeTotals: FullBoxTotals | null;
  sourceUrl: string | null;
};

export type GameDetail = {
  game: GameSummary;
  homePlayers: BoxScoreRow[];
  /** プレシーズンの試合だけ。あれば homePlayers / awayPlayers の代わりにこちらで表示する */
  preseason?: PreseasonBox;
  /** ボックススコア(新書式Excel)がある試合だけ。あればこちらを優先して表示する */
  full?: FullBox;
  awayPlayers: BoxScoreRow[];
};

/**
 * 日付ごとのデータの入力状況(結果・対戦カードは含まない)。
 * total: 試合数 / results: 試合結果(最終スコア)が保存済み / boxScores: 個人成績が保存済み / upcoming: 試合前(まだ始まっていない)
 */
export type GameDayStatus = { total: number; results: number; boxScores: number; upcoming: number };

/** 入力状況の区分。complete: すべて入力済み / partial: 一部入力済み / none: 未入力 / scheduled: すべて試合前(予定) */
export type GameDayLevel = "complete" | "partial" | "none" | "scheduled";

export function gameDayLevel(s: GameDayStatus): GameDayLevel {
  if (s.total > 0 && s.upcoming === s.total) return "scheduled";
  if (s.results === s.total && s.boxScores === s.total) return "complete";
  if (s.results === 0 && s.boxScores === 0) return "none";
  return "partial";
}

/** 入力状況の表示文(例: 全11試合・結果/ボックススコア入力済み、結果 8/11試合・ボックススコア 6/11試合入力済み) */
export function gameDayStatusText(s: GameDayStatus): string {
  const level = gameDayLevel(s);
  if (level === "scheduled") return `予定 ${s.total}試合（試合前）`;
  if (level === "complete") return `全${s.total}試合・結果／ボックススコア入力済み`;
  const pending = s.upcoming > 0 ? `・予定 ${s.upcoming}試合` : "";
  if (level === "none") return s.upcoming > 0 ? `未入力 ${s.total - s.upcoming}試合${pending}` : `未入力（${s.total}試合）`;
  return `結果 ${s.results}/${s.total}試合・ボックススコア ${s.boxScores}/${s.total}試合入力済み${pending}`;
}

/** 試合カレンダーの、日本時間の日付ごとの試合数と入力状況(結果・対戦カードは含まない) */
export type GameCalendarResponse = { month: string; counts: Record<string, number>; statuses: Record<string, GameDayStatus> };

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
