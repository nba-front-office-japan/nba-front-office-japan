import type { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type {
  ArticleType,
  NewsEventCategory,
  VerificationStatus,
} from "@/lib/supabase/types";

type SupabaseAdmin = ReturnType<typeof createAdminSupabaseClient>;

export interface PublicArticleSource {
  title: string;
  url: string;
  mediaName: string;
  publishedAt: string | null;
}

export interface PublicArticleSummary {
  id: string;
  headlineJa: string;
  dekJa: string | null;
  articleType: ArticleType;
  category: NewsEventCategory;
  verificationStatus: VerificationStatus;
  publishedAt: string | null;
}

export interface PublicArticleDetail extends PublicArticleSummary {
  bodyMarkdown: string;
  sources: PublicArticleSource[];
}

// 公開ページ(/news, /news/[articleId])からのみ使う。status='published'のみを
// 対象にし、下書き・rumor未承認のarticle_draftsが一般公開されないようにする。
export async function fetchPublishedArticles(
  supabase: SupabaseAdmin
): Promise<PublicArticleSummary[]> {
  const { data: drafts } = await supabase
    .from("article_drafts")
    .select("id, headline_ja, dek_ja, article_type, published_at, event_id")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (!drafts || drafts.length === 0) return [];

  const eventIds = [...new Set(drafts.map((d) => d.event_id))];
  const { data: events } = await supabase
    .from("news_events")
    .select("id, category, verification_status")
    .in("id", eventIds);
  const eventById = new Map((events ?? []).map((e) => [e.id, e]));

  return drafts.map((d) => {
    const event = eventById.get(d.event_id);
    return {
      id: d.id,
      headlineJa: d.headline_ja,
      dekJa: d.dek_ja,
      articleType: d.article_type,
      category: event?.category ?? "other",
      verificationStatus: event?.verification_status ?? "unverified",
      publishedAt: d.published_at,
    };
  });
}

export async function fetchPublishedArticleById(
  supabase: SupabaseAdmin,
  id: string
): Promise<PublicArticleDetail | null> {
  const { data: draft } = await supabase
    .from("article_drafts")
    .select("*")
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();

  if (!draft) return null;

  const { data: event } = await supabase
    .from("news_events")
    .select("category, verification_status")
    .eq("id", draft.event_id)
    .single();

  const { data: eventSources } = await supabase
    .from("news_event_sources")
    .select("news_item_id")
    .eq("event_id", draft.event_id);

  const itemIds = (eventSources ?? []).map((s) => s.news_item_id);
  const { data: items } =
    itemIds.length > 0
      ? await supabase
          .from("news_items")
          .select("title, canonical_url, author_name, published_at, source_id")
          .in("id", itemIds)
      : { data: [] };

  const sourceIds = [...new Set((items ?? []).map((i) => i.source_id))];
  const { data: newsSources } =
    sourceIds.length > 0
      ? await supabase.from("news_sources").select("id, name").in("id", sourceIds)
      : { data: [] };
  const sourceNameById = new Map((newsSources ?? []).map((s) => [s.id, s.name]));

  const sources: PublicArticleSource[] = (items ?? []).map((item) => ({
    title: item.title,
    url: item.canonical_url,
    mediaName: item.author_name ?? sourceNameById.get(item.source_id) ?? "不明",
    publishedAt: item.published_at,
  }));

  return {
    id: draft.id,
    headlineJa: draft.headline_ja,
    dekJa: draft.dek_ja,
    articleType: draft.article_type,
    bodyMarkdown: draft.body_markdown,
    category: event?.category ?? "other",
    verificationStatus: event?.verification_status ?? "unverified",
    publishedAt: draft.published_at,
    sources,
  };
}
