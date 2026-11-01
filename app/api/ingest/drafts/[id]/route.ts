import { NextResponse } from "next/server";
import { draftDetail, fail, isIngestAuthorized, isUuid, unauthorized } from "@/lib/news/ingest-api";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: RouteContext<"/api/ingest/drafts/[id]">) {
  if (!isIngestAuthorized(request)) return unauthorized();

  const { id } = await params;
  if (!isUuid(id)) return fail("下書きが見つかりません。", 404);

  const { data: draft, error } = await createAdminSupabaseClient().from("article_drafts").select("*").eq("id", id).maybeSingle();
  if (error) return fail(`下書きの取得に失敗しました: ${error.message}`, 500);
  if (!draft) return fail("下書きが見つかりません。", 404);

  return NextResponse.json({ ok: true, draft: draftDetail(draft) });
}
