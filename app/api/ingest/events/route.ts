import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { CATEGORY_OPTIONS, VERIFICATION_STATUS_OPTIONS } from "@/lib/news/constants";
import { createEventFromItems } from "@/lib/news/editorial";
import { fail, isIngestAuthorized, isUuid, readJsonObject, unauthorized } from "@/lib/news/ingest-api";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { NewsEventCategory, VerificationStatus } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

function score(value: unknown, fallback: number): number | null {
  if (value === undefined || value === null) return fallback;
  return Number.isInteger(value) && (value as number) >= 0 && (value as number) <= 100 ? (value as number) : null;
}

// イベントを作り、収集アイテムを紐付けて処理済みにする。省略できる項目の既定値は、管理画面のイベント作成フォームと同じ
// (見出し=1件目のタイトル / カテゴリ=other / 検証状態=single_source / 重要度=50 / 信頼度=媒体の信頼度の平均)。
export async function POST(request: Request) {
  if (!isIngestAuthorized(request)) return unauthorized();

  const body = await readJsonObject(request);
  if (!body) return fail("JSONの本文を送ってください。", 400);
  const { newsItemIds, headlineEn, category, verificationStatus } = body;

  if (!Array.isArray(newsItemIds) || newsItemIds.length === 0 || !newsItemIds.every(isUuid)) {
    return fail("newsItemIds は収集アイテムIDの配列で、1件以上指定してください。", 400);
  }
  const ids = [...new Set(newsItemIds as string[])];

  if (headlineEn !== undefined && (typeof headlineEn !== "string" || !headlineEn.trim())) return fail("headlineEn は文字列で指定してください。", 400);
  if (category !== undefined && !CATEGORY_OPTIONS.some((o) => o.value === category)) {
    return fail(`category は ${CATEGORY_OPTIONS.map((o) => o.value).join(" / ")} のどれかにしてください。`, 400);
  }
  if (verificationStatus !== undefined && !VERIFICATION_STATUS_OPTIONS.some((o) => o.value === verificationStatus)) {
    return fail(`verificationStatus は ${VERIFICATION_STATUS_OPTIONS.map((o) => o.value).join(" / ")} のどれかにしてください。`, 400);
  }
  const importanceScore = score(body.importanceScore, 50);
  if (importanceScore === null) return fail("importanceScore は0〜100の整数で指定してください。", 400);

  const supabase = createAdminSupabaseClient();
  const { data: rows, error } = await supabase.from("news_items").select("id, title, status, source_id").in("id", ids);
  if (error) return fail(`収集アイテムの取得に失敗しました: ${error.message}`, 500);

  const items = ids.flatMap((id) => (rows ?? []).filter((r) => r.id === id));
  const missingIds = ids.filter((id) => !items.some((i) => i.id === id));
  if (missingIds.length > 0) return fail("見つからない収集アイテムがあります。", 404, { missingIds });
  // 再送で同じ記事のイベントが増えないよう、未処理の収集アイテムだけを受け付ける
  const notUnprocessedIds = items.filter((i) => i.status !== "new").map((i) => i.id);
  if (notUnprocessedIds.length > 0) return fail("未処理ではない収集アイテムが含まれています。", 409, { notUnprocessedIds });

  const sourceIds = [...new Set(items.map((i) => i.source_id))];
  const { data: sources } = await supabase.from("news_sources").select("id, reliability_level").in("id", sourceIds);
  const reliabilityById = new Map((sources ?? []).map((s) => [s.id, s.reliability_level]));
  const reliabilityAverage = Math.round(items.reduce((sum, i) => sum + (reliabilityById.get(i.source_id) ?? 50), 0) / items.length);
  const reliabilityScore = score(body.reliabilityScore, reliabilityAverage);
  if (reliabilityScore === null) return fail("reliabilityScore は0〜100の整数で指定してください。", 400);

  const result = await createEventFromItems(supabase, {
    itemIds: ids,
    headlineEn: typeof headlineEn === "string" ? headlineEn.trim() : items[0].title,
    category: (category as NewsEventCategory | undefined) ?? "other",
    verificationStatus: (verificationStatus as VerificationStatus | undefined) ?? "single_source",
    importanceScore,
    reliabilityScore,
  });
  if (!result.ok) return fail(result.message, 500);

  revalidatePath("/admin/news");
  revalidatePath("/admin/news/events");
  return NextResponse.json({ ok: true, eventId: result.eventId, newsItemIds: ids }, { status: 201 });
}
