import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import {
  CATEGORY_OPTIONS,
  VERIFICATION_STATUS_OPTIONS,
  isLowConfidence,
} from "@/lib/news/constants";
import {
  updateEventAction,
  updateSourceItemAction,
  createDraftFromEventAction,
} from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminNewsEventDetailPage({
  params,
}: PageProps<"/admin/news/events/[eventId]">) {
  const { eventId } = await params;
  const supabase = createAdminSupabaseClient();

  const { data: event, error: eventError } = await supabase
    .from("news_events")
    .select("*")
    .eq("id", eventId)
    .single();

  if (eventError || !event) {
    notFound();
  }

  const { data: eventSources } = await supabase
    .from("news_event_sources")
    .select("news_item_id, relation")
    .eq("event_id", eventId);

  const itemIds = (eventSources ?? []).map((s) => s.news_item_id);
  const { data: items } =
    itemIds.length > 0
      ? await supabase.from("news_items").select("*").in("id", itemIds)
      : { data: [] };

  const sourceIds = [...new Set((items ?? []).map((i) => i.source_id))];
  const { data: sources } =
    sourceIds.length > 0
      ? await supabase.from("news_sources").select("id, name").in("id", sourceIds)
      : { data: [] };
  const sourceNameById = new Map((sources ?? []).map((s) => [s.id, s.name]));

  const { data: draft } = await supabase
    .from("article_drafts")
    .select("id, status")
    .eq("event_id", eventId)
    .maybeSingle();

  const relationByItemId = new Map(
    (eventSources ?? []).map((s) => [s.news_item_id, s.relation])
  );

  return (
    <div className="px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <Link href="/admin/news/events" className="mb-4 inline-block text-sm text-blue">
          ← イベント一覧に戻る
        </Link>
        <h1 className="mb-6 text-2xl font-semibold">イベント詳細</h1>

        {isLowConfidence(event.verification_status, event.reliability_score) && (
          <p className="mb-4 border border-[#f3b83f] bg-[#fff8e8] px-4 py-3 text-sm font-bold text-[#8a5a00] dark:bg-white/[.06]">
            未確定情報（rumor/unverified、または信頼度70未満）。事実確認が取れるまで公開時は注意してください。
          </p>
        )}

        <section className="mb-8 border border-line bg-surface p-6">
          <h2 className="mb-4 text-lg font-semibold">イベント情報</h2>
          <form
            action={updateEventAction}
            className="grid grid-cols-1 gap-3 sm:grid-cols-2"
          >
            <input type="hidden" name="eventId" value={event.id} />
            <label className="grid gap-1 text-[11px] font-bold text-muted sm:col-span-2">
              内部見出し（英語）
              <input
                type="text"
                name="headlineEn"
                defaultValue={event.headline_en}
                required
                className="border border-line bg-surface px-3 py-2 text-sm text-foreground"
              />
            </label>
            <label className="grid gap-1 text-[11px] font-bold text-muted">
              カテゴリ
              <select
                name="category"
                defaultValue={event.category}
                className="border border-line bg-surface px-3 py-2 text-sm text-foreground"
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-[11px] font-bold text-muted">
              検証状態
              <select
                name="verificationStatus"
                defaultValue={event.verification_status}
                className="border border-line bg-surface px-3 py-2 text-sm text-foreground"
              >
                {VERIFICATION_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-[11px] font-bold text-muted">
              重要度（0-100）
              <input
                type="number"
                name="importanceScore"
                min={0}
                max={100}
                defaultValue={event.importance_score}
                className="border border-line bg-surface px-3 py-2 text-sm text-foreground"
              />
            </label>
            <label className="grid gap-1 text-[11px] font-bold text-muted">
              信頼度（0-100）
              <input
                type="number"
                name="reliabilityScore"
                min={0}
                max={100}
                defaultValue={event.reliability_score}
                className="border border-line bg-surface px-3 py-2 text-sm text-foreground"
              />
            </label>
            <div className="sm:col-span-2">
              <button
                type="submit"
                className="bg-blue px-4 py-2 text-sm font-bold text-white"
              >
                保存
              </button>
            </div>
          </form>
        </section>

        <section className="mb-8 border border-line bg-surface p-6">
          <h2 className="mb-4 text-lg font-semibold">原典ソース（{(items ?? []).length}件）</h2>
          <div className="space-y-4">
            {(items ?? []).map((item) => (
              <form
                key={item.id}
                action={updateSourceItemAction}
                className="grid grid-cols-1 gap-2 border border-line p-4 sm:grid-cols-2"
              >
                <input type="hidden" name="itemId" value={item.id} />
                <input type="hidden" name="eventId" value={event.id} />
                <p className="text-[11px] font-bold text-muted sm:col-span-2">
                  {relationByItemId.get(item.id) === "primary" ? "主要ソース" : "確認ソース"}
                </p>
                <label className="grid gap-1 text-[11px] font-bold text-muted sm:col-span-2">
                  タイトル
                  <input
                    type="text"
                    name="title"
                    defaultValue={item.title}
                    required
                    className="border border-line bg-surface px-3 py-2 text-sm text-foreground"
                  />
                </label>
                <label className="grid gap-1 text-[11px] font-bold text-muted sm:col-span-2">
                  原典URL
                  <input
                    type="url"
                    name="url"
                    defaultValue={item.canonical_url}
                    required
                    className="border border-line bg-surface px-3 py-2 text-sm text-foreground"
                  />
                </label>
                <label className="grid gap-1 text-[11px] font-bold text-muted">
                  媒体名・発表元
                  <input
                    type="text"
                    name="authorName"
                    defaultValue={item.author_name ?? sourceNameById.get(item.source_id) ?? ""}
                    className="border border-line bg-surface px-3 py-2 text-sm text-foreground"
                  />
                </label>
                <div className="flex items-end">
                  <button
                    type="submit"
                    className="border border-line bg-surface px-4 py-2 text-sm font-bold hover:bg-[#f6f9ff]"
                  >
                    このソースを保存
                  </button>
                </div>
              </form>
            ))}
          </div>
        </section>

        <section className="border border-line bg-surface p-6">
          <h2 className="mb-4 text-lg font-semibold">記事下書き</h2>
          {draft ? (
            <Link
              href={`/admin/news/drafts/${draft.id}`}
              className="inline-block bg-blue px-4 py-2 text-sm font-bold text-white"
            >
              下書きを編集する（状態: {draft.status}）
            </Link>
          ) : (
            <form action={createDraftFromEventAction}>
              <input type="hidden" name="eventId" value={event.id} />
              <button
                type="submit"
                className="bg-blue px-4 py-2 text-sm font-bold text-white"
              >
                下書きを作成する
              </button>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}
