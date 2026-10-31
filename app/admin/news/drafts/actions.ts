"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { ArticleType, NewsEventCategory } from "@/lib/supabase/types";
import { CATEGORY_OPTIONS, isArticleKind, isNewsTopic } from "@/lib/news/constants";

function isCategory(value: string): value is NewsEventCategory {
  return CATEGORY_OPTIONS.some((o) => o.value === value);
}
import type { ActionState } from "@/app/admin/_components/action-ui";
import { validateRelatedMediaInputs } from "@/lib/news/related-media";
import { bodyMediaProblem } from "@/lib/news/body-media";
import { validatePublishedAtInput } from "@/lib/news/jst-datetime";

export async function createDraftAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const eventId = String(formData.get("eventId") ?? "");
  if (!eventId) {
    return { status: "error", message: "イベントを選択してください。" };
  }
  const articleKindValue = String(formData.get("articleKind") ?? "news");
  const articleKind = isArticleKind(articleKindValue) ? articleKindValue : "news";

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

  const { data: draft, error: draftError } = await supabase
    .from("article_drafts")
    .insert({
      event_id: eventId,
      article_type: "standard",
      article_kind: articleKind,
      headline_ja: event.headline_en,
      body_markdown: "",
      source_attribution_markdown: "",
    })
    .select("id")
    .single();

  if (draftError || !draft) {
    return {
      status: "error",
      message: `下書き作成に失敗しました: ${draftError?.message}`,
    };
  }

  revalidatePath("/admin/news/drafts");
  redirect(`/admin/news/drafts/${draft.id}?created=1`);
}

/**
 * 独自コラムを作成する(取得ニュース・イベント・外部媒体を使わない下書き)。
 * 入力は日本語タイトル・カテゴリ(必須)と記事種別。本文は作成後の編集画面で入力する。
 */
export async function createOriginalDraftAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const headlineJa = String(formData.get("headlineJa") ?? "").trim();
  const category = String(formData.get("category") ?? "");
  const articleKindValue = String(formData.get("articleKind") ?? "column");

  if (!headlineJa) {
    return { status: "error", message: "日本語タイトルを入力してください。" };
  }
  if (!isCategory(category)) {
    return { status: "error", message: "カテゴリを選んでください。" };
  }
  const articleKind = isArticleKind(articleKindValue) ? articleKindValue : "column";

  const supabase = createAdminSupabaseClient();
  const { data: draft, error } = await supabase
    .from("article_drafts")
    .insert({
      event_id: null,
      category,
      article_type: "standard",
      article_kind: articleKind,
      headline_ja: headlineJa,
      body_markdown: "",
      source_attribution_markdown: "",
    })
    .select("id")
    .single();

  if (error || !draft) {
    return { status: "error", message: `独自コラムの作成に失敗しました: ${error?.message}` };
  }

  revalidatePath("/admin/news/drafts");
  redirect(`/admin/news/drafts/${draft.id}?created=1`);
}

export async function updateDraftAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const draftId = String(formData.get("draftId") ?? "");
  const articleType = String(formData.get("articleType") ?? "") as ArticleType;
  const articleKindValue = String(formData.get("articleKind") ?? "");
  const headlineJa = String(formData.get("headlineJa") ?? "").trim();
  const dekJa = String(formData.get("dekJa") ?? "").trim();
  const bodyMarkdown = String(formData.get("bodyMarkdown") ?? "");
  const sourceAttributionMarkdown = String(
    formData.get("sourceAttributionMarkdown") ?? ""
  );
  const editorNotes = String(formData.get("editorNotes") ?? "").trim();
  // 独自コラムの編集画面だけがカテゴリを送る(イベントありの記事はイベントのカテゴリを使う)
  const categoryValue = formData.get("category");
  // NEWS 一覧のタブ(公開カテゴリ)。"" は自動(収集時のカテゴリから決める)
  const topicValue = String(formData.get("topic") ?? "");
  // 関連メディアURL(X・YouTube・Instagram・TikTok／任意)。検証して正規化した URL だけを保存する
  const media = validateRelatedMediaInputs(formData.getAll("relatedMediaUrl").map(String));

  if (!draftId || !headlineJa) {
    return { status: "error", message: "見出しは必須です。" };
  }
  if (!isArticleKind(articleKindValue)) {
    return { status: "error", message: "記事種別（通常記事 / COLUMN）を選んでください。" };
  }

  if (categoryValue !== null && !isCategory(String(categoryValue))) {
    return { status: "error", message: "カテゴリを選んでください。" };
  }
  if (topicValue !== "" && !isNewsTopic(topicValue)) {
    return { status: "error", message: "NEWSのタブ（公開カテゴリ）を選んでください。" };
  }
  if ("error" in media) {
    return { status: "error", message: media.error };
  }
  // 本文中のメディア([[media:URL]])の URL と、本文中・本文末を合わせた件数を確かめる
  const bodyMediaError = bodyMediaProblem(bodyMarkdown, media.urls);
  if (bodyMediaError) {
    return { status: "error", message: bodyMediaError };
  }

  // 投稿日(公開済みの記事だけ。日本時間の "YYYY-MM-DDTHH:mm")。画面を開いたときの値から変えた場合だけ更新し、
  // 変えていなければ既存の投稿日(秒まで)をそのまま残す。保存しただけでは投稿日は変わらない
  const publishedAtInput = formData.get("publishedAtJst");
  const publishedAtOriginal = String(formData.get("publishedAtJstOriginal") ?? "");
  let publishedAtUpdate: { published_at: string } | Record<string, never> = {};
  if (publishedAtInput !== null && String(publishedAtInput).trim() !== publishedAtOriginal) {
    const checked = validatePublishedAtInput(String(publishedAtInput));
    if ("error" in checked) {
      return { status: "error", message: checked.error };
    }
    publishedAtUpdate = { published_at: checked.iso };
  }

  const supabase = createAdminSupabaseClient();
  if ("published_at" in publishedAtUpdate) {
    // 投稿日を変えられるのは、すでに投稿日がある(公開済みの)記事だけ
    const { data: current } = await supabase.from("article_drafts").select("published_at").eq("id", draftId).single();
    if (!current?.published_at) {
      return { status: "error", message: "未公開の記事の投稿日は、公開した時点の日時になります（公開前は変更できません）。" };
    }
  }
  const { error } = await supabase
    .from("article_drafts")
    .update({
      ...(categoryValue !== null ? { category: String(categoryValue) as NewsEventCategory } : {}),
      topic: isNewsTopic(topicValue) ? topicValue : null,
      article_type: articleType,
      article_kind: articleKindValue,
      headline_ja: headlineJa,
      dek_ja: dekJa || null,
      body_markdown: bodyMarkdown,
      source_attribution_markdown: sourceAttributionMarkdown,
      editor_notes: editorNotes || null,
      related_media_urls: media.urls,
      ...publishedAtUpdate,
    })
    .eq("id", draftId);

  if (error) {
    return { status: "error", message: `保存に失敗しました: ${error.message}` };
  }

  revalidatePath(`/admin/news/drafts/${draftId}`);
  revalidatePath("/admin/news/drafts");
  revalidatePath("/news");
  revalidatePath(`/news/${draftId}`);
  return { status: "success", message: "保存しました" };
}

export async function publishDraftAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const draftId = String(formData.get("draftId") ?? "");
  if (!draftId) {
    return { status: "error", message: "下書きIDが不正です。" };
  }

  const supabase = createAdminSupabaseClient();

  const { data: draft } = await supabase
    .from("article_drafts")
    .select("body_markdown, published_at")
    .eq("id", draftId)
    .single();

  if (!draft || !draft.body_markdown.trim()) {
    return { status: "error", message: "本文が空のままでは公開できません。" };
  }

  // 初めて公開するときは、その時点の日時を投稿日にする。すでに投稿日がある(公開済みの)記事を
  // もう一度「公開する」場合は、投稿日を変えない(修正しただけで最新記事にならないように)
  const { error } = await supabase
    .from("article_drafts")
    .update({ status: "published", published_at: draft.published_at ?? new Date().toISOString() })
    .eq("id", draftId);

  if (error) {
    return { status: "error", message: `公開に失敗しました: ${error.message}` };
  }

  revalidatePath(`/admin/news/drafts/${draftId}`);
  revalidatePath("/admin/news/drafts");
  revalidatePath("/news");
  revalidatePath("/");
  return { status: "success", message: "公開しました" };
}

export async function rejectDraftAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const draftId = String(formData.get("draftId") ?? "");
  if (!draftId) {
    return { status: "error", message: "下書きIDが不正です。" };
  }

  const supabase = createAdminSupabaseClient();
  const { error } = await supabase
    .from("article_drafts")
    .update({ status: "rejected" })
    .eq("id", draftId);

  if (error) {
    return { status: "error", message: `却下に失敗しました: ${error.message}` };
  }

  revalidatePath(`/admin/news/drafts/${draftId}`);
  revalidatePath("/admin/news/drafts");
  return { status: "success", message: "却下しました" };
}
