import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { ARTICLE_DRAFT_STATUS_LABEL } from "@/lib/news/constants";
import { publishDraft } from "@/lib/news/editorial";
import { articlePublicUrl, draftEditUrl, fail, isIngestAuthorized, isUuid, unauthorized } from "@/lib/news/ingest-api";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// 下書きを公開する。AI記事を人の確認なしに公開しないよう、管理画面で「承認済み」にした下書きだけを受け付ける。
// すでに公開済みなら、何も変えずに公開ページのURLを返す。
export async function POST(request: Request, { params }: RouteContext<"/api/ingest/drafts/[id]/publish">) {
  if (!isIngestAuthorized(request)) return unauthorized();

  const { id } = await params;
  if (!isUuid(id)) return fail("下書きが見つかりません。", 404);

  const supabase = createAdminSupabaseClient();
  const { data: draft, error } = await supabase.from("article_drafts").select("status, published_at").eq("id", id).maybeSingle();
  if (error) return fail(`下書きの取得に失敗しました: ${error.message}`, 500);
  if (!draft) return fail("下書きが見つかりません。", 404);

  if (draft.status === "published") {
    return NextResponse.json({ ok: true, id, status: "published", publishedAt: draft.published_at, publicUrl: articlePublicUrl(id), alreadyPublished: true });
  }
  if (draft.status !== "approved") {
    return fail(`「${ARTICLE_DRAFT_STATUS_LABEL[draft.status]}」の下書きは公開できません。管理画面で内容を確認し、「承認する」を押してください。`, 409, {
      status: draft.status,
      editUrl: draftEditUrl(id),
    });
  }

  const result = await publishDraft(supabase, id);
  if (!result.ok) return fail(result.message, 422, { editUrl: draftEditUrl(id) });

  revalidatePath(`/admin/news/drafts/${id}`);
  revalidatePath("/admin/news/drafts");
  revalidatePath("/news");
  revalidatePath(`/news/${id}`);
  revalidatePath("/");
  return NextResponse.json({ ok: true, id, status: "published", publishedAt: result.publishedAt, publicUrl: articlePublicUrl(id), alreadyPublished: false });
}
