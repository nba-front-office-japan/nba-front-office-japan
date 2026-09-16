"use server";

import { revalidatePath } from "next/cache";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { collectAllActiveRssSources } from "@/lib/news/collect";
import { canonicalizeUrl } from "@/lib/news/canonical-url";
import { computeContentHash } from "@/lib/news/hash";

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
