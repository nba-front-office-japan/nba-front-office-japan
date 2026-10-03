import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { isSourceDegraded } from "@/lib/news/health";
import { summarizeSourceRuns, toRunView } from "@/lib/news/job-log";
import { deriveProcessingStage } from "@/lib/news/processing-stage";
import { registerManualOfficialUrlAction } from "./actions";
import { CollectButton } from "./collect-button";
import { ItemsSelector, type SelectableNewsItem } from "./items-selector";
import type { Database } from "@/lib/supabase/types";

const ITEMS_FETCH_LIMIT = 500;
const JOB_LOG_LIMIT = 20;
const ERROR_PERIOD_DAYS = 7;
// vercel.json の /api/cron/news-collect("0 21 * * *")に合わせた説明。Hobbyプランでは最大59分ずれる
const AUTO_COLLECT_LABEL = "毎日1回（日本時間6時台）";

type JobRun = Database["public"]["Tables"]["news_collector_job_runs"]["Row"];

// 管理画面は常に最新のジョブログ・ソース状態を見せる必要があるため、
// 静的プリレンダリングさせず毎回サーバーで取得し直す。
export const dynamic = "force-dynamic";

function formatDateTime(iso: string | null): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
    dateStyle: "short",
    timeStyle: "short",
  });
}

const KIND_LABEL: Record<string, string> = {
  rss: "RSSフィード",
  x: "X",
  manual_official: "手動登録",
};

export default async function AdminNewsPage() {
  const supabase = createAdminSupabaseClient();

  const [{ data: sources, error: sourcesError }, { data: recentRuns }, { data: recentItems }] =
    await Promise.all([
      supabase.from("news_sources").select("*").order("kind").order("name"),
      supabase
        .from("news_collector_job_runs")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(60),
      supabase
        .from("news_items")
        .select("*")
        .order("fetched_at", { ascending: false })
        .limit(ITEMS_FETCH_LIMIT),
    ]);

  const sourceById = new Map((sources ?? []).map((s) => [s.id, s]));
  const rssSources = (sources ?? []).filter((s) => s.kind !== "manual_official");
  const manualSources = (sources ?? []).filter((s) => s.kind === "manual_official");
  const runViews = (recentRuns ?? []).map(toRunView);

  const runsBySource = new Map<string, JobRun[]>();
  for (const run of recentRuns ?? []) {
    const list = runsBySource.get(run.source_id) ?? [];
    list.push(run);
    runsBySource.set(run.source_id, list);
  }

  const itemIds = (recentItems ?? []).map((item) => item.id);
  const { data: eventSourceLinks } =
    itemIds.length > 0
      ? await supabase
          .from("news_event_sources")
          .select("news_item_id, event_id")
          .in("news_item_id", itemIds)
      : { data: [] };

  const eventIdByItemId = new Map(
    (eventSourceLinks ?? []).map((row) => [row.news_item_id, row.event_id])
  );
  const eventIds = [...new Set((eventSourceLinks ?? []).map((row) => row.event_id))];

  const [{ data: linkedEvents }, { data: linkedDrafts }] = await Promise.all([
    eventIds.length > 0
      ? supabase.from("news_events").select("id, headline_en").in("id", eventIds)
      : Promise.resolve({ data: [] }),
    eventIds.length > 0
      ? supabase.from("article_drafts").select("event_id, status").in("event_id", eventIds)
      : Promise.resolve({ data: [] }),
  ]);

  const eventHeadlineById = new Map((linkedEvents ?? []).map((e) => [e.id, e.headline_en]));
  const draftStatusByEventId = new Map(
    (linkedDrafts ?? []).map((d) => [d.event_id, d.status])
  );

  const itemsForSelector: SelectableNewsItem[] = (recentItems ?? []).map((item) => {
    const eventId = eventIdByItemId.get(item.id) ?? null;
    const draftStatus = eventId ? draftStatusByEventId.get(eventId) ?? null : null;
    return {
      id: item.id,
      title: item.title,
      canonicalUrl: item.canonical_url,
      authorName: item.author_name,
      publishedAtLabel: formatDateTime(item.published_at),
      fetchedAtLabel: formatDateTime(item.fetched_at),
      fetchedAt: item.fetched_at,
      sourceName: sourceById.get(item.source_id)?.name ?? "-",
      sourceReliability: sourceById.get(item.source_id)?.reliability_level ?? 50,
      status: item.status,
      stage: deriveProcessingStage(item.status, draftStatus),
      eventId,
      eventHeadline: eventId ? eventHeadlineById.get(eventId) ?? null : null,
    };
  });

  return (
    <div className="px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">
          News Collector
        </p>
        <h1 className="mb-6 text-2xl font-semibold">ニュース収集</h1>

        {sourcesError && (
          <p className="mb-6 text-sm text-red-600 dark:text-red-400">
            ソースの取得に失敗しました: {sourcesError.message}
          </p>
        )}

        <section className="mb-8 border border-line bg-surface p-6">
          <div className="mb-1 flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-lg font-semibold">収集ソース</h2>
            <CollectButton />
          </div>
          <p className="mb-4 text-xs text-muted">
            自動取得：{AUTO_COLLECT_LABEL}。必要なときは「今すぐRSSを収集」で手動でも取得できます。数字は直近の取得結果です。
          </p>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {rssSources.map((source) => {
              const runs = runsBySource.get(source.id) ?? [];
              const summary = summarizeSourceRuns(runs, ERROR_PERIOD_DAYS);
              const latest = summary.latest;
              const degraded = isSourceDegraded(runs);
              return (
                <div key={source.id} className="border border-line p-4">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <p className="font-bold">{source.name}</p>
                    {!source.is_active ? (
                      <span className="border border-line px-2 py-0.5 text-[11px] font-bold text-muted">停止中</span>
                    ) : degraded ? (
                      <span className="bg-[#fde8e8] px-2 py-0.5 text-[11px] font-extrabold text-[#b0392f] dark:bg-red-950 dark:text-red-300">
                        要確認（3回続けて失敗）
                      </span>
                    ) : (
                      <span className="bg-[#e9f7f1] px-2 py-0.5 text-[11px] font-extrabold text-[#186b4f] dark:bg-emerald-950 dark:text-emerald-200">
                        正常
                      </span>
                    )}
                  </div>
                  <p className="mb-3 text-xs text-muted">取得方法：{KIND_LABEL[source.kind] ?? source.kind}（記事のタイトル・URL・公開日時・要約）</p>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
                    <div className="col-span-2 sm:col-span-4">
                      <dt className="text-[11px] font-bold text-muted">最終取得日時</dt>
                      <dd className="font-semibold">{formatDateTime(source.last_polled_at)}</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] font-bold text-muted">取得件数</dt>
                      <dd className="font-semibold tabular-nums">{latest ? `${latest.found}件` : "-"}</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] font-bold text-muted">新規追加</dt>
                      <dd className="font-semibold tabular-nums">{latest ? `${latest.inserted}件` : "-"}</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] font-bold text-muted">重複で除外</dt>
                      <dd className="font-semibold tabular-nums">{latest?.duplicates != null ? `${latest.duplicates}件` : "-"}</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] font-bold text-muted">エラー（{summary.periodDays}日間）</dt>
                      <dd className={`font-semibold tabular-nums ${summary.periodErrors > 0 ? "text-[#cf4a51]" : ""}`}>
                        {summary.periodErrors}件
                      </dd>
                    </div>
                  </dl>
                  {summary.latestError && (
                    <p className="mt-2 text-xs text-[#cf4a51]">
                      最後のエラー（{formatDateTime(summary.latestError.at)}）：{summary.latestError.message}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
          {manualSources.length > 0 && (
            <p className="mt-3 text-xs text-muted">
              ほかに「{manualSources.map((s) => s.name).join("・")}」（下の手動登録で使うソース。自動取得はしません）があります。
            </p>
          )}
        </section>

        <section className="mb-8 border border-line bg-surface p-6">
          <h2 className="mb-1 text-lg font-semibold">直近の取得履歴</h2>
          <p className="mb-4 text-xs text-muted">
            直近{JOB_LOG_LIMIT}回分。「重複で除外」は、すでに取得済みだったため追加しなかった件数です（失敗した回は途中で止まるため表示しません）。
          </p>
          <p className="mb-2 text-xs text-muted sm:hidden">→ 横にスクロールできます</p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-line text-left text-[11px] font-bold text-muted">
                  <th className="px-3 py-2">取得日時</th>
                  <th className="px-3 py-2">ソース</th>
                  <th className="px-3 py-2">結果</th>
                  <th className="px-3 py-2 text-right">取得</th>
                  <th className="px-3 py-2 text-right">新規追加</th>
                  <th className="px-3 py-2 text-right">重複で除外</th>
                  <th className="px-3 py-2">エラー内容</th>
                </tr>
              </thead>
              <tbody>
                {runViews.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-6 text-center text-muted">
                      まだ取得履歴がありません。
                    </td>
                  </tr>
                ) : (
                  runViews.slice(0, JOB_LOG_LIMIT).map((run) => (
                    <tr key={run.id} className="border-b border-line/60">
                      <td className="whitespace-nowrap px-3 py-2.5 text-muted">{formatDateTime(run.startedAt)}</td>
                      <td className="px-3 py-2.5 font-semibold">{sourceById.get(run.sourceId)?.name ?? "-"}</td>
                      <td className="px-3 py-2.5">
                        {run.success ? <span className="text-[#218c68]">成功</span> : <span className="font-bold text-[#cf4a51]">失敗</span>}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{run.found}件</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{run.inserted}件</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-muted">{run.duplicates != null ? `${run.duplicates}件` : "-"}</td>
                      <td className="px-3 py-2.5 text-[#cf4a51]">{run.error ?? ""}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-8 border border-line bg-surface p-6">
          <h2 className="mb-4 text-lg font-semibold">公式URLの手動登録</h2>
          <form action={registerManualOfficialUrlAction} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-[11px] font-bold text-muted">
              URL（必須）
              <input
                type="url"
                name="url"
                required
                className="border border-line bg-surface px-3 py-2 text-sm text-foreground"
                placeholder="https://www.nba.com/..."
              />
            </label>
            <label className="grid gap-1 text-[11px] font-bold text-muted">
              タイトル（必須）
              <input
                type="text"
                name="title"
                required
                className="border border-line bg-surface px-3 py-2 text-sm text-foreground"
              />
            </label>
            <label className="grid gap-1 text-[11px] font-bold text-muted">
              発表元（例: NBA公式 / Los Angeles Lakers）
              <input
                type="text"
                name="authorName"
                className="border border-line bg-surface px-3 py-2 text-sm text-foreground"
              />
            </label>
            <label className="grid gap-1 text-[11px] font-bold text-muted">
              公開日時
              <input
                type="datetime-local"
                name="publishedAt"
                className="border border-line bg-surface px-3 py-2 text-sm text-foreground"
              />
            </label>
            <label className="grid gap-1 text-[11px] font-bold text-muted sm:col-span-2">
              要約（任意・短く）
              <textarea
                name="summary"
                rows={2}
                className="border border-line bg-surface px-3 py-2 text-sm text-foreground"
              />
            </label>
            <div className="sm:col-span-2">
              <button
                type="submit"
                className="bg-blue px-4 py-2 text-sm font-bold text-white"
              >
                登録
              </button>
            </div>
          </form>
        </section>

        <section className="border border-line bg-surface p-6">
          <h2 className="mb-1 text-lg font-semibold">最近取得したニュース</h2>
          <p className="mb-4 text-xs text-muted">
            直近{ITEMS_FETCH_LIMIT}件を表示しています。同じ出来事を報じている記事を選んでイベントを作成するほか、選んだ記事を「非掲載」（この一覧とイベント作成の対象から外す）や「完全に削除」にできます。
            収集したニュースは公開ページの一覧には出ず、公開記事の出典としてだけ表示されます。そのため、イベントで使われている記事は非掲載・削除の対象外です。
          </p>
          <ItemsSelector items={itemsForSelector} />
        </section>
      </div>
    </div>
  );
}
