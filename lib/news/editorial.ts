import type { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { EventSourceRelation, NewsEventCategory, VerificationStatus } from "@/lib/supabase/types";
import { buildDefaultAttribution } from "@/lib/news/attribution";
import { guessNewsTopic } from "@/lib/news/topic-guess";

// 記事づくりの共通処理。管理画面(app/admin/news の Server Actions)と入稿API(app/api/ingest)の両方から使う。
// ここでは画面の移動や再検証はせず、DBの読み書きだけを行う。

type SupabaseAdmin = ReturnType<typeof createAdminSupabaseClient>;

export type EditorialResult<T> = ({ ok: true } & T) | { ok: false; message: string };

function generateEventKey(): string {
  return `evt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** 収集アイテムからイベントを作り、紐付けた収集アイテムを処理済みにする。途中で失敗したらイベントを残さない */
export async function createEventFromItems(
  supabase: SupabaseAdmin,
  input: {
    itemIds: string[];
    headlineEn: string;
    category: NewsEventCategory;
    verificationStatus: VerificationStatus;
    importanceScore: number;
    reliabilityScore: number;
  }
): Promise<EditorialResult<{ eventId: string }>> {
  // 非掲載にした記事はイベントの材料にしない
  const { data: hiddenSelected } = await supabase
    .from("news_items")
    .select("id")
    .in("id", input.itemIds)
    .eq("status", "ignored");
  if ((hiddenSelected ?? []).length > 0) {
    return {
      ok: false,
      message: `非掲載の記事が${hiddenSelected!.length}件含まれています。非掲載を解除するか、選択から外してください。`,
    };
  }

  const { data: event, error: eventError } = await supabase
    .from("news_events")
    .insert({
      event_key: generateEventKey(),
      headline_en: input.headlineEn,
      category: input.category,
      verification_status: input.verificationStatus,
      reliability_score: input.reliabilityScore,
      importance_score: input.importanceScore,
    })
    .select("id")
    .single();

  if (eventError || !event) {
    return { ok: false, message: `イベント作成に失敗しました: ${eventError?.message}` };
  }

  const eventSourceRows = input.itemIds.map((newsItemId, index) => ({
    event_id: event.id,
    news_item_id: newsItemId,
    relation: (index === 0 ? "primary" : "confirmation") as EventSourceRelation,
  }));

  const { error: linkError } = await supabase.from("news_event_sources").insert(eventSourceRows);
  if (linkError) {
    await supabase.from("news_events").delete().eq("id", event.id);
    return { ok: false, message: `ソースの紐付けに失敗しました: ${linkError.message}` };
  }

  const { error: statusError } = await supabase.from("news_items").update({ status: "processed" }).in("id", input.itemIds);
  if (statusError) {
    await supabase.from("news_events").delete().eq("id", event.id);
    return { ok: false, message: `収集アイテムの更新に失敗しました: ${statusError.message}` };
  }

  return { ok: true, eventId: event.id };
}

/** イベントに紐付いた収集アイテムから、出典表記のたたき台を作る */
export async function buildEventAttribution(supabase: SupabaseAdmin, eventId: string): Promise<string> {
  const { data: eventSources } = await supabase
    .from("news_event_sources")
    .select("news_item_id")
    .eq("event_id", eventId);

  const itemIds = (eventSources ?? []).map((s) => s.news_item_id);
  const { data: items } =
    itemIds.length > 0
      ? await supabase
          .from("news_items")
          .select("title, canonical_url, author_name, published_at, source_id")
          .in("id", itemIds)
      : { data: [] };

  const sourceIds = [...new Set((items ?? []).map((i) => i.source_id))];
  const { data: sources } =
    sourceIds.length > 0
      ? await supabase.from("news_sources").select("id, name").in("id", sourceIds)
      : { data: [] };
  const sourceNameById = new Map((sources ?? []).map((s) => [s.id, s.name]));

  return buildDefaultAttribution(
    (items ?? []).map((item) => ({
      title: item.title,
      url: item.canonical_url,
      mediaName: item.author_name ?? sourceNameById.get(item.source_id) ?? "不明",
      publishedAt: item.published_at,
    }))
  );
}

/** 下書きを公開する。本文が空なら公開しない */
export async function publishDraft(supabase: SupabaseAdmin, draftId: string): Promise<EditorialResult<{ publishedAt: string }>> {
  const { data: draft } = await supabase
    .from("article_drafts")
    .select("body_markdown, published_at, headline_ja, topic")
    .eq("id", draftId)
    .single();

  if (!draft || !draft.body_markdown.trim()) {
    return { ok: false, message: "本文が空のままでは公開できません。" };
  }

  // NEWS のタブを保存せずに公開した場合は、タイトルから自動で決めたタブ(編集画面の初期選択と同じ)を保存する
  // 初めて公開するときは、その時点の日時を投稿日にする。すでに投稿日がある(公開済みの)記事を
  // もう一度「公開する」場合は、投稿日を変えない(修正しただけで最新記事にならないように)
  const publishedAt = draft.published_at ?? new Date().toISOString();
  const { error } = await supabase
    .from("article_drafts")
    .update({
      status: "published",
      published_at: publishedAt,
      topic: draft.topic ?? guessNewsTopic(draft.headline_ja),
    })
    .eq("id", draftId);

  if (error) {
    return { ok: false, message: `公開に失敗しました: ${error.message}` };
  }
  return { ok: true, publishedAt };
}
