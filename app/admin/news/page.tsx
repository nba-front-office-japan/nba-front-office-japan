import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { isSourceDegraded } from "@/lib/news/health";
import { triggerCollectAction, registerManualOfficialUrlAction } from "./actions";
import type { Database } from "@/lib/supabase/types";

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
  rss: "RSS",
  x: "X",
  manual_official: "手動公式登録",
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
        .limit(30),
    ]);

  const sourceById = new Map((sources ?? []).map((s) => [s.id, s]));

  const runsBySource = new Map<string, JobRun[]>();
  for (const run of recentRuns ?? []) {
    const list = runsBySource.get(run.source_id) ?? [];
    list.push(run);
    runsBySource.set(run.source_id, list);
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-8">
      <div className="mx-auto max-w-5xl">
        <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">
          News Collector v1 · Phase B
        </p>
        <h1 className="mb-6 text-2xl font-semibold">管理画面</h1>

        {sourcesError && (
          <p className="mb-6 text-sm text-red-600 dark:text-red-400">
            ソースの取得に失敗しました: {sourcesError.message}
          </p>
        )}

        <section className="mb-8 border border-line bg-surface p-6">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold">収集ソース</h2>
            <form action={triggerCollectAction}>
              <button
                type="submit"
                className="bg-blue px-4 py-2 text-sm font-bold text-white"
              >
                今すぐRSSを収集
              </button>
            </form>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-line text-left text-[11px] font-bold text-muted">
                  <th className="px-3 py-2">名前</th>
                  <th className="px-3 py-2">種別</th>
                  <th className="px-3 py-2">状態</th>
                  <th className="px-3 py-2">直近ポーリング</th>
                  <th className="px-3 py-2">健全性</th>
                </tr>
              </thead>
              <tbody>
                {(sources ?? []).map((source) => {
                  const runs = runsBySource.get(source.id) ?? [];
                  const degraded = isSourceDegraded(runs);
                  return (
                    <tr key={source.id} className="border-b border-line/60">
                      <td className="px-3 py-2.5 font-semibold">{source.name}</td>
                      <td className="px-3 py-2.5 text-muted">
                        {KIND_LABEL[source.kind] ?? source.kind}
                      </td>
                      <td className="px-3 py-2.5">
                        {source.is_active ? "有効" : "無効"}
                      </td>
                      <td className="px-3 py-2.5 text-muted">
                        {formatDateTime(source.last_polled_at)}
                      </td>
                      <td className="px-3 py-2.5">
                        {source.kind === "manual_official" ? (
                          "-"
                        ) : degraded ? (
                          <span className="bg-[#fde8e8] px-2 py-1 text-[11px] font-extrabold text-[#b0392f] dark:bg-red-950 dark:text-red-300">
                            degraded（3回連続失敗）
                          </span>
                        ) : (
                          <span className="text-[#218c68]">正常</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-8 border border-line bg-surface p-6">
          <h2 className="mb-4 text-lg font-semibold">直近のジョブログ</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-line text-left text-[11px] font-bold text-muted">
                  <th className="px-3 py-2">実行日時</th>
                  <th className="px-3 py-2">ソース</th>
                  <th className="px-3 py-2">結果</th>
                  <th className="px-3 py-2">HTTP</th>
                  <th className="px-3 py-2">取得/登録</th>
                  <th className="px-3 py-2">エラー</th>
                </tr>
              </thead>
              <tbody>
                {(recentRuns ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-6 text-center text-muted">
                      まだ実行履歴がありません。
                    </td>
                  </tr>
                ) : (
                  (recentRuns ?? []).slice(0, 20).map((run) => (
                    <tr key={run.id} className="border-b border-line/60">
                      <td className="whitespace-nowrap px-3 py-2.5 text-muted">
                        {formatDateTime(run.started_at)}
                      </td>
                      <td className="px-3 py-2.5 font-semibold">
                        {sourceById.get(run.source_id)?.name ?? "-"}
                      </td>
                      <td className="px-3 py-2.5">
                        {run.is_success ? (
                          <span className="text-[#218c68]">成功</span>
                        ) : (
                          <span className="text-[#cf4a51]">失敗</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-muted">{run.http_status ?? "-"}</td>
                      <td className="px-3 py-2.5 text-muted">
                        {run.items_found ?? 0} / {run.items_inserted ?? 0}
                      </td>
                      <td className="px-3 py-2.5 text-[#cf4a51]">
                        {run.error_message ?? "-"}
                      </td>
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
          <h2 className="mb-4 text-lg font-semibold">最近取得したニュース</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-line text-left text-[11px] font-bold text-muted">
                  <th className="px-3 py-2">タイトル</th>
                  <th className="px-3 py-2">ソース</th>
                  <th className="px-3 py-2">著者</th>
                  <th className="px-3 py-2">公開日時</th>
                  <th className="px-3 py-2">取得日時</th>
                </tr>
              </thead>
              <tbody>
                {(recentItems ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-muted">
                      まだ取得したニュースがありません。
                    </td>
                  </tr>
                ) : (
                  (recentItems ?? []).map((item) => (
                    <tr key={item.id} className="border-b border-line/60">
                      <td className="max-w-[320px] px-3 py-2.5">
                        <a
                          href={item.canonical_url}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="font-semibold text-blue hover:underline"
                        >
                          {item.title}
                        </a>
                      </td>
                      <td className="px-3 py-2.5 text-muted">
                        {sourceById.get(item.source_id)?.name ?? "-"}
                      </td>
                      <td className="px-3 py-2.5 text-muted">{item.author_name ?? "-"}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-muted">
                        {formatDateTime(item.published_at)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-muted">
                        {formatDateTime(item.fetched_at)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
