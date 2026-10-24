// 記事本文の途中に入れる写真(管理画面の「メディア挿入」からアップロードしたもの)。
// 写真は Supabase Storage の news-media バケット(公開読み取り。JPEG / PNG / WebP / GIF と MP4 を受け付ける)の images/ に置き、
// 本文には、空行で区切った1段落として [[image:公開URL|代替テキスト]] の形で保存する(生のHTMLは使わない)。
// 代替テキストはアップロードしたファイル名から作る(拡張子と記号を除き、100文字まで)。
// 写真として表示するのは、段落全体がこの形で、URL がこのサイトの news-media バケットの images/ の写真のものだけ。
// それ以外は通常の文字のまま表示する。サーバー・クライアント共通の純粋な関数。
// 1ファイルの上限は10MB(バケットの上限は動画に合わせた50MBのため、管理画面とアップロード用URLの発行時に確かめる)。

import { formatMegabytes, newsMediaPathOf } from "./body-video";

/** 写真の1ファイルの上限 */
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

/** 受け付ける写真の形式(拡張子・種類)。SVG はスクリプトを含められるため受け付けない */
const IMAGE_FORMATS = [
  { ext: "jpg", mime: "image/jpeg", names: ["jpg", "jpeg"], label: "JPEG" },
  { ext: "png", mime: "image/png", names: ["png"], label: "PNG" },
  { ext: "webp", mime: "image/webp", names: ["webp"], label: "WebP" },
  { ext: "gif", mime: "image/gif", names: ["gif"], label: "GIF" },
] as const;
type ImageFormat = (typeof IMAGE_FORMATS)[number];

/** ファイル選択の accept に使う値 */
export const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif";

const IMAGE_MARKER_RE = /^\[\[image:([^\s[\]|]+)\|([^\]\n]*)\]\]$/;
// バケット内の置き場所: images/ランダムなID.拡張子
const IMAGE_PATH_RE = /^images\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp|gif)$/;

function formatOfName(name: string): ImageFormat | null {
  const ext = /\.([a-z0-9]+)$/i.exec(name)?.[1]?.toLowerCase();
  return IMAGE_FORMATS.find((f) => (f.names as readonly string[]).includes(ext ?? "")) ?? null;
}

/** アップロードする写真の種類(video/mp4 と同じく、Storage へ送るときの Content-Type)。対応外なら null */
export function imageMimeOf(name: string): string | null {
  return formatOfName(name)?.mime ?? null;
}

/** バケット内の置き場所(新しい写真ごとにランダムな名前にする)。対応外の形式なら null */
export function newImagePath(name: string): string | null {
  const format = formatOfName(name);
  return format ? `images/${crypto.randomUUID()}.${format.ext}` : null;
}

/** このサイトの news-media バケットの写真の公開URLなら、その URL を返す(それ以外は null) */
export function parseBodyImageUrl(url: string): string | null {
  const path = newsMediaPathOf(url);
  return path !== null && IMAGE_PATH_RE.test(path) ? url : null;
}

/**
 * ファイル名から代替テキストを作る。拡張子を除き、本文の書式に使う記号([ ] | * # < > など)と制御文字を空白にし、
 * 空白をまとめて100文字までにする。何も残らなければ「記事の画像」
 */
export function imageAltFromFileName(name: string): string {
  const base = [...name.replace(/\.[a-z0-9]+$/i, "")]
    .map((c) => (c.charCodeAt(0) < 0x20 || c.charCodeAt(0) === 0x7f ? " " : c))
    .join("");
  const cleaned = base
    .replace(/[[\]|*#<>`\\]/g, " ")
    .replace(/[_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100)
    .trim();
  return cleaned || "記事の画像";
}

/** 本文に入れる写真の段落 */
export function toImageMarker(url: string, alt: string): string {
  return `[[image:${url}|${imageAltFromFileName(alt)}]]`;
}

/** 段落が [[image:URL|代替テキスト]] の形なら、その URL(未検証)と代替テキストを返す */
export function imageMarkerOf(paragraph: string): { url: string; alt: string } | null {
  const m = IMAGE_MARKER_RE.exec(paragraph.trim());
  return m ? { url: m[1], alt: m[2].trim() || "記事の画像" } : null;
}

/**
 * アップロードする前の確認(ファイル名・種類・大きさ)。問題があればエラー文を返す。
 * 管理画面(ブラウザ)と、アップロード用URLを発行するサーバー処理の両方で使う
 */
export function imageFileProblem(file: { name: string; type: string; size: number }): string | null {
  const format = formatOfName(file.name);
  // ブラウザによっては種類が空のことがあるため、空のときはファイル名だけで判断する
  if (!format || (file.type !== "" && file.type !== format.mime)) {
    return `写真は JPEG・PNG・WebP・GIF（.jpg / .jpeg / .png / .webp / .gif）だけアップロードできます（選択したファイル：${file.name}${file.type ? `、種類 ${file.type}` : ""}）。`;
  }
  if (file.size <= 0) return "ファイルが空です。別のファイルを選んでください。";
  if (file.size > MAX_IMAGE_BYTES) {
    return `写真は1ファイル${formatMegabytes(MAX_IMAGE_BYTES)}までです（選択したファイル：${formatMegabytes(file.size)}）。小さくしてからアップロードしてください。`;
  }
  return null;
}

/** ファイルの先頭が、ファイル名の形式の写真の形(署名)になっているか。拡張子だけ変えた別の形式のファイルを防ぐ */
export function looksLikeImage(name: string, head: Uint8Array): boolean {
  const format = formatOfName(name);
  const ascii = (from: number, to: number) => String.fromCharCode(...head.slice(from, to));
  if (!format) return false;
  if (format.ext === "jpg") return head.length >= 3 && head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff;
  if (format.ext === "png") return head.length >= 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((b, i) => head[i] === b);
  if (format.ext === "webp") return head.length >= 12 && ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP";
  return head.length >= 6 && (ascii(0, 6) === "GIF87a" || ascii(0, 6) === "GIF89a");
}
