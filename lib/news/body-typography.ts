// 記事本文の文字組み。公開ページの本文(components/news/article-body.tsx)と、管理画面の本文の入力欄
// (app/admin/news/drafts/[draftId]/body-editor.tsx)の両方に、この1つのクラスを使う。
// 入力欄と公開ページで、同じ画面幅なら本文の横幅・文字の大きさ・行の高さ・文字間隔・改行・空行(段落の間隔)・
// 折り返し位置が一致するよう、改行と空白は入力したとおりに表示する(white-space: pre-wrap)。
// 文字の大きさは16px(スマホで入力欄に触れたときにブラウザが画面を自動で拡大しない大きさ)にそろえる。
export const ARTICLE_BODY_TEXT_CLASS =
  "font-normal not-italic text-base leading-8 tracking-normal whitespace-pre-wrap [overflow-wrap:anywhere] [word-break:normal] [line-break:auto] [tab-size:4]";
