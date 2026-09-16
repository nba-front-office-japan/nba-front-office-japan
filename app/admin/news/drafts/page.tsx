import Link from "next/link";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { ARTICLE_DRAFT_STATUS_LABEL } from "@/lib/news/constants";
import { createDraftAction } from "./actions";

export const dynamic = "force-dynamic";

function formatDateTime(iso: string | null): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
    dateStyle: "short",
    timeStyle: "short",
  });
}

export default async function AdminNewsDraftsPage() {
  const supabase = createAdminSupabaseClient();

  const [{ data: drafts, error }, { data: events }] = await Promise.all([
    supabase
      .from("article_drafts")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase.from("news_events").select("id, headline_en").order("created_at", { ascending: false }),
  ]);

  const eventHeadlineById = new Map((events ?? []).map((e) => [e.id, e.headline_en]));
  const eventIdsWithDraft = new Set((drafts ?? []).map((d) => d.event_id));
  const eventsWithoutDraft = (events ?? []).filter((e) => !eventIdsWithDraft.has(e.id));

  return (
    <div className="px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">
          News Collector v1
        </p>
        <h1 className="mb-6 text-2xl font-semibold">記事下書き</h1>

        {error && (
          <p className="mb-6 text-sm text-red-600 dark:text-red-400">
            取得に失敗しました: {error.message}
          </p>
        )}

        <section className="mb-8 border border-line bg-surface p-6">
          <h2 className="mb-3 text-lg font-semibold">新規下書きを作成</h2>
          {eventsWithoutDraft.length === 0 ? (
            <p className="text-sm text-muted">
              下書き未作成のイベントがありません。先に「イベント」画面でイベントを作成してください。
            </p>
          ) : (
            <form action={createDraftAction} className="flex flex-wrap items-end gap-3">
              <label className="grid gap-1 text-[11px] font-bold text-muted">
                イベント
                <select
                  name="eventId"
                  required
                  className="min-w-[280px] border border-line bg-surface px-3 py-2 text-sm text-foreground"
                >
                  {eventsWithoutDraft.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.headline_en}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="submit"
                className="bg-blue px-4 py-2 text-sm font-bold text-white"
              >
                下書きを作成
              </button>
            </form>
          )}
        </section>

        <section className="border border-line bg-surface p-6">
          <h2 className="mb-4 text-lg font-semibold">下書き一覧</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-line text-left text-[11px] font-bold text-muted">
                  <th className="px-3 py-2">見出し</th>
                  <th className="px-3 py-2">イベント</th>
                  <th className="px-3 py-2">種別</th>
                  <th className="px-3 py-2">状態</th>
                  <th className="px-3 py-2">更新日時</th>
                </tr>
              </thead>
              <tbody>
                {(drafts ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-muted">
                      まだ下書きがありません。
                    </td>
                  </tr>
                ) : (
                  (drafts ?? []).map((draft) => (
                    <tr key={draft.id} className="border-b border-line/60">
                      <td className="max-w-[240px] px-3 py-2.5">
                        <Link
                          href={`/admin/news/drafts/${draft.id}`}
                          className="font-semibold text-blue hover:underline"
                        >
                          {draft.headline_ja}
                        </Link>
                      </td>
                      <td className="px-3 py-2.5 text-muted">
                        {eventHeadlineById.get(draft.event_id) ?? "-"}
                      </td>
                      <td className="px-3 py-2.5 text-muted">{draft.article_type}</td>
                      <td className="px-3 py-2.5">
                        {ARTICLE_DRAFT_STATUS_LABEL[draft.status]}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-muted">
                        {formatDateTime(draft.updated_at)}
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
