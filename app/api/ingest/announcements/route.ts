import { NextResponse } from "next/server";
import { todayJst } from "@/lib/games/date";
import { announcementPublicUrl, createAnnouncement, revalidateAnnouncementPages } from "@/lib/announcements-write";
import { fail, isIngestAuthorized, parseLimit, readJsonObject, unauthorized } from "@/lib/news/ingest-api";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// お知らせ(announcements)の一覧と作成。管理画面(/admin/announcements)と同じテーブル・同じ入力チェックを使う。
// お知らせは運営者本人の指示で出すものなので、published: true なら作成と同時に公開する(省略時は非公開で作成)。

type AnnouncementRow = { id: string; title: string; posted_on: string; is_published: boolean; created_at: string };

function summary(a: AnnouncementRow) {
  return { id: a.id, title: a.title, date: a.posted_on, published: a.is_published, publicUrl: announcementPublicUrl(a.id), createdAt: a.created_at };
}

// 一覧(投稿日の新しい順。同じ日は作成の新しい順)。非公開のものも含む。重複作成を防ぐ確認用
export async function GET(request: Request) {
  if (!isIngestAuthorized(request)) return unauthorized();

  const limit = parseLimit(new URL(request.url).searchParams.get("limit"));
  if (limit === null) return fail("limit は1以上の整数で指定してください。", 400);

  const { data, error } = await createAdminSupabaseClient()
    .from("announcements")
    .select("id, title, posted_on, is_published, created_at")
    .order("posted_on", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return fail(`お知らせの取得に失敗しました: ${error.message}`, 500);

  return NextResponse.json({ ok: true, announcements: (data ?? []).map(summary) });
}

// 作成。title・body は必須、date は YYYY-MM-DD(省略時は日本時間の今日)、published は省略時 false
export async function POST(request: Request) {
  if (!isIngestAuthorized(request)) return unauthorized();

  const body = await readJsonObject(request);
  if (!body) return fail("JSONの本文を送ってください。", 400);

  if (typeof body.title !== "string") return fail("title(文字列)を指定してください。", 400);
  if (typeof body.body !== "string") return fail("body(文字列)を指定してください。", 400);
  if (body.date !== undefined && body.date !== null && typeof body.date !== "string") return fail("date は YYYY-MM-DD 形式の文字列で指定してください。", 400);
  if (body.published !== undefined && body.published !== null && typeof body.published !== "boolean") return fail("published は true / false で指定してください。", 400);

  const published = body.published === true;
  const result = await createAnnouncement(createAdminSupabaseClient(), {
    title: body.title,
    body: body.body,
    postedOn: typeof body.date === "string" && body.date.trim() !== "" ? body.date.trim() : todayJst(),
    isPublished: published,
  });
  if (!result.ok) return fail(result.message, result.invalid ? 400 : 500);

  revalidateAnnouncementPages(result.id);
  return NextResponse.json({ ok: true, id: result.id, published, publicUrl: announcementPublicUrl(result.id) }, { status: 201 });
}
