import { XMLParser } from "fast-xml-parser";

// RSS 2.0のitemから、保存を許可されたメタデータだけを抜き出す。
// 記事本文（<description>の全文）は保存しない。要約として短く切り詰める。

export interface ParsedRssItem {
  title: string;
  link: string;
  guid: string | null;
  author: string | null;
  summary: string | null;
  rawPublishedAt: string | null;
  publishedAt: string | null;
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  trimValues: true,
});

const SUMMARY_MAX_LENGTH = 280;

function toText(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "object" && "#text" in (value as Record<string, unknown>)) {
    const inner = (value as Record<string, unknown>)["#text"];
    return inner === undefined || inner === null ? null : String(inner);
  }
  return null;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}…`;
}

function parsePublishedAt(raw: string | null): string | null {
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function parseRssFeed(xml: string): ParsedRssItem[] {
  const doc = parser.parse(xml) as {
    rss?: { channel?: { item?: unknown } };
  };
  const channel = doc.rss?.channel;
  if (!channel) return [];

  const rawItem = channel.item;
  const rawItems: Record<string, unknown>[] = Array.isArray(rawItem)
    ? (rawItem as Record<string, unknown>[])
    : rawItem
      ? [rawItem as Record<string, unknown>]
      : [];

  return rawItems
    .map((item): ParsedRssItem => {
      const titleRaw = toText(item.title) ?? "(タイトルなし)";
      const link = (toText(item.link) ?? "").trim();
      const guid = toText(item.guid);
      const author = toText(item["dc:creator"]) ?? toText(item.author);
      const descriptionRaw = toText(item.description);
      const summary = descriptionRaw
        ? truncate(stripHtml(descriptionRaw), SUMMARY_MAX_LENGTH)
        : null;
      const rawPublishedAt = toText(item.pubDate);

      return {
        title: stripHtml(titleRaw),
        link,
        guid,
        author,
        summary,
        rawPublishedAt,
        publishedAt: parsePublishedAt(rawPublishedAt),
      };
    })
    .filter((item) => item.link.length > 0);
}
