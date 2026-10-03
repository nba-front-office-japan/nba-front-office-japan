// 試合センター(/games)の日付の扱い。
// 試合は日本時間(Asia/Tokyo)の日付でまとめる(米国の夜の試合は、日本では翌日の朝〜昼になる)。
// 日付は "YYYY-MM-DD" の文字列で扱う。

const JST_OFFSET = "+09:00";

export type GameDayKey = "yesterday" | "today" | "tomorrow";

export const GAME_DAY_TABS: { key: GameDayKey; label: string; offset: number }[] = [
  { key: "yesterday", label: "前日", offset: -1 },
  { key: "today", label: "今日", offset: 0 },
  { key: "tomorrow", label: "翌日", offset: 1 },
];

export function isGameDayKey(value: unknown): value is GameDayKey {
  return value === "yesterday" || value === "today" || value === "tomorrow";
}

/** 日本時間での今日の日付 */
export function todayJst(now: Date = new Date()): string {
  // en-CA は YYYY-MM-DD 形式で出力される
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function isValidDateString(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

/** 日本時間のその日の0時〜翌日0時を、UTCのISO文字列で返す(開始を含み、終了を含まない) */
export function jstDayRangeUtc(date: string): { start: string; end: string } {
  const start = new Date(`${date}T00:00:00${JST_OFFSET}`);
  const end = new Date(`${addDays(date, 1)}T00:00:00${JST_OFFSET}`);
  return { start: start.toISOString(), end: end.toISOString() };
}

/** 例: 2026-10-03 → 10月3日(土) */
export function formatJstDateLabel(date: string): string {
  const d = new Date(`${date}T12:00:00${JST_OFFSET}`);
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    month: "numeric",
    day: "numeric",
    weekday: "short",
  }).format(d);
}

/** 試合開始時刻を日本時間の "HH:MM" で返す */
export function formatJstTime(iso: string): string {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

/** 試合開始日時から、日本時間の日付(YYYY-MM-DD)を返す */
export function jstDateOf(iso: string): string {
  return todayJst(new Date(iso));
}
