// 公式YouTubeの動画の登録と、動画まとめページ(/videos)への集約。
// 登録は選手ごとに1本1行: 人気選手は lib/featured-players*.ts の videos、レジェンド(/legends 側が本体の選手)は
// lib/legends/videos.ts。/videos・トップの新着動画はここから自動で集めるので、同じ動画を二か所に書かない。
import { parseRelatedMediaUrl, type RelatedMedia } from "@/lib/news/related-media";
import { ALL_FEATURED_PLAYERS, type FeaturedPlayer } from "@/lib/featured-players";
import { LEGEND_VIDEOS } from "@/lib/legends/videos";
import { legendBySlug } from "@/lib/legends/data";

/**
 * 動画1本の登録(1行)。タイトルは YouTube の表示どおり、date は公開日(YYYY-MM-DD。/videos の新しい順に使い、公開日(日本時間)より前は選手ページにも /videos にも出さない)。
 * 英語版は lang: "en" を付ける(/videos に「English」の印を出す)。
 * 縦型のショートは https://www.youtube.com/shorts/動画ID の形で書くと縦長で表示する
 */
export type VideoEntry = { url: string; title: string; date: string; lang?: "en" };

/** 選手ページの動画欄に書ける形。URLだけの古い書き方は選手ページには出るが、/videos には集めない(タイトル・日付が無いため) */
export type VideoInput = string | VideoEntry;

export type YouTubeMedia = Extract<RelatedMedia, { kind: "youtube" }>;

/** 関連コラム・記事へのリンク */
export type VideoColumn = { title: string; href: string };

export type SiteVideo = {
  media: YouTubeMedia;
  title: string;
  date: string;
  lang: "ja" | "en";
  /** 選手(人気選手は選手名鑑の英語名で選手ページを探す。レジェンドは /legends/slug) */
  player: { kind: "featured"; nameJa: string; featured: FeaturedPlayer } | { kind: "legend"; nameJa: string; slug: string };
  columns: VideoColumn[];
};

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** 今日の日付(日本時間 YYYY-MM-DD) */
function todayJst(): string {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/** 公開日が来ている登録か(公開前の動画は、先に登録しておいても公開日(日本時間)まで出さない) */
function isReleased(input: VideoInput): boolean {
  return typeof input === "string" || !DATE.test(input.date) || input.date <= todayJst();
}

/** 登録1行を検証して YouTube の動画にする。使えない URL は null(ニュースの関連メディアと同じ検証) */
export function parseVideoInput(input: VideoInput): YouTubeMedia | null {
  const m = parseRelatedMediaUrl(typeof input === "string" ? input : input.url);
  return m && m.kind === "youtube" ? m : null;
}

/** 選手ページの動画欄に出す動画(URLだけの書き方も含む) */
export function playerVideoMedia(inputs: VideoInput[] | undefined): YouTubeMedia[] {
  return (inputs ?? []).filter(isReleased).map(parseVideoInput).filter((m): m is YouTubeMedia => m !== null);
}

function toSiteVideos(inputs: VideoInput[] | undefined, player: SiteVideo["player"], columns: VideoColumn[]): SiteVideo[] {
  return (inputs ?? []).flatMap((input) => {
    if (typeof input === "string" || !input.title || !DATE.test(input.date) || !isReleased(input)) return [];
    const media = parseVideoInput(input);
    return media ? [{ media, title: input.title, date: input.date, lang: input.lang ?? "ja", player, columns }] : [];
  });
}

/** 登録済みの動画をすべて新しい順に(同じ日は登録の後ろのものを先に) */
export function allSiteVideos(): SiteVideo[] {
  const featured = ALL_FEATURED_PLAYERS.flatMap((fp) =>
    toSiteVideos(fp.videos, { kind: "featured", nameJa: fp.nameJa, featured: fp }, fp.columns ?? []),
  );
  const legends = Object.entries(LEGEND_VIDEOS).flatMap(([slug, reg]) => {
    const l = legendBySlug(slug);
    return l ? toSiteVideos(reg.videos, { kind: "legend", nameJa: l.nameJa, slug }, reg.columns ?? []) : [];
  });
  return [...featured, ...legends]
    .map((v, i) => ({ v, i }))
    .sort((a, b) => b.v.date.localeCompare(a.v.date) || b.i - a.i)
    .map(({ v }) => v);
}

/** サムネイル(YouTube の画像。動画IDから決まる) */
export function videoThumbnail(media: YouTubeMedia): string {
  return `https://i.ytimg.com/vi/${media.videoId}/hqdefault.jpg`;
}

/** 2026-11-17 → 2026年11月17日 */
export function formatVideoDate(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return `${y}年${m}月${d}日`;
}
