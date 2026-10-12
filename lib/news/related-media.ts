// ニュース記事の「関連メディア」(公開Xポスト・YouTube動画)の URL の検証と正規化。
// 管理画面の保存時と公開ページの表示時の両方で使う(サーバー・クライアント共通の純粋な関数)。
// 受け付けるのは次の形だけで、HTML や埋め込みコードは扱わない:
//   Xポスト        : x.com / twitter.com(www・mobile も可)の /ユーザー名/status/数字
//   YouTube動画    : youtube.com/watch?v=動画ID(www・m も可)、youtu.be/動画ID
//   YouTube Shorts : youtube.com/shorts/動画ID
// 保存する形(DB の制約と同じ): https://x.com/ユーザー名/status/数字 ／ https://www.youtube.com/watch?v=動画ID ／ https://www.youtube.com/shorts/動画ID

/** 記事ごとに登録できる関連メディアの上限(X・YouTube合計) */
export const MAX_RELATED_MEDIA = 3;

export type RelatedMedia =
  | { kind: "x"; url: string; user: string; postId: string }
  | { kind: "youtube"; url: string; videoId: string; shorts: boolean };

const X_HOSTS = new Set(["x.com", "www.x.com", "mobile.x.com", "twitter.com", "www.twitter.com", "mobile.twitter.com"]);
const YOUTUBE_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com"]);
const X_USER = /^[A-Za-z0-9_]{1,15}$/;
const X_POST_ID = /^[0-9]{1,20}$/;
const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;

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
        error: `関連メディアURL（${i + 1}件目）「${raw}」は使えません。Xの公開ポスト（https://x.com/ユーザー名/status/数字）か、YouTubeの動画・Shorts のURLを入力してください。`,
      };
    }
    if (urls.includes(media.url)) return { error: `関連メディアURL「${raw}」が重複しています。` };
    urls.push(media.url);
  }
  return { urls };
}
