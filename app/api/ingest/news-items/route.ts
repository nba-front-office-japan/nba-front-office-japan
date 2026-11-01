import { NextResponse } from "next/server";
import { fail, isIngestAuthorized, parseLimit, unauthorized } from "@/lib/news/ingest-api";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// 未処理の収集アイテム(管理画面の「未処理」と同じ。非掲載は含まない)を、取得日時の新しい順に返す
export async function GET(request: Request) {
  if (!isIngestAuthorized(request)) return unauthorized();

  const params = new URL(request.url).searchParams;
  if ((params.get("status") ?? "unprocessed") !== "unprocessed") return fail("status は unprocessed だけ指定できます。", 400);
  const limit = parseLimit(params.get("limit"));
  if (limit === null) return fail("limit は1以上の整数で指定してください。", 400);

  const supabase = createAdminSupabaseClient();
  const { data: items, error, count } = await supabase
    .from("news_items")
    .select("id, source_id, title, canonical_url, fetched_at", { count: "exact" })
    .eq("status", "new")
    .order("fetched_at", { ascending: false })
    .limit(limit);
  if (error) return fail(`収集アイテムの取得に失敗しました: ${error.message}`, 500);

  const sourceIds = [...new Set((items ?? []).map((i) => i.source_id))];
  const { data: sources } = sourceIds.length > 0 ? await supabase.from("news_sources").select("id, name").in("id", sourceIds) : { data: [] };
  const sourceNameById = new Map((sources ?? []).map((s) => [s.id, s.name]));

  return NextResponse.json({
    ok: true,
    total: count ?? 0,
    items: (items ?? []).map((i) => ({
      id: i.id,
      source: sourceNameById.get(i.source_id) ?? "不明",
      title: i.title,
      url: i.canonical_url,
      collectedAt: i.fetched_at,
    })),
  });
}
