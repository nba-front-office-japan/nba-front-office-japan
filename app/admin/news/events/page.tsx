import Link from "next/link";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { CATEGORY_OPTIONS, VERIFICATION_STATUS_OPTIONS } from "@/lib/news/constants";

export const dynamic = "force-dynamic";

const CATEGORY_LABEL = Object.fromEntries(
  CATEGORY_OPTIONS.map((o) => [o.value, o.label])
);
const VERIFICATION_LABEL = Object.fromEntries(
  VERIFICATION_STATUS_OPTIONS.map((o) => [o.value, o.label])
);

export default async function AdminNewsEventsPage() {
  const supabase = createAdminSupabaseClient();

  const [{ data: events, error }, { data: eventSources }, { data: drafts }] =
    await Promise.all([
      supabase.from("news_events").select("*").order("created_at", { ascending: false }),
      supabase.from("news_event_sources").select("event_id"),
      supabase.from("article_drafts").select("event_id, status"),
    ]);

  const sourceCountByEvent = new Map<string, number>();
  for (const row of eventSources ?? []) {
    sourceCountByEvent.set(row.event_id, (sourceCountByEvent.get(row.event_id) ?? 0) + 1);
  }
  const draftByEvent = new Map((drafts ?? []).map((d) => [d.event_id, d.status]));

  return (
    <div className="px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">
          News Collector v1
        </p>
        <h1 className="mb-6 text-2xl font-semibold">イベント一覧</h1>

        {error && (
          <p className="mb-6 text-sm text-red-600 dark:text-red-400">
            取得に失敗しました: {error.message}
          </p>
        )}

        <div className="overflow-x-auto border border-line bg-surface">
          <table className="w-full min-w-[820px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-line text-left text-[11px] font-bold text-muted">
                <th className="px-3 py-2">見出し（内部・英語）</th>
                <th className="px-3 py-2">カテゴリ</th>
                <th className="px-3 py-2">検証状態</th>
                <th className="px-3 py-2">重要度</th>
                <th className="px-3 py-2">信頼度</th>
                <th className="px-3 py-2">ソース数</th>
                <th className="px-3 py-2">下書き</th>
              </tr>
            </thead>
            <tbody>
              {(events ?? []).length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-muted">
                    まだイベントがありません。RSS収集ジョブ画面から記事を選んで作成してください。
                  </td>
                </tr>
              ) : (
                (events ?? []).map((event) => (
                  <tr key={event.id} className="border-b border-line/60">
                    <td className="max-w-[280px] px-3 py-2.5">
                      <Link
                        href={`/admin/news/events/${event.id}`}
                        className="font-semibold text-blue hover:underline"
                      >
                        {event.headline_en}
                      </Link>
                    </td>
                    <td className="px-3 py-2.5 text-muted">
                      {CATEGORY_LABEL[event.category] ?? event.category}
                    </td>
                    <td className="px-3 py-2.5 text-muted">
                      {VERIFICATION_LABEL[event.verification_status] ??
                        event.verification_status}
                    </td>
                    <td className="px-3 py-2.5">{event.importance_score}</td>
                    <td className="px-3 py-2.5">{event.reliability_score}</td>
                    <td className="px-3 py-2.5">{sourceCountByEvent.get(event.id) ?? 0}</td>
                    <td className="px-3 py-2.5 text-muted">
                      {draftByEvent.get(event.id) ?? "未作成"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
