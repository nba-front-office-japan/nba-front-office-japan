import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { bodyMediaProblem } from "@/lib/news/body-media";
import {
  ARTICLE_DRAFT_STATUS_LABEL,
  ARTICLE_KIND_OPTIONS,
  ARTICLE_TYPE_OPTIONS,
  NEWS_TOPIC_LABEL,
  NEWS_TOPIC_OPTIONS,
} from "@/lib/news/constants";
import { validatePublishedAtInput } from "@/lib/news/jst-datetime";
import { validateRelatedMediaInputs } from "@/lib/news/related-media";
import { SITE_URL } from "@/lib/site";
import type { ArticleDraftStatus, ArticleKind, ArticleType, Database, NewsEventCategory, NewsTopic } from "@/lib/supabase/types";

// 入稿API(app/api/ingest)の共通部品。認証・応答の形・入力の検証を1か所にまとめる。
// proxy.ts のBasic認証は /admin 配下だけが対象なので、ここは Authorization: Bearer で独自に認証する。
// INGEST_API_TOKEN が未設定のときは、常に401を返す。トークンはログに出さない。

type DraftRow = Database["public"]["Tables"]["article_drafts"]["Row"];

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 500;

function sha256(value: string) {
  return createHash("sha256").update(value).digest();
}

// 長さの違いも漏らさないよう、ハッシュ同士を定数時間で比較する
export function isIngestAuthorized(request: Request): boolean {
  const token = process.env.INGEST_API_TOKEN;
  if (!token) return false;
  return timingSafeEqual(sha256(request.headers.get("authorization") ?? ""), sha256(`Bearer ${token}`));
}

export function fail(error: string, status: number, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ ok: false, error, ...extra }, { status });
}

export function unauthorized() {
  return fail("unauthorized", 401);
}

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

/** リクエスト本文のJSONオブジェクト。読めなければ null */
export async function readJsonObject(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const body: unknown = await request.json();
    return body !== null && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** ?limit= の値。指定がないときは100件、上限は500件。数値でなければ null */
export function parseLimit(value: string | null): number | null {
  if (value === null) return DEFAULT_LIMIT;
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 ? Math.min(n, MAX_LIMIT) : null;
}

export function draftEditUrl(id: string): string {
  return `${SITE_URL}/admin/news/drafts/${id}`;
}

export function articlePublicUrl(id: string): string {
  return `${SITE_URL}/news/${id}`;
}

/** 選択肢の値(contract)でも表示名(契約・移籍)でも受け付ける */
function pickOption<T extends string>(raw: string, options: { value: T; label: string }[]): T | null {
  const text = raw.trim().toLowerCase();
  return options.find((o) => o.value === text || o.label.toLowerCase() === text)?.value ?? null;
}

const DRAFT_STATUS_OPTIONS = (Object.keys(ARTICLE_DRAFT_STATUS_LABEL) as ArticleDraftStatus[]).map((value) => ({
  value,
  label: ARTICLE_DRAFT_STATUS_LABEL[value],
}));

export function parseDraftStatus(raw: string): ArticleDraftStatus | null {
  return pickOption(raw, DRAFT_STATUS_OPTIONS);
}

// イベントのない下書きには、収集時の内部カテゴリ(article_drafts.category)が必須。公開カテゴリから決める
const TOPIC_TO_CATEGORY: Record<NewsTopic, NewsEventCategory> = {
  contract: "contract",
  injury: "injury",
  game: "other",
  interview: "interview",
  column: "analysis",
  league: "other",
  offcourt: "other",
  rumor: "rumor",
};

export type DraftInput = {
  eventId: string | null;
  headline: string;
  subheadline: string | null;
  articleKind: ArticleKind;
  topic: NewsTopic | null;
  internalCategory: NewsEventCategory;
  articleType: ArticleType;
  publishedAt: string | null;
  body: string;
  mediaUrls: string[];
  sources: string | null;
  editorNote: string | null;
};

/** 任意の文字列項目。未指定は null、文字列以外は undefined(エラー) */
function optionalText(value: unknown): string | null | undefined {
  if (value === undefined || value === null) return null;
  return typeof value === "string" ? value : undefined;
}

/** POST /api/ingest/drafts の本文を検証する。管理画面の保存と同じ検証を使う */
export function parseDraftInput(body: Record<string, unknown>): DraftInput | { error: string } {
  if (typeof body.headline !== "string" || !body.headline.trim()) return { error: "headline は必須です。" };
  if (body.eventId !== undefined && body.eventId !== null && !isUuid(body.eventId)) return { error: "eventId の形式が不正です。" };

  const texts = {
    subheadline: optionalText(body.subheadline),
    type: optionalText(body.type),
    category: optionalText(body.category),
    format: optionalText(body.format),
    publishDate: optionalText(body.publishDate),
    body: optionalText(body.body),
    sources: optionalText(body.sources),
    editorNote: optionalText(body.editorNote),
  };
  for (const [name, value] of Object.entries(texts)) {
    if (value === undefined) return { error: `${name} は文字列で指定してください。` };
  }

  const articleKind = texts.type ? pickOption(texts.type, ARTICLE_KIND_OPTIONS) : "news";
  if (!articleKind) return { error: `type は ${ARTICLE_KIND_OPTIONS.map((o) => o.label).join(" / ")} のどれかにしてください。` };

  const topic = texts.category ? pickOption(texts.category, NEWS_TOPIC_OPTIONS) : null;
  if (texts.category && !topic) return { error: `category は ${NEWS_TOPIC_OPTIONS.map((o) => o.label).join(" / ")} のどれかにしてください。` };

  const articleType = texts.format ? pickOption(texts.format, ARTICLE_TYPE_OPTIONS) : "standard";
  if (!articleType) return { error: `format は ${ARTICLE_TYPE_OPTIONS.map((o) => o.label).join(" / ")} のどれかにしてください。` };

  // 投稿日は管理画面と同じ形(日本時間の "YYYY-MM-DDTHH:mm")。未指定なら公開した時点の日時になる
  let publishedAt: string | null = null;
  if (texts.publishDate) {
    const checked = validatePublishedAtInput(texts.publishDate);
    if ("error" in checked) return { error: `publishDate: ${checked.error}（形式は YYYY-MM-DDTHH:mm）` };
    publishedAt = checked.iso;
  }

  if (body.mediaUrls !== undefined && body.mediaUrls !== null) {
    if (!Array.isArray(body.mediaUrls) || body.mediaUrls.some((u) => typeof u !== "string")) {
      return { error: "mediaUrls は文字列の配列で指定してください。" };
    }
  }
  const media = validateRelatedMediaInputs((body.mediaUrls as string[] | undefined | null) ?? []);
  if ("error" in media) return { error: media.error };

  const bodyText = texts.body ?? "";
  // 本文中のメディア([[media:URL]])の URL と、本文中・本文末を合わせた件数を確かめる
  const bodyMediaError = bodyMediaProblem(bodyText, media.urls);
  if (bodyMediaError) return { error: bodyMediaError };

  return {
    eventId: isUuid(body.eventId) ? body.eventId : null,
    headline: body.headline.trim(),
    subheadline: texts.subheadline?.trim() || null,
    articleKind,
    topic,
    internalCategory: topic ? TOPIC_TO_CATEGORY[topic] : "other",
    articleType,
    publishedAt,
    body: bodyText,
    mediaUrls: media.urls,
    sources: texts.sources ?? null,
    editorNote: texts.editorNote?.trim() || null,
  };
}

type DraftSummaryRow = Pick<
  DraftRow,
  "id" | "event_id" | "status" | "headline_ja" | "dek_ja" | "article_kind" | "article_type" | "topic" | "published_at" | "created_at" | "updated_at"
>;

export const DRAFT_SUMMARY_COLUMNS = "id, event_id, status, headline_ja, dek_ja, article_kind, article_type, topic, published_at, created_at, updated_at";

/** 下書き1件の応答(一覧用) */
export function draftSummary(d: DraftSummaryRow) {
  return {
    id: d.id,
    status: d.status,
    statusLabel: ARTICLE_DRAFT_STATUS_LABEL[d.status],
    eventId: d.event_id,
    headline: d.headline_ja,
    subheadline: d.dek_ja,
    type: ARTICLE_KIND_OPTIONS.find((o) => o.value === d.article_kind)?.label ?? d.article_kind,
    category: d.topic ? NEWS_TOPIC_LABEL[d.topic] : null,
    format: ARTICLE_TYPE_OPTIONS.find((o) => o.value === d.article_type)?.label ?? d.article_type,
    publishDate: d.published_at,
    createdAt: d.created_at,
    updatedAt: d.updated_at,
    editUrl: draftEditUrl(d.id),
    publicUrl: d.status === "published" ? articlePublicUrl(d.id) : null,
  };
}

/** 下書き1件の応答(詳細用) */
export function draftDetail(d: DraftRow) {
  return {
    ...draftSummary(d),
    body: d.body_markdown,
    mediaUrls: d.related_media_urls ?? [],
    sources: d.source_attribution_markdown,
    editorNote: d.editor_notes,
  };
}
