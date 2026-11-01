import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { buildEventAttribution } from "@/lib/news/editorial";
import {
  DRAFT_SUMMARY_COLUMNS,
  draftEditUrl,
  draftSummary,
  fail,
  isIngestAuthorized,
  parseDraftInput,
  parseDraftStatus,
  parseLimit,
  readJsonObject,
  unauthorized,
} from "@/lib/news/ingest-api";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// 下書きの一覧(新しい順)。?status= で状態を絞り込める
export async function GET(request: Request) {
  if (!isIngestAuthorized(request)) return unauthorized();

  const params = new URL(request.url).searchParams;
  const limit = parseLimit(params.get("limit"));
  if (limit === null) return fail("limit は1以上の整数で指定してください。", 400);
  const statusParam = params.get("status");
  const status = statusParam === null ? null : parseDraftStatus(statusParam);
  if (statusParam !== null && !status) return fail("status は pending_review / approved / published / rejected のどれかにしてください。", 400);

  const supabase = createAdminSupabaseClient();
  let query = supabase.from("article_drafts").select(DRAFT_SUMMARY_COLUMNS).order("created_at", { ascending: false }).limit(limit);
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) return fail(`下書きの取得に失敗しました: ${error.message}`, 500);

  return NextResponse.json({ ok: true, drafts: (data ?? []).map(draftSummary) });
}

// 管理画面の記事フォームと同じ項目で、下書きを「承認待ち」で作る。ここから公開はしない
export async function POST(request: Request) {
  if (!isIngestAuthorized(request)) return unauthorized();

  const body = await readJsonObject(request);
  if (!body) return fail("JSONの本文を送ってください。", 400);
  const input = parseDraftInput(body);
  if ("error" in input) return fail(input.error, 400);

  const supabase = createAdminSupabaseClient();
  if (input.eventId) {
    const { data: event } = await supabase.from("news_events").select("id").eq("id", input.eventId).maybeSingle();
    if (!event) return fail("イベントが見つかりません。", 404);
    // 1つのイベントに下書きは1本だけ(管理画面と同じ)
    const { data: existing } = await supabase.from("article_drafts").select("id").eq("event_id", input.eventId).maybeSingle();
    if (existing) return fail("このイベントの下書きはすでにあります。", 409, { draftId: existing.id, editUrl: draftEditUrl(existing.id) });
  }

  // 出典表記を省略したら、イベントの原典から作る(管理画面でイベントから下書きを作るときと同じ)
  const sources = input.sources ?? (input.eventId ? await buildEventAttribution(supabase, input.eventId) : "");

  const { data: draft, error } = await supabase
    .from("article_drafts")
    .insert({
      event_id: input.eventId,
      // イベントありの記事はイベントのカテゴリを使うため、この列は空のままにする
      category: input.eventId ? null : input.internalCategory,
      topic: input.topic,
      status: "pending_review",
      article_type: input.articleType,
      article_kind: input.articleKind,
      headline_ja: input.headline,
      dek_ja: input.subheadline,
      body_markdown: input.body,
      source_attribution_markdown: sources,
      editor_notes: input.editorNote,
      related_media_urls: input.mediaUrls,
      published_at: input.publishedAt,
    })
    .select("id, status")
    .single();

  if (error || !draft) return fail(`下書きの作成に失敗しました: ${error?.message}`, 500);

  revalidatePath("/admin/news/drafts");
  return NextResponse.json({ ok: true, id: draft.id, status: draft.status, editUrl: draftEditUrl(draft.id) }, { status: 201 });
}
