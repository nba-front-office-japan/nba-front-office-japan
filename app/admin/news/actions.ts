"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { collectAllActiveRssSources } from "@/lib/news/collect";
import { canonicalizeUrl } from "@/lib/news/canonical-url";
import { computeContentHash } from "@/lib/news/hash";
import type {
  EventSourceRelation,
  NewsEventCategory,
  VerificationStatus,
} from "@/lib/supabase/types";
import type { ActionState } from "@/app/admin/_components/action-ui";

export interface CollectActionState {
  status: "idle" | "success" | "error";
  totalFound?: number;
  totalInserted?: number;
  message?: string;
}

export async function triggerCollectAction(): Promise<CollectActionState> {
  try {
    const supabase = createAdminSupabaseClient();
    const results = await collectAllActiveRssSources(supabase);
    revalidatePath("/admin/news");

    const failed = results.filter((r) => !r.success);
    if (failed.length > 0) {
      return {
        status: "error",
        message: failed
          .map((r) => `${r.sourceSlug}: ${r.errorMessage ?? "不明なエラー"}`)
          .join(" / "),
      };
    }

    return {
      status: "success",
      totalFound: results.reduce((sum, r) => sum + r.itemsFound, 0),
      totalInserted: results.reduce((sum, r) => sum + r.itemsInserted, 0),
    };
  } catch (err) {
    return {
      status: "error",
      message: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function registerManualOfficialUrlAction(formData: FormData) {
  const url = String(formData.get("url") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const authorName = String(formData.get("authorName") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  const publishedAtRaw = String(formData.get("publishedAt") ?? "").trim();

  if (!url || !title) {
    throw new Error("URLとタイトルは必須です。");
  }

  const supabase = createAdminSupabaseClient();

  const { data: source, error: sourceError } = await supabase
    .from("news_sources")
    .select("id")
    .eq("slug", "official_manual")
    .single();

  if (sourceError || !source) {
    throw new Error(
      "手動公式登録用のソース（official_manual）が見つかりません。初期データ投入SQLを実行済みか確認してください。"
    );
  }

  const canonicalUrl = canonicalizeUrl(url);
  const publishedAt = publishedAtRaw ? new Date(publishedAtRaw).toISOString() : null;

  const { error: insertError } = await supabase.from("news_items").upsert(
    {
      source_id: source.id,
      canonical_url: canonicalUrl,
      title,
      summary: summary || null,
      author_name: authorName || null,
      published_at: publishedAt,
      raw_published_at: publishedAtRaw || null,
      content_type: "official_statement",
      content_hash: computeContentHash([title, summary]),
    },
    { onConflict: "canonical_url", ignoreDuplicates: true }
  );

  if (insertError) {
    throw new Error(`登録に失敗しました: ${insertError.message}`);
  }

  revalidatePath("/admin/news");
}

function generateEventKey(): string {
  return `evt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function createEventFromItemsAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const itemIds = formData.getAll("itemIds").map(String).filter(Boolean);
  const headlineEn = String(formData.get("headlineEn") ?? "").trim();
  const category = String(formData.get("category") ?? "") as NewsEventCategory;
  const verificationStatus = String(
    formData.get("verificationStatus") ?? ""
  ) as VerificationStatus;
  const importanceScore = Number(formData.get("importanceScore") ?? 50);
  const reliabilityScore = Number(formData.get("reliabilityScore") ?? 50);

  if (itemIds.length === 0) {
    return { status: "error", message: "記事を1件以上選択してください。" };
  }
  if (!headlineEn) {
    return { status: "error", message: "内部見出し（英語）は必須です。" };
  }

  const supabase = createAdminSupabaseClient();

  // 非掲載にした記事はイベントの材料にしない
  const { data: hiddenSelected } = await supabase
    .from("news_items")
    .select("id")
    .in("id", itemIds)
    .eq("status", "ignored");
  if ((hiddenSelected ?? []).length > 0) {
    return {
      status: "error",
      message: `非掲載の記事が${hiddenSelected!.length}件含まれています。非掲載を解除するか、選択から外してください。`,
    };
  }

  const { data: event, error: eventError } = await supabase
    .from("news_events")
    .insert({
      event_key: generateEventKey(),
      headline_en: headlineEn,
      category,
      verification_status: verificationStatus,
      reliability_score: reliabilityScore,
      importance_score: importanceScore,
    })
    .select("id")
    .single();

  if (eventError || !event) {
    return {
      status: "error",
      message: `イベント作成に失敗しました: ${eventError?.message}`,
    };
  }

  const eventSourceRows = itemIds.map((newsItemId, index) => ({
    event_id: event.id,
    news_item_id: newsItemId,
    relation: (index === 0 ? "primary" : "confirmation") as EventSourceRelation,
  }));

  const { error: linkError } = await supabase
    .from("news_event_sources")
    .insert(eventSourceRows);

  if (linkError) {
    return {
      status: "error",
      message: `ソースの紐付けに失敗しました: ${linkError.message}`,
    };
  }

  await supabase.from("news_items").update({ status: "processed" }).in("id", itemIds);

  revalidatePath("/admin/news");
  revalidatePath("/admin/news/events");
  redirect(`/admin/news/events/${event.id}?created=1`);
}


// ---------------------------------------------------------------------------
// 最近取得したニュースの一括操作(非掲載・非掲載の解除・完全削除)
// ・イベントの材料として使われている記事(news_event_sources にある記事)は対象外にする。
//   公開記事の出典になっている可能性があるため。
// ・非掲載は news_items.status を 'ignored' にするだけで、データは残る(元に戻せる)。
//   データが残るため、次の収集で同じ記事が再登録されることはない。
// ・完全削除は行を削除する(元に戻せない)。RSSにまだ載っている記事は、次の収集で再登録されることがある。
// ---------------------------------------------------------------------------

const MAX_BULK_ITEMS = 500;

export type BulkItemsState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success"; message: string };

function idsFromForm(formData: FormData): string[] {
  return [...new Set(formData.getAll("itemIds").map(String).filter(Boolean))];
}

/** イベントで使われている記事IDの集合 */
async function linkedItemIds(supabase: ReturnType<typeof createAdminSupabaseClient>, ids: string[]): Promise<Set<string>> {
  const { data, error } = await supabase.from("news_event_sources").select("news_item_id").in("news_item_id", ids);
  if (error) throw new Error(`イベントとの関係の確認に失敗しました: ${error.message}`);
  return new Set((data ?? []).map((r) => r.news_item_id));
}

async function runBulk(
  formData: FormData,
  run: (supabase: ReturnType<typeof createAdminSupabaseClient>, eligible: string[]) => Promise<number>,
  doneLabel: string
): Promise<BulkItemsState> {
  const ids = idsFromForm(formData);
  if (ids.length === 0) return { status: "error", message: "記事を1件以上選択してください。" };
  if (ids.length > MAX_BULK_ITEMS) return { status: "error", message: `一度に操作できるのは${MAX_BULK_ITEMS}件までです。` };

  try {
    const supabase = createAdminSupabaseClient();
    const linked = await linkedItemIds(supabase, ids);
    const eligible = ids.filter((id) => !linked.has(id));
    const changed = eligible.length > 0 ? await run(supabase, eligible) : 0;
    revalidatePath("/admin/news");
    const skipped = ids.length - eligible.length;
    return {
      status: "success",
      message: `${changed}件を${doneLabel}しました。${skipped > 0 ? `イベントで使われている${skipped}件は対象外にしました。` : ""}`,
    };
  } catch (err) {
    return { status: "error", message: err instanceof Error ? err.message : String(err) };
  }
}

/** 非掲載にする(status を 'ignored' に) */
export async function hideNewsItemsAction(_prev: BulkItemsState, formData: FormData): Promise<BulkItemsState> {
  return runBulk(
    formData,
    async (supabase, eligible) => {
      const { data, error } = await supabase
        .from("news_items")
        .update({ status: "ignored" })
        .in("id", eligible)
        .neq("status", "ignored")
        .select("id");
      if (error) throw new Error(`非掲載にできませんでした: ${error.message}`);
      return (data ?? []).length;
    },
    "非掲載に"
  );
}

/** 非掲載を解除する(status を 'new' に戻す) */
export async function unhideNewsItemsAction(_prev: BulkItemsState, formData: FormData): Promise<BulkItemsState> {
  return runBulk(
    formData,
    async (supabase, eligible) => {
      const { data, error } = await supabase
        .from("news_items")
        .update({ status: "new" })
        .in("id", eligible)
        .eq("status", "ignored")
        .select("id");
      if (error) throw new Error(`非掲載を解除できませんでした: ${error.message}`);
      return (data ?? []).length;
    },
    "非掲載から戻"
  );
}

/** 完全に削除する(元に戻せない) */
export async function deleteNewsItemsAction(_prev: BulkItemsState, formData: FormData): Promise<BulkItemsState> {
  if (formData.get("confirmDelete") !== "yes") {
    return { status: "error", message: "「元に戻せないことを確認しました」にチェックを入れてください。" };
  }
  return runBulk(
    formData,
    async (supabase, eligible) => {
      const { data, error } = await supabase.from("news_items").delete().in("id", eligible).select("id");
      if (error) throw new Error(`削除できませんでした: ${error.message}`);
      return (data ?? []).length;
    },
    "完全に削除"
  );
}
