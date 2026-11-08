import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { ARTICLE_DRAFT_STATUS_LABEL } from "@/lib/news/constants";
import { approveDraft } from "@/lib/news/editorial";
import { draftEditUrl, fail, isIngestAuthorized, isUuid, unauthorized } from "@/lib/news/ingest-api";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// 下書きを「承認済み」にする(管理画面の「承認する（入稿APIからの公開を許可）」と同じ処理)。
// 承認待ちの下書きだけを受け付け、公開はしない。公開は承認済みの下書きだけを受け付ける POST /api/ingest/drafts/:id/publish で行う。
export async function POST(request: Request, { params }: RouteContext<"/api/ingest/drafts/[id]/approve">) {
  if (!isIngestAuthorized(request)) return unauthorized();

  const { id } = await params;
  if (!isUuid(id)) return fail("下書きが見つかりません。", 404);

  const result = await approveDraft(createAdminSupabaseClient(), id);
  if (!result.ok) {
    if (!("notPending" in result)) return fail(result.message, 500);
    if (result.status === null) return fail("下書きが見つかりません。", 404);
    return fail(`「${ARTICLE_DRAFT_STATUS_LABEL[result.status]}」の下書きは承認できません。承認できるのは「承認待ち」の下書きだけです。`, 409, {
      status: result.status,
      editUrl: draftEditUrl(id),
    });
  }

  revalidatePath(`/admin/news/drafts/${id}`);
  revalidatePath("/admin/news/drafts");
  return NextResponse.json({ ok: true, id: result.id, headline: result.headline, status: "approved", editUrl: draftEditUrl(id) });
}
