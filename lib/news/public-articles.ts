import type { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type {
  ArticleKind,
  ArticleType,
  NewsEventCategory,
  NewsTopic,
  VerificationStatus,
} from "@/lib/supabase/types";
import { resolveNewsTopic } from "@/lib/news/constants";

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
  articleKind: ArticleKind;
  category: NewsEventCategory;
  /** NEWS 一覧のタブ(公開カテゴリ)。どのタブにも入らない記事は null(ALL にだけ出る) */
  topic: NewsTopic | null;
  /** 独自コラム(イベントなし)は確認状況の対象外のため null(未確定情報などのラベルを出さない) */
  verificationStatus: VerificationStatus | null;
  publishedAt: string | null;
}

export interface PublicArticleDetail extends PublicArticleSummary {
  bodyMarkdown: string;
  /** 関連メディア(Xポスト・YouTube動画)の URL。表示時に lib/news/related-media.ts で再検証する */
  relatedMediaUrls: string[];
  sources: PublicArticleSource[];
}

// NEWS の検索で比べる形にそろえる(全角・半角、大文字・小文字の違いを無視する)
function normalizeForSearch(text: string): string {
  return text.normalize("NFKC").toLowerCase();
}

// 本文(Markdown)から、検索に使う文字だけを取り出す(埋め込みメディアの URL・リンク先 URL・見出し/太字の記号は除く)
function bodyTextForSearch(markdown: string): string {
  return markdown
    .replace(/\[\[(?:media|video|image):[^\]]*\]\]/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\*\*/g, "")
    .replace(/^##\s+/gm, "");
}

// 公開ページ(/news, /news/[articleId])からのみ使う。status='published'のみを
// 対象にし、下書き・rumor未承認のarticle_draftsが一般公開されないようにする。
// query を渡すと、記事のタイトル(headline_ja)と本文(body_markdown)に部分一致する記事だけを返す(NEWS の記事だけが対象)。
export async function fetchPublishedArticles(
  supabase: SupabaseAdmin,
  options: { query?: string } = {}
): Promise<PublicArticleSummary[]> {
  const { data: rows } = await supabase
    .from("article_drafts")
    .select("id, headline_ja, dek_ja, article_type, article_kind, published_at, event_id, category, topic")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  // 検索するときだけ、公開記事の本文を読んで、タイトルか本文に検索語を含む記事に絞る
  const needle = options.query ? normalizeForSearch(options.query.trim()) : "";
  let drafts = rows;
  if (needle && rows && rows.length > 0) {
    const { data: bodies } = await supabase
      .from("article_drafts")
      .select("id, headline_ja, body_markdown")
      .eq("status", "published");
    const matched = new Set(
      (bodies ?? [])
        .filter(
          (d) =>
            normalizeForSearch(d.headline_ja).includes(needle) ||
            normalizeForSearch(bodyTextForSearch(d.body_markdown ?? "")).includes(needle)
        )
        .map((d) => d.id)
    );
    drafts = rows.filter((d) => matched.has(d.id));
  }

  if (!drafts || drafts.length === 0) return [];

  const eventIds = [...new Set(drafts.flatMap((d) => (d.event_id ? [d.event_id] : [])))];
  const { data: events } =
    eventIds.length > 0
      ? await supabase.from("news_events").select("id, category, verification_status").in("id", eventIds)
      : { data: [] };
  const eventById = new Map((events ?? []).map((e) => [e.id, e]));

  return drafts.map((d) => {
    // 独自コラム(イベントなし)は、下書きに保存したカテゴリを使い、確認状況は対象外(null)
    if (!d.event_id) {
      return {
        id: d.id,
        headlineJa: d.headline_ja,
        dekJa: d.dek_ja,
        articleType: d.article_type,
        articleKind: d.article_kind,
        category: d.category ?? "other",
        topic: resolveNewsTopic(d.topic, d.category ?? "other", d.article_kind),
        verificationStatus: null,
        publishedAt: d.published_at,
      };
    }
    const event = eventById.get(d.event_id);
    return {
      id: d.id,
      headlineJa: d.headline_ja,
      dekJa: d.dek_ja,
      articleType: d.article_type,
      articleKind: d.article_kind,
      category: event?.category ?? "other",
      topic: resolveNewsTopic(d.topic, event?.category ?? "other", d.article_kind),
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

  // 独自コラム(イベントなし)には外部の情報源がないため、情報源は空にする(公開ページでは「情報源」欄を出さない)
  if (!draft.event_id) {
    return {
      id: draft.id,
      headlineJa: draft.headline_ja,
      dekJa: draft.dek_ja,
      articleType: draft.article_type,
      articleKind: draft.article_kind,
      bodyMarkdown: draft.body_markdown,
      relatedMediaUrls: draft.related_media_urls ?? [],
      category: draft.category ?? "other",
      topic: resolveNewsTopic(draft.topic, draft.category ?? "other", draft.article_kind),
      verificationStatus: null,
      publishedAt: draft.published_at,
      sources: [],
    };
  }

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
    articleKind: draft.article_kind,
    bodyMarkdown: draft.body_markdown,
    relatedMediaUrls: draft.related_media_urls ?? [],
    category: event?.category ?? "other",
    topic: resolveNewsTopic(draft.topic, event?.category ?? "other", draft.article_kind),
    verificationStatus: event?.verification_status ?? "unverified",
    publishedAt: draft.published_at,
    sources,
  };
}
