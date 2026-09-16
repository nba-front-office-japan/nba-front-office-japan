import "server-only";
import type { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/types";
import { parseRssFeed } from "@/lib/news/rss";
import { canonicalizeUrl } from "@/lib/news/canonical-url";
import { computeContentHash } from "@/lib/news/hash";

type SupabaseAdmin = ReturnType<typeof createAdminSupabaseClient>;
type NewsSourceRow = Database["public"]["Tables"]["news_sources"]["Row"];

const USER_AGENT =
  "NBAFrontOfficeJapanNewsCollector/1.0 (+https://nba-front-office-japan.vercel.app)";
const FETCH_TIMEOUT_MS = 15000;

export interface CollectResult {
  sourceSlug: string;
  success: boolean;
  httpStatus: number | null;
  itemsFound: number;
  itemsInserted: number;
  errorMessage: string | null;
}

async function fetchFeed(url: string): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    // RealGMはHEADリクエストを拒否する（403）ため、必ずGETのみを使う。
    return await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/rss+xml, application/xml, text/xml, */*",
      },
      signal: controller.signal,
      cache: "no-store",
    });
  } finally {
    clearTimeout(timeout);
  }
}

export async function collectRssSource(
  supabase: SupabaseAdmin,
  source: NewsSourceRow
): Promise<CollectResult> {
  const startedAt = new Date().toISOString();
  let httpStatus: number | null = null;
  let itemsFound = 0;
  let itemsInserted = 0;
  let errorMessage: string | null = null;
  let success = false;

  try {
    if (!source.feed_url) {
      throw new Error("feed_urlが設定されていません");
    }

    const response = await fetchFeed(source.feed_url);
    httpStatus = response.status;
    if (!response.ok) {
      throw new Error(`HTTPエラー: ${response.status}`);
    }

    const xml = await response.text();
    const items = parseRssFeed(xml);
    itemsFound = items.length;

    for (const item of items) {
      // 同ソース内で同じguid（external_id）が既に保存済みなら、URLの表記ゆれに
      // 関わらず同一投稿として扱いスキップする。
      if (item.guid) {
        const { data: existingByGuid } = await supabase
          .from("news_items")
          .select("id")
          .eq("source_id", source.id)
          .eq("external_id", item.guid)
          .maybeSingle();
        if (existingByGuid) continue;
      }

      const canonicalUrl = canonicalizeUrl(item.link);
      const contentHash = computeContentHash([item.title, item.summary]);

      const { data: insertedRows, error: insertError } = await supabase
        .from("news_items")
        .upsert(
          {
            source_id: source.id,
            external_id: item.guid,
            canonical_url: canonicalUrl,
            title: item.title,
            summary: item.summary,
            author_name: item.author,
            published_at: item.publishedAt,
            raw_published_at: item.rawPublishedAt,
            content_type: "article",
            content_hash: contentHash,
          },
          { onConflict: "canonical_url", ignoreDuplicates: true }
        )
        .select("id");

      if (insertError) {
        throw new Error(`news_items保存エラー: ${insertError.message}`);
      }
      if (insertedRows && insertedRows.length > 0) {
        itemsInserted += 1;
      }
    }

    success = true;
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : String(err);
  }

  await supabase
    .from("news_sources")
    .update({ last_polled_at: new Date().toISOString() })
    .eq("id", source.id);

  await supabase.from("news_collector_job_runs").insert({
    source_id: source.id,
    started_at: startedAt,
    finished_at: new Date().toISOString(),
    http_status: httpStatus,
    items_found: itemsFound,
    items_inserted: itemsInserted,
    is_success: success,
    error_message: errorMessage,
  });

  return {
    sourceSlug: source.slug,
    success,
    httpStatus,
    itemsFound,
    itemsInserted,
    errorMessage,
  };
}

export async function collectAllActiveRssSources(
  supabase: SupabaseAdmin
): Promise<CollectResult[]> {
  const { data: sources, error } = await supabase
    .from("news_sources")
    .select("*")
    .eq("kind", "rss")
    .eq("is_active", true);

  if (error) {
    throw new Error(`news_sources取得エラー: ${error.message}`);
  }

  const results: CollectResult[] = [];
  for (const source of sources ?? []) {
    results.push(await collectRssSource(supabase, source));
  }
  return results;
}
