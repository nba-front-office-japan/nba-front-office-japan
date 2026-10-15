// 記事本文の途中に入れるメディア(Xポスト・YouTube動画)。
// 本文には、空行で区切った1段落として [[media:URL]] の形で保存する(生のHTMLや埋め込みコードは使わない)。
// 管理画面の「メディア挿入」ボタンがこの形で挿入する。
// 埋め込みとして扱うのは、段落全体がこの形で、かつ URL が lib/news/related-media.ts の検証を通るもの(公開Xポスト・
// YouTube動画・Shorts)だけ。それ以外(URL をそのまま書いた行、対応外の URL、文中の [[media:…]])は通常の文字のまま表示する。
// 本文末の関連メディア(article_drafts.related_media_urls)と合わせて最大 MAX_RELATED_MEDIA 件までを埋め込む。

import { MAX_RELATED_MEDIA, parseRelatedMediaUrl, readStoredRelatedMedia, type RelatedMedia } from "./related-media";

const MARKER_RE = /^\[\[media:([^\s[\]]+)\]\]$/;

/** 本文に入れるメディアの段落(正規化した URL を入れる) */
export function toMediaMarker(url: string): string {
  return `[[media:${url}]]`;
}

/** 本文を段落に分ける(空行区切り。公開ページの本文表示と同じ区切り方) */
export function splitParagraphs(body: string): string[] {
  return body
    .split(/\r?\n[ \t]*\r?\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/** 段落が [[media:URL]] の形なら、その URL(未検証)を返す */
export function markerUrlOf(paragraph: string): string | null {
  return MARKER_RE.exec(paragraph.trim())?.[1] ?? null;
}

export type BodyBlock = { kind: "text"; text: string } | { kind: "media"; media: RelatedMedia };

/**
 * 段落ごとに、文字の段落か埋め込むメディアかを決める。
 * 埋め込むのは、対応する URL(正規化済みの形と一致するもの)で、まだ出ていないものだけ。上限を超えた分・重複・
 * 対応外の URL は、書かれたとおりの文字として表示する。
 */
export function toBodyBlocks(paragraphs: string[]): BodyBlock[] {
  const seen = new Set<string>();
  return paragraphs.map((text) => {
    const url = markerUrlOf(text);
    const media = url ? parseRelatedMediaUrl(url) : null;
    if (media && media.url === url && !seen.has(media.url) && seen.size < MAX_RELATED_MEDIA) {
      seen.add(media.url);
      return { kind: "media", media };
    }
    return { kind: "text", text };
  });
}

/** 本文中で埋め込まれるメディア(出てくる順) */
export function bodyMediaOf(body: string): RelatedMedia[] {
  return toBodyBlocks(splitParagraphs(body)).flatMap((b) => (b.kind === "media" ? [b.media] : []));
}

/**
 * 本文末に表示する関連メディア。本文中に入れたものは除き(末尾に重複して出さない)、
 * 本文中と合わせて最大 MAX_RELATED_MEDIA 件までにする。本文中にメディアがない既存の記事は、今までどおり全件を表示する。
 */
export function trailingRelatedMedia(body: string, relatedMediaUrls: readonly string[] | null | undefined): RelatedMedia[] {
  const inBody = bodyMediaOf(body);
  const used = new Set(inBody.map((m) => m.url));
  const rest = readStoredRelatedMedia(relatedMediaUrls).filter((m) => !used.has(m.url));
  return rest.slice(0, Math.max(0, MAX_RELATED_MEDIA - inBody.length));
}

/**
 * 保存前の検証。本文中の [[media:…]] 段落の URL がすべて正規化済みの対応 URL か、本文中と本文末(関連メディアURL)を
 * 合わせて MAX_RELATED_MEDIA 件以内かを確かめる。問題があればエラー文を返す
 */
export function bodyMediaProblem(body: string, relatedUrls: string[]): string | null {
  const markers = splitParagraphs(body).flatMap((p) => {
    const url = markerUrlOf(p);
    return url === null ? [] : [url];
  });
  for (const url of markers) {
    const media = parseRelatedMediaUrl(url);
    if (!media || media.url !== url) {
      return `本文中のメディア「${url}」は使えません。「メディア挿入」ボタンから、Xの公開ポストかYouTubeの動画・Shorts のURLで入れ直してください。`;
    }
  }
  const unique = new Set(markers);
  if (unique.size !== markers.length) return "本文中に同じメディアが2回入っています。1回だけにしてください。";
  const total = new Set([...markers, ...relatedUrls]).size;
  if (total > MAX_RELATED_MEDIA) {
    return `本文中のメディアと関連メディアURLは、合わせて${MAX_RELATED_MEDIA}件までです（現在${total}件）。`;
  }
  return null;
}

export type BodySegment = { kind: "text"; text: string } | { kind: "media"; media: RelatedMedia };

/**
 * 本文を、表示する文字の部分と埋め込むメディアに分ける(公開ページ・プレビュー用)。
 * 文字の部分は改行・空行を入力したとおりに残す(本文の入力欄と同じ見え方にするため)。改行は LF にそろえる。
 * 埋め込むメディアの判定は toBodyBlocks と同じ(空行で区切った段落全体が対応する [[media:URL]] のものだけ)。
 * メディアの前後の空行はメディアの上下の余白で表す。末尾のクレジット行(trailingCredit)と末尾の空白は除く。
 */
export function toBodySegments(body: string, trailingCredit: string | null): BodySegment[] {
  // 段落と、段落の間の区切り(空行を含む改行)を交互に持つ。偶数番目が段落、奇数番目が区切り
  const parts = body.replace(/\r\n?/g, "\n").split(/(\n[ \t]*\n(?:[ \t]*\n)*)/);
  // 本文の末尾に手入力したクレジットは、公開ページでは本文の後に1回だけ表示するため除く(保存データは変更しない)
  const compact = (text: string) => text.replace(/\s+/g, "");
  const trimTail = () => {
    while (parts.length > 0 && parts[parts.length - 1].trim() === "") parts.pop();
  };
  trimTail();
  while (trailingCredit && parts.length > 0 && compact(parts[parts.length - 1]) === compact(trailingCredit)) {
    parts.pop();
    trimTail();
  }
  if (parts.length > 0) parts[parts.length - 1] = parts[parts.length - 1].trimEnd();

  const blocks = toBodyBlocks(parts.filter((_, i) => i % 2 === 0).map((p) => p.trim()).filter(Boolean));
  const mediaByMarker = new Map<string, RelatedMedia>();
  for (const b of blocks) if (b.kind === "media") mediaByMarker.set(toMediaMarker(b.media.url), b.media);

  const segments: BodySegment[] = [];
  let text = "";
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const media = i % 2 === 0 ? mediaByMarker.get(part.trim()) : undefined;
    if (media) {
      // メディアの直前の区切り(空行)は除き、メディアの上下の余白で表す
      text = text.replace(/\n[ \t\n]*$/, "");
      if (text) segments.push({ kind: "text", text });
      segments.push({ kind: "media", media });
      mediaByMarker.delete(part.trim());
      text = "";
      i++; // メディアの直後の区切り(空行)も除く
      continue;
    }
    text += part;
  }
  if (text.trim()) segments.push({ kind: "text", text });
  return segments;
}
