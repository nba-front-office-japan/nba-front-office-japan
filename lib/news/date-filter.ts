// 管理画面「最近取得したニュース」の取得日フィルター(サーバー・クライアント共通)。

export type DateFilter = "all" | "today" | "7days" | "30days" | "custom";

/** 取得日フィルターの初期値。URL の ?date=(all / today / 7days / 30days / custom と ?from= ?to=)があればそれ、なければ「今日」 */
export type InitialDateFilter = { filter: DateFilter; from: string; to: string };

export function parseInitialDateFilter(date: string | undefined, from: string | undefined, to: string | undefined): InitialDateFilter {
  const valid = ["all", "today", "7days", "30days", "custom"] as const;
  const filter = valid.find((v) => v === date) ?? "today";
  const ymd = (v: string | undefined) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : "");
  return { filter, from: filter === "custom" ? ymd(from) : "", to: filter === "custom" ? ymd(to) : "" };
}
