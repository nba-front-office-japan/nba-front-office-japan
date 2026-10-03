// 管理画面のジョブログを、日常運用で読みやすい形にするための変換。
// ・技術的なエラー文をそのまま見せず、短い日本語の説明にする
// ・重複として除外した件数は「取得件数 − 新規追加件数」で求める
//   (収集処理は、同じ記事がすでに保存済みの場合に登録しないため。失敗した回は途中で止まるので求めない)

import type { Database } from "@/lib/supabase/types";

type JobRun = Database["public"]["Tables"]["news_collector_job_runs"]["Row"];

/** エラー内容を短い日本語にする */
export function friendlyErrorMessage(message: string | null, httpStatus: number | null): string {
  const m = message ?? "";
  if (httpStatus === 403 || /HTTPエラー: 403/.test(m)) return "取得先にアクセスを拒否されました（403）";
  if (httpStatus === 404 || /HTTPエラー: 404/.test(m)) return "フィードが見つかりません（404）";
  if (httpStatus === 429 || /HTTPエラー: 429/.test(m)) return "取得の回数が多すぎると断られました（429）";
  if ((httpStatus && httpStatus >= 500) || /HTTPエラー: 5\d\d/.test(m)) return `取得先のサーバーでエラーが起きました（${httpStatus ?? "5xx"}）`;
  if (/HTTPエラー: (\d+)/.test(m)) return `取得に失敗しました（${/HTTPエラー: (\d+)/.exec(m)?.[1]}）`;
  if (/abort|timeout|timed out/i.test(m)) return "取得先から応答がありません（タイムアウト）";
  if (/fetch failed|ENOTFOUND|ECONNREFUSED|ECONNRESET|network/i.test(m)) return "取得先に接続できませんでした";
  if (/news_items保存エラー/.test(m)) return "取得した記事の保存に失敗しました";
  if (/feed_url/.test(m)) return "フィードのURLが設定されていません";
  if (/xml|parse|rss/i.test(m)) return "フィードの内容を読み取れませんでした";
  if (m === "") return "原因不明のエラー";
  return m.length > 40 ? `${m.slice(0, 40)}…` : m;
}

export type RunView = {
  id: string;
  startedAt: string;
  sourceId: string;
  success: boolean;
  found: number;
  inserted: number;
  /** 重複として除外した件数。失敗した回はnull */
  duplicates: number | null;
  error: string | null;
};

export function toRunView(run: JobRun): RunView {
  const found = run.items_found ?? 0;
  const inserted = run.items_inserted ?? 0;
  return {
    id: run.id,
    startedAt: run.started_at,
    sourceId: run.source_id,
    success: run.is_success,
    found,
    inserted,
    duplicates: run.is_success ? Math.max(found - inserted, 0) : null,
    error: run.is_success ? null : friendlyErrorMessage(run.error_message, run.http_status),
  };
}

export type SourceRunSummary = {
  /** 最後に取得を試みた回 */
  latest: RunView | null;
  /** 直近 days 日間の集計 */
  periodDays: number;
  periodRuns: number;
  periodErrors: number;
  /** 直近 days 日間で最後のエラー内容 */
  latestError: { at: string; message: string } | null;
};

/** ソースごとの集計。runs は started_at の新しい順で渡す */
export function summarizeSourceRuns(runsDesc: JobRun[], days = 7, now: Date = new Date()): SourceRunSummary {
  const since = now.getTime() - days * 86400_000;
  const views = runsDesc.map(toRunView);
  const inPeriod = views.filter((r) => new Date(r.startedAt).getTime() >= since);
  const errors = inPeriod.filter((r) => !r.success);
  return {
    latest: views[0] ?? null,
    periodDays: days,
    periodRuns: inPeriod.length,
    periodErrors: errors.length,
    latestError: errors[0] ? { at: errors[0].startedAt, message: errors[0].error ?? "原因不明のエラー" } : null,
  };
}
