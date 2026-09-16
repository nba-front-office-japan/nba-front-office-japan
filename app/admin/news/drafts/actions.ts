"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { ArticleType } from "@/lib/supabase/types";

export async function createDraftAction(formData: FormData) {
  const eventId = String(formData.get("eventId") ?? "");
  if (!eventId) {
    throw new Error("イベントを選択してください。");
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
    throw new Error("イベントが見つかりません。");
  }

  const { data: draft, error: draftError } = await supabase
    .from("article_drafts")
    .insert({
      event_id: eventId,
      article_type: "standard",
      headline_ja: event.headline_en,
      body_markdown: "",
      source_attribution_markdown: "",
    })
    .select("id")
    .single();

  if (draftError || !draft) {
    throw new Error(`下書き作成に失敗しました: ${draftError?.message}`);
  }

  revalidatePath("/admin/news/drafts");
  redirect(`/admin/news/drafts/${draft.id}`);
}

export async function updateDraftAction(formData: FormData) {
  const draftId = String(formData.get("draftId") ?? "");
  const articleType = String(formData.get("articleType") ?? "") as ArticleType;
  const headlineJa = String(formData.get("headlineJa") ?? "").trim();
  const dekJa = String(formData.get("dekJa") ?? "").trim();
  const bodyMarkdown = String(formData.get("bodyMarkdown") ?? "");
  const sourceAttributionMarkdown = String(
    formData.get("sourceAttributionMarkdown") ?? ""
  );
  const editorNotes = String(formData.get("editorNotes") ?? "").trim();

  if (!draftId || !headlineJa) {
    throw new Error("見出しは必須です。");
  }

  const supabase = createAdminSupabaseClient();
  const { error } = await supabase
    .from("article_drafts")
    .update({
      article_type: articleType,
      headline_ja: headlineJa,
      dek_ja: dekJa || null,
      body_markdown: bodyMarkdown,
      source_attribution_markdown: sourceAttributionMarkdown,
      editor_notes: editorNotes || null,
    })
    .eq("id", draftId);

  if (error) {
    throw new Error(`保存に失敗しました: ${error.message}`);
  }

  revalidatePath(`/admin/news/drafts/${draftId}`);
  revalidatePath("/admin/news/drafts");
}

export async function publishDraftAction(formData: FormData) {
  const draftId = String(formData.get("draftId") ?? "");
  if (!draftId) throw new Error("下書きIDが不正です。");

  const supabase = createAdminSupabaseClient();

  const { data: draft } = await supabase
    .from("article_drafts")
    .select("body_markdown, source_attribution_markdown")
    .eq("id", draftId)
    .single();

  if (!draft || !draft.body_markdown.trim()) {
    throw new Error("本文が空のままでは公開できません。");
  }

  const { error } = await supabase
    .from("article_drafts")
    .update({ status: "published", published_at: new Date().toISOString() })
    .eq("id", draftId);

  if (error) {
    throw new Error(`公開に失敗しました: ${error.message}`);
  }

  revalidatePath(`/admin/news/drafts/${draftId}`);
  revalidatePath("/admin/news/drafts");
  revalidatePath("/news");
  revalidatePath("/");
}

export async function rejectDraftAction(formData: FormData) {
  const draftId = String(formData.get("draftId") ?? "");
  if (!draftId) throw new Error("下書きIDが不正です。");

  const supabase = createAdminSupabaseClient();
  const { error } = await supabase
    .from("article_drafts")
    .update({ status: "rejected" })
    .eq("id", draftId);

  if (error) {
    throw new Error(`却下に失敗しました: ${error.message}`);
  }

  revalidatePath(`/admin/news/drafts/${draftId}`);
  revalidatePath("/admin/news/drafts");
}
