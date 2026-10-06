// ニュース記事・コラム記事の本文末尾に自動で表示するクレジット。
// 記事ごとの入力ではなく、公開ページ(/news/[articleId])と管理画面のプレビューで共通の部品(components/news/article-body.tsx)が必ず表示する。
// 表記は固定。GUIDE・チーム・選手・サラリーなどの固定ページには表示しない。

import type { ArticleKind } from "@/lib/supabase/types";

export const ARTICLE_CREDIT = "構成●NBA Front Office Japan編集部";

/** クレジットを表示する記事区分(ニュース記事・コラム記事) */
export function showsArticleCredit(kind: ArticleKind): boolean {
  return kind === "news" || kind === "column";
}
