import type { PublicArticleDetail } from "@/lib/news/public-articles";
import { NEWS_TOPIC_LABEL } from "@/lib/news/constants";

// 記事ページのシェア用画像(og:image / twitter:image)をどれにするかを決める唯一の場所。
// 今は全記事で「見出しから自動生成した画像」(/og/news/[articleId])を使う。
// 後で管理画面から画像を差し替えられるようにするときは、ここで
// 「記事に差し替え画像があればそのURL、無ければ自動生成」と分岐させるだけでよい。

export const SHARE_IMAGE_SIZE = { width: 1200, height: 630 } as const;

// 画像のデザインを変えたら数字を上げる(XなどのSNSや配信網に残った古い画像を使わせないため)
const TEMPLATE_VERSION = 2;

export interface ShareImage {
  url: string;
  width: number;
  height: number;
  alt: string;
}

/** 画像に載せるカテゴリ名。BREAKING の記事はカテゴリより優先して BREAKING と出す */
export function shareImageCategory(article: Pick<PublicArticleDetail, "topic" | "articleType">): string | null {
  if (article.articleType === "breaking") return "BREAKING";
  return article.topic ? NEWS_TOPIC_LABEL[article.topic] : null;
}

// 画像に載る内容が変わったときだけURLが変わるようにする(同じ内容なら配信網のキャッシュをそのまま使う)
function contentVersion(article: PublicArticleDetail): string {
  const source = [TEMPLATE_VERSION, article.headlineJa, shareImageCategory(article) ?? "", article.publishedAt ?? ""].join("|");
  let hash = 5381;
  for (let i = 0; i < source.length; i++) {
    hash = ((hash << 5) + hash + source.charCodeAt(i)) >>> 0;
  }
  return hash.toString(36);
}

export function articleShareImage(article: PublicArticleDetail): ShareImage {
  return {
    url: `/og/news/${article.id}?v=${contentVersion(article)}`,
    ...SHARE_IMAGE_SIZE,
    alt: article.headlineJa,
  };
}
