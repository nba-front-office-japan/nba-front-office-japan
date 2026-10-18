// ニュース記事の「関連メディア」(公開Xポスト・YouTube動画・Instagram投稿/リール・TikTok動画)の URL の検証と正規化。
// 管理画面の保存時と公開ページの表示時の両方で使う(サーバー・クライアント共通の純粋な関数)。
// 受け付けるのは次の形だけで、HTML・埋め込みコード・プロフィールURL・その他の外部URLは扱わない:
//   Xポスト        : x.com / twitter.com(www・mobile も可)の /ユーザー名/status/数字
//   YouTube動画    : youtube.com/watch?v=動画ID(www・m も可)、youtu.be/動画ID
//   YouTube Shorts : youtube.com/shorts/動画ID
//   Instagram      : instagram.com(www・m も可)の /p/投稿ID・/reel/投稿ID・/reels/投稿ID・/tv/投稿ID
//                    (/ユーザー名/p/投稿ID の形も可)
//   TikTok         : tiktok.com(www・m も可)の /@ユーザー名/video/数字。短縮URL(vm.tiktok.com / vt.tiktok.com)は
//                    元の動画を調べるのに TikTok へのアクセスが必要なため、受け付けない
// 保存する形(DB の制約と同じ): https://x.com/ユーザー名/status/数字 ／ https://www.youtube.com/watch?v=動画ID ／
//   https://www.youtube.com/shorts/動画ID ／ https://www.instagram.com/p|reel|tv/投稿ID/ ／ https://www.tiktok.com/@ユーザー名/video/数字

/** 記事ごとに登録できる関連メディアの上限(本文中・本文末の合計) */
export const MAX_RELATED_MEDIA = 5;

export type RelatedMedia =
  | { kind: "x"; url: string; user: string; postId: string }
  | { kind: "youtube"; url: string; videoId: string; shorts: boolean }
  | { kind: "instagram"; url: string; code: string; postType: "p" | "reel" | "tv" }
  | { kind: "tiktok"; url: string; user: string; videoId: string };

/** 使えるメディアの案内(入力欄のエラー表示で共通に使う) */
export const SUPPORTED_MEDIA_HINT =
  "Xの公開ポスト（https://x.com/ユーザー名/status/数字）、YouTubeの動画・Shorts、Instagramの公開投稿・リール（https://www.instagram.com/p/… または /reel/…）、TikTokの公開動画（https://www.tiktok.com/@ユーザー名/video/数字）のURLを入力してください。";

/** メディアの種類の表示名 */
export function mediaLabel(media: RelatedMedia): string {
  if (media.kind === "x") return "Xポスト";
  if (media.kind === "youtube") return media.shorts ? "YouTube Shorts" : "YouTube動画";
  if (media.kind === "instagram") return media.postType === "reel" ? "Instagramリール" : "Instagram投稿";
  return "TikTok動画";
}

/** 使えない URL のうち、理由を個別に案内できるもの(TikTokの短縮URL・プロフィールURLなど)。なければ null */
export function unsupportedMediaReason(input: string): string | null {
  let host = "";
  try {
    host = new URL(input.trim()).hostname.toLowerCase();
  } catch {
    return null;
  }
  if (host === "vm.tiktok.com" || host === "vt.tiktok.com") {
    return "TikTokの短縮URLは使えません。ブラウザで動画を開き、https://www.tiktok.com/@ユーザー名/video/数字 の形のURLを貼り付けてください。";
  }
  if (INSTAGRAM_HOSTS.has(host)) return "Instagramは公開投稿・リールのURL（https://www.instagram.com/p/… または /reel/…）だけを使えます。プロフィールなどのURLは使えません。";
  if (TIKTOK_HOSTS.has(host)) return "TikTokは公開動画のURL（https://www.tiktok.com/@ユーザー名/video/数字）だけを使えます。プロフィールなどのURLは使えません。";
  return null;
}

const X_HOSTS = new Set(["x.com", "www.x.com", "mobile.x.com", "twitter.com", "www.twitter.com", "mobile.twitter.com"]);
const YOUTUBE_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com"]);
const X_USER = /^[A-Za-z0-9_]{1,15}$/;
const X_POST_ID = /^[0-9]{1,20}$/;
const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const INSTAGRAM_HOSTS = new Set(["instagram.com", "www.instagram.com", "m.instagram.com"]);
const INSTAGRAM_CODE = /^[A-Za-z0-9_-]{5,40}$/;
const INSTAGRAM_USER = /^[A-Za-z0-9_.]{1,30}$/;
const INSTAGRAM_TYPES: Record<string, "p" | "reel" | "tv"> = { p: "p", reel: "reel", reels: "reel", tv: "tv" };
const TIKTOK_HOSTS = new Set(["tiktok.com", "www.tiktok.com", "m.tiktok.com"]);
const TIKTOK_USER = /^@[A-Za-z0-9_.]{1,24}$/;
const TIKTOK_VIDEO_ID = /^[0-9]{10,25}$/;

/** URL を検証し、関連メディアとして使える場合は正規化した情報を返す。使えない URL は null */
export function parseRelatedMediaUrl(input: string): RelatedMedia | null {
  let u: URL;
  try {
    u = new URL(input.trim());
  } catch {
    return null;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  if (u.username || u.password || u.port) return null;
  const host = u.hostname.toLowerCase();
  const parts = u.pathname.split("/").filter(Boolean);

  if (X_HOSTS.has(host)) {
    // /ユーザー名/status/数字(末尾の /photo/1 などは無視する)
    const [user, status, postId] = parts;
    if (!user || status !== "status" || !postId || !X_USER.test(user) || !X_POST_ID.test(postId)) return null;
    if (user.toLowerCase() === "i") return null;
    return { kind: "x", url: `https://x.com/${user}/status/${postId}`, user, postId };
  }

  if (host === "youtu.be") {
    const videoId = parts[0];
    if (parts.length !== 1 || !videoId || !YOUTUBE_ID.test(videoId)) return null;
    return { kind: "youtube", url: `https://www.youtube.com/watch?v=${videoId}`, videoId, shorts: false };
  }

  if (YOUTUBE_HOSTS.has(host)) {
    if (parts.length === 1 && parts[0] === "watch") {
      const videoId = u.searchParams.get("v");
      if (!videoId || !YOUTUBE_ID.test(videoId)) return null;
      return { kind: "youtube", url: `https://www.youtube.com/watch?v=${videoId}`, videoId, shorts: false };
    }
    if (parts.length === 2 && parts[0] === "shorts" && YOUTUBE_ID.test(parts[1])) {
      return { kind: "youtube", url: `https://www.youtube.com/shorts/${parts[1]}`, videoId: parts[1], shorts: true };
    }
  }

  if (INSTAGRAM_HOSTS.has(host)) {
    // /p/投稿ID・/reel/投稿ID・/reels/投稿ID・/tv/投稿ID(/ユーザー名/p/投稿ID も可。末尾の / やクエリは無視する)
    const [a, b, c] = parts;
    const typed = parts.length === 2 ? [a, b] : parts.length === 3 && INSTAGRAM_USER.test(a) ? [b, c] : null;
    if (!typed) return null;
    const postType = INSTAGRAM_TYPES[typed[0]];
    const code = typed[1];
    if (!postType || !INSTAGRAM_CODE.test(code)) return null;
    return { kind: "instagram", url: `https://www.instagram.com/${postType}/${code}/`, code, postType };
  }

  if (TIKTOK_HOSTS.has(host)) {
    // /@ユーザー名/video/数字(クエリは無視する)
    const [user, video, videoId] = parts;
    if (parts.length !== 3 || video !== "video" || !TIKTOK_USER.test(user) || !TIKTOK_VIDEO_ID.test(videoId)) return null;
    return { kind: "tiktok", url: `https://www.tiktok.com/${user}/video/${videoId}`, user: user.slice(1), videoId };
  }
  return null;
}

/** 保存済みの値を表示用に読む。正規化済みの形でないもの・上限を超えた分は表示しない */
export function readStoredRelatedMedia(urls: readonly string[] | null | undefined): RelatedMedia[] {
  const out: RelatedMedia[] = [];
  for (const url of urls ?? []) {
    const media = parseRelatedMediaUrl(url);
    if (media && media.url === url && !out.some((m) => m.url === media.url)) out.push(media);
    if (out.length >= MAX_RELATED_MEDIA) break;
  }
  return out;
}

/** 管理画面の入力(空欄を除く)を検証する。問題があればエラー文、なければ正規化した URL の配列 */
export function validateRelatedMediaInputs(inputs: string[]): { urls: string[] } | { error: string } {
  // 入力欄の番号(何件目の欄か)をエラー文に出すため、空欄も番号を数える
  const filled = inputs.map((s, i) => ({ raw: s.trim(), i })).filter((x) => x.raw !== "");
  if (filled.length > MAX_RELATED_MEDIA) return { error: `関連メディアURLは${MAX_RELATED_MEDIA}件までです。` };
  const urls: string[] = [];
  for (const { raw, i } of filled) {
    const media = parseRelatedMediaUrl(raw);
    if (!media) {
      return {
        error: `関連メディアURL（${i + 1}件目）「${raw}」は使えません。${unsupportedMediaReason(raw) ?? SUPPORTED_MEDIA_HINT}`,
      };
    }
    if (urls.includes(media.url)) return { error: `関連メディアURL「${raw}」が重複しています。` };
    urls.push(media.url);
  }
  return { urls };
}
