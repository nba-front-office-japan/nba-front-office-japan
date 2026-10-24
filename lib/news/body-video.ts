// 記事本文の途中に入れる MP4 動画(管理画面の「メディア挿入」からアップロードしたもの)。
// 動画は Supabase Storage の news-media バケット(公開読み取り・video/mp4 のみ・1ファイル50MBまで)に置き、
// 本文には、空行で区切った1段落として [[video:公開URL]] の形で保存する(生のHTMLは使わない)。
// 動画として表示するのは、段落全体がこの形で、URL がこのサイトの news-media バケットの videos/ の MP4 のものだけ。
// それ以外(ほかのサイトの URL・形の違うもの・文中の [[video:…]])は通常の文字のまま表示する。
// サーバー・クライアント共通の純粋な関数。

/** 動画を置く Storage のバケット(supabase で作成済み。公開読み取り・video/mp4 のみ・50MBまで) */
export const NEWS_MEDIA_BUCKET = "news-media";

/** 1ファイルの上限(バケットの file_size_limit と同じ 50MB。Supabase の無料プランの1ファイルの上限) */
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

const VIDEO_MARKER_RE = /^\[\[video:([^\s[\]]+)\]\]$/;
// バケット内の置き場所: videos/ランダムなID.mp4
const VIDEO_PATH_RE = /^videos\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.mp4$/;

/** バケット内の置き場所(新しい動画ごとにランダムな名前にする) */
export function newVideoPath(): string {
  return `videos/${crypto.randomUUID()}.mp4`;
}

/** 公開URLの先頭(https://<project>.supabase.co/storage/v1/object/public/news-media/) */
function publicUrlPrefix(): string {
  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/+$/, "");
  return `${base}/storage/v1/object/public/${NEWS_MEDIA_BUCKET}/`;
}

/** news-media バケット内の置き場所 → 公開URL(動画・写真で共通) */
export function newsMediaPublicUrl(path: string): string {
  return `${publicUrlPrefix()}${path}`;
}

/** このサイトの news-media バケットの公開URLなら、バケット内の置き場所を返す(それ以外は null。動画・写真で共通) */
export function newsMediaPathOf(url: string): string | null {
  const prefix = publicUrlPrefix();
  return url.startsWith(prefix) ? url.slice(prefix.length) : null;
}

/** バケット内の置き場所 → 公開URL */
export function videoPublicUrl(path: string): string {
  return newsMediaPublicUrl(path);
}

/** このサイトの news-media バケットの動画の公開URLなら、その URL を返す(それ以外は null) */
export function parseBodyVideoUrl(url: string): string | null {
  const path = newsMediaPathOf(url);
  return path !== null && VIDEO_PATH_RE.test(path) ? url : null;
}

/** 本文に入れる動画の段落 */
export function toVideoMarker(url: string): string {
  return `[[video:${url}]]`;
}

/** 段落が [[video:URL]] の形なら、その URL(未検証)を返す */
export function videoMarkerUrlOf(paragraph: string): string | null {
  return VIDEO_MARKER_RE.exec(paragraph.trim())?.[1] ?? null;
}

/** ファイルの大きさの表示(例: 12.3MB) */
export function formatMegabytes(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

/**
 * アップロードする前の確認(ファイル名・種類・大きさ)。問題があればエラー文を返す。
 * 管理画面(ブラウザ)と、アップロード用URLを発行するサーバー処理の両方で使う
 */
export function videoFileProblem(file: { name: string; type: string; size: number }): string | null {
  const isMp4Name = /\.mp4$/i.test(file.name);
  // ブラウザによっては種類が空のことがあるため、空のときはファイル名だけで判断する
  const isMp4Type = file.type === "" || file.type === "video/mp4";
  if (!isMp4Name || !isMp4Type) {
    return `MP4ファイル（.mp4）だけアップロードできます（選択したファイル：${file.name}${file.type ? `、種類 ${file.type}` : ""}）。`;
  }
  if (file.size <= 0) return "ファイルが空です。別のファイルを選んでください。";
  if (file.size > MAX_VIDEO_BYTES) {
    return `動画は1ファイル${formatMegabytes(MAX_VIDEO_BYTES)}までです（選択したファイル：${formatMegabytes(file.size)}）。短くするか、圧縮してからアップロードしてください。`;
  }
  return null;
}

/** ファイルの先頭がMP4の形(4〜8バイト目が "ftyp")か。拡張子だけ .mp4 にした別の形式のファイルを防ぐ */
export function looksLikeMp4(head: Uint8Array): boolean {
  return head.length >= 8 && String.fromCharCode(head[4], head[5], head[6], head[7]) === "ftyp";
}
