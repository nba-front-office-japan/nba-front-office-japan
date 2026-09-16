import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { CATEGORY_OPTIONS, VERIFICATION_STATUS_OPTIONS, isLowConfidence } from "@/lib/news/constants";
import { buildArticlePrompt } from "@/lib/news/prompt";
import { LINK_CLASS } from "@/app/admin/_components/action-ui";
import { EventInfoForm, SourceItemForm, CreateDraftButton } from "./event-forms";
import { PromptGenerator } from "./prompt-generator";

export const dynamic = "force-dynamic";

export default async function AdminNewsEventDetailPage({
  params,
  searchParams,
}: PageProps<"/admin/news/events/[eventId]">) {
  const { eventId } = await params;
  const { created } = await searchParams;
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
        <Link href="/admin/news/events" className={`mb-4 inline-block text-sm ${LINK_CLASS}`}>
          ← イベント一覧に戻る
        </Link>
        <h1 className="mb-6 text-2xl font-semibold">イベント詳細</h1>

        {created === "1" && (
          <p
            role="status"
            aria-live="polite"
            className="mb-4 border border-[#218c68] bg-[#e9f7f1] px-4 py-3 text-sm font-bold text-[#186b4f] dark:bg-white/[.06]"
          >
            イベントを作成しました
          </p>
        )}

        {isLowConfidence(event.verification_status, event.reliability_score) && (
          <p className="mb-4 border border-[#f3b83f] bg-[#fff8e8] px-4 py-3 text-sm font-bold text-[#8a5a00] dark:bg-white/[.06]">
            未確定情報（rumor/unverified、または信頼度70未満）。事実確認が取れるまで公開時は注意してください。
          </p>
        )}

        <section className="mb-8 border border-line bg-surface p-6">
          <h2 className="mb-4 text-lg font-semibold">イベント情報</h2>
          <EventInfoForm event={event} />
        </section>

        <section className="mb-8 border border-line bg-surface p-6">
          <h2 className="mb-4 text-lg font-semibold">原典ソース（{(items ?? []).length}件）</h2>
          <div className="space-y-4">
            {(items ?? []).map((item) => (
              <SourceItemForm
                key={item.id}
                item={item}
                eventId={event.id}
                relationLabel={
                  relationByItemId.get(item.id) === "primary" ? "主要ソース" : "確認ソース"
                }
                defaultAuthorName={item.author_name ?? sourceNameById.get(item.source_id) ?? ""}
              />
            ))}
          </div>
        </section>

        <section className="mb-8 border border-line bg-surface p-6">
          <h2 className="mb-1 text-lg font-semibold">記事作成プロンプト</h2>
          <p className="mb-4 text-xs text-muted">
            ChatGPTやClaudeの通常チャットに貼り付けて使う下書き用プロンプトです。生成されたAIの回答は、この画面のAPIには送信されません。内容を確認のうえ、下書き編集画面の本文欄に手動で貼り付けてください。
          </p>
          <PromptGenerator
            prompt={buildArticlePrompt({
              headlineEn: event.headline_en,
              category:
                CATEGORY_OPTIONS.find((o) => o.value === event.category)?.label ??
                event.category,
              verificationStatus:
                VERIFICATION_STATUS_OPTIONS.find(
                  (o) => o.value === event.verification_status
                )?.label ?? event.verification_status,
              sources: (items ?? []).map((item) => ({
                title: item.title,
                mediaName: item.author_name ?? sourceNameById.get(item.source_id) ?? "不明",
                url: item.canonical_url,
              })),
              verifiedFactsNotes: event.verified_facts_notes ?? "",
            })}
          />
        </section>

        <section className="border border-line bg-surface p-6">
          <h2 className="mb-4 text-lg font-semibold">記事下書き</h2>
          {draft ? (
            <Link
              href={`/admin/news/drafts/${draft.id}`}
              className={`inline-block ${LINK_CLASS}`}
            >
              下書きを編集する（状態: {draft.status}）
            </Link>
          ) : (
            <CreateDraftButton eventId={event.id} />
          )}
        </section>
      </div>
    </div>
  );
}
