import Link from "next/link";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { ARTICLE_DRAFT_STATUS_LABEL } from "@/lib/news/constants";
import { CreateDraftForm } from "./create-draft-form";
import { CreateOriginalForm } from "./create-original-form";
import { LINK_CLASS } from "@/app/admin/_components/action-ui";
import type { ArticleDraftStatus } from "@/lib/supabase/types";
import { RejectedDraftsSelector } from "./rejected-selector";

export const dynamic = "force-dynamic";

function formatDateTime(iso: string | null): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
    dateStyle: "short",
    timeStyle: "short",
  });
}

// 下書き一覧の状態での絞り込み(URL の ?status=)。「却下」では確認・選択だけができ、削除はできない
const STATUS_FILTERS: ArticleDraftStatus[] = ["pending_review", "approved", "published", "rejected"];

function isDraftStatus(v: string | undefined): v is ArticleDraftStatus {
  return STATUS_FILTERS.some((s) => s === v);
}

export default async function AdminNewsDraftsPage({ searchParams }: PageProps<"/admin/news/drafts">) {
  const { status: statusParam } = await searchParams;
  const statusValue = Array.isArray(statusParam) ? statusParam[0] : statusParam;
  const statusFilter = isDraftStatus(statusValue) ? statusValue : null;
  const supabase = createAdminSupabaseClient();

  const [{ data: drafts, error }, { data: events }] = await Promise.all([
    supabase
      .from("article_drafts")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase.from("news_events").select("id, headline_en").order("created_at", { ascending: false }),
  ]);

  const eventHeadlineById = new Map((events ?? []).map((e) => [e.id, e.headline_en]));
  const eventIdsWithDraft = new Set((drafts ?? []).flatMap((d) => (d.event_id ? [d.event_id] : [])));
  const eventsWithoutDraft = (events ?? []).filter((e) => !eventIdsWithDraft.has(e.id));
  const countByStatus = new Map<string, number>();
  for (const d of drafts ?? []) countByStatus.set(d.status, (countByStatus.get(d.status) ?? 0) + 1);
  const shownDrafts = statusFilter ? (drafts ?? []).filter((d) => d.status === statusFilter) : (drafts ?? []);
  const filterLinkClass = (active: boolean) =>
    `border px-3 py-1.5 text-xs font-bold ${active ? "border-blue bg-blue text-white" : "border-line text-foreground hover:border-blue"}`;

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
          <h2 className="mb-1 text-lg font-semibold">独自コラムを作成</h2>
          <p className="mb-3 text-xs text-muted">
            取得ニュース・イベントを使わずに、タイトルとカテゴリだけで下書きを作成します。
          </p>
          <CreateOriginalForm />
        </section>

        <section className="mb-8 border border-line bg-surface p-6">
          <h2 className="mb-3 text-lg font-semibold">イベントから下書きを作成</h2>
          {eventsWithoutDraft.length === 0 ? (
            <p className="text-sm text-muted">
              下書き未作成のイベントがありません。先に「イベント」画面でイベントを作成してください。
            </p>
          ) : (
            <CreateDraftForm events={eventsWithoutDraft} />
          )}
        </section>

        <section className="border border-line bg-surface p-6">
          <h2 className="mb-3 text-lg font-semibold">下書き一覧</h2>
          <nav aria-label="状態で絞り込み" className="mb-4 flex flex-wrap gap-2">
            <Link href="/admin/news/drafts" scroll={false} className={filterLinkClass(statusFilter === null)} aria-current={statusFilter === null ? "page" : undefined}>
              すべて（{(drafts ?? []).length}）
            </Link>
            {STATUS_FILTERS.map((s) => (
              <Link
                key={s}
                href={`/admin/news/drafts?status=${s}`}
                scroll={false}
                className={filterLinkClass(statusFilter === s)}
                aria-current={statusFilter === s ? "page" : undefined}
              >
                {ARTICLE_DRAFT_STATUS_LABEL[s]}（{countByStatus.get(s) ?? 0}）
              </Link>
            ))}
          </nav>
          {statusFilter === "rejected" ? (
            <RejectedDraftsSelector
              drafts={shownDrafts.map((d) => ({
                id: d.id,
                headline: d.headline_ja,
                createdAtLabel: formatDateTime(d.created_at),
                source: d.event_id ? "イベント" : "独自コラム",
              }))}
            />
          ) : (
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
                {shownDrafts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-muted">
                      {statusFilter ? "この状態の下書きはありません。" : "まだ下書きがありません。"}
                    </td>
                  </tr>
                ) : (
                  shownDrafts.map((draft) => (
                    <tr key={draft.id} className="border-b border-line/60">
                      <td className="max-w-[240px] px-3 py-2.5">
                        <Link href={`/admin/news/drafts/${draft.id}`} className={LINK_CLASS}>
                          {draft.headline_ja}
                        </Link>
                      </td>
                      <td className="px-3 py-2.5 text-muted">
                        {draft.event_id ? (eventHeadlineById.get(draft.event_id) ?? "-") : "独自コラム（イベントなし）"}
                      </td>
                      <td className="px-3 py-2.5 text-muted">
                        {draft.article_kind === "column" && (
                          <span className="mr-1.5 font-extrabold text-foreground">COLUMN</span>
                        )}
                        {draft.article_type}
                      </td>
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
          )}
        </section>
      </div>
    </div>
  );
}
