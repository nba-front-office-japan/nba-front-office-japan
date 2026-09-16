"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { canonicalizeUrl } from "@/lib/news/canonical-url";
import { buildDefaultAttribution } from "@/lib/news/attribution";
import { VERIFIED_FACTS_NOTES_MAX_LENGTH } from "@/lib/news/constants";
import type { NewsEventCategory, VerificationStatus } from "@/lib/supabase/types";
import type { ActionState } from "@/app/admin/_components/action-ui";

export async function updateEventAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const eventId = String(formData.get("eventId") ?? "");
  const headlineEn = String(formData.get("headlineEn") ?? "").trim();
  const category = String(formData.get("category") ?? "") as NewsEventCategory;
  const verificationStatus = String(
    formData.get("verificationStatus") ?? ""
  ) as VerificationStatus;
  const importanceScore = Number(formData.get("importanceScore") ?? 0);
  const reliabilityScore = Number(formData.get("reliabilityScore") ?? 0);
  const verifiedFactsNotes = String(formData.get("verifiedFactsNotes") ?? "").trim();

  if (!eventId || !headlineEn) {
    return { status: "error", message: "見出しは必須です。" };
  }
  if (verifiedFactsNotes.length > VERIFIED_FACTS_NOTES_MAX_LENGTH) {
    return {
      status: "error",
      message: `確認済み事実メモは${VERIFIED_FACTS_NOTES_MAX_LENGTH}文字以内で入力してください。`,
    };
  }

  const supabase = createAdminSupabaseClient();
  const { error } = await supabase
    .from("news_events")
    .update({
      headline_en: headlineEn,
      category,
      verification_status: verificationStatus,
      importance_score: importanceScore,
      reliability_score: reliabilityScore,
      verified_facts_notes: verifiedFactsNotes || null,
    })
    .eq("id", eventId);

  if (error) {
    return { status: "error", message: `更新に失敗しました: ${error.message}` };
  }

  revalidatePath(`/admin/news/events/${eventId}`);
  revalidatePath("/admin/news/events");
  return { status: "success", message: "保存しました" };
}

export async function updateSourceItemAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const itemId = String(formData.get("itemId") ?? "");
  const eventId = String(formData.get("eventId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim();
  const authorName = String(formData.get("authorName") ?? "").trim();

  if (!itemId || !title || !url) {
    return { status: "error", message: "タイトルとURLは必須です。" };
  }

  const supabase = createAdminSupabaseClient();
  const { error } = await supabase
    .from("news_items")
    .update({
      title,
      canonical_url: canonicalizeUrl(url),
      author_name: authorName || null,
    })
    .eq("id", itemId);

  if (error) {
    return {
      status: "error",
      message: `原典情報の更新に失敗しました: ${error.message}`,
    };
  }

  revalidatePath(`/admin/news/events/${eventId}`);
  return { status: "success", message: "保存しました" };
}

export async function createDraftFromEventAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const eventId = String(formData.get("eventId") ?? "");
  if (!eventId) {
    return { status: "error", message: "イベントIDが不正です。" };
  }

  const supabase = createAdminSupabaseClient();

  const { data: existing } = await supabase
    .from("article_drafts")
    .select("id")
    .eq("event_id", eventId)
    .maybeSingle();

  if (existing) {
    redirect(`/admin/news/drafts/${existing.id}`);
  }

  const { data: event, error: eventError } = await supabase
    .from("news_events")
    .select("headline_en")
    .eq("id", eventId)
    .single();

  if (eventError || !event) {
    return { status: "error", message: "イベントが見つかりません。" };
  }

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

  const defaultAttribution = buildDefaultAttribution(
    (items ?? []).map((item) => ({
      title: item.title,
      url: item.canonical_url,
      mediaName: item.author_name ?? sourceNameById.get(item.source_id) ?? "不明",
      publishedAt: item.published_at,
    }))
  );

  const { data: draft, error: draftError } = await supabase
    .from("article_drafts")
    .insert({
      event_id: eventId,
      article_type: "standard",
      headline_ja: event.headline_en,
      body_markdown: "",
      source_attribution_markdown: defaultAttribution,
    })
    .select("id")
    .single();

  if (draftError || !draft) {
    return {
      status: "error",
      message: `下書き作成に失敗しました: ${draftError?.message}`,
    };
  }

  revalidatePath(`/admin/news/events/${eventId}`);
  redirect(`/admin/news/drafts/${draft.id}?created=1`);
}
