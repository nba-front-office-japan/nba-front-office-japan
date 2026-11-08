import { NextResponse } from "next/server";
import { announcementPublicUrl, revalidateAnnouncementPages, setAnnouncementPublished } from "@/lib/announcements-write";
import { fail, isIngestAuthorized, isUuid, unauthorized } from "@/lib/news/ingest-api";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// 非公開で作ったお知らせを公開する(管理画面の一覧の「公開する」と同じ処理)。すでに公開中なら何も変えずにURLを返す。
export async function POST(request: Request, { params }: RouteContext<"/api/ingest/announcements/[id]/publish">) {
  if (!isIngestAuthorized(request)) return unauthorized();

  const { id } = await params;
  if (!isUuid(id)) return fail("お知らせが見つかりません。", 404);

  const supabase = createAdminSupabaseClient();
  const { data: current, error } = await supabase.from("announcements").select("is_published").eq("id", id).maybeSingle();
  if (error) return fail(`お知らせの取得に失敗しました: ${error.message}`, 500);
  if (!current) return fail("お知らせが見つかりません。", 404);
  if (current.is_published) return NextResponse.json({ ok: true, id, published: true, publicUrl: announcementPublicUrl(id), alreadyPublished: true });

  const result = await setAnnouncementPublished(supabase, id, true);
  if (!result.ok) return fail(result.message, 500);
  if (!result.found) return fail("お知らせが見つかりません。", 404);

  revalidateAnnouncementPages(id);
  return NextResponse.json({ ok: true, id, published: true, publicUrl: announcementPublicUrl(id), alreadyPublished: false });
}
