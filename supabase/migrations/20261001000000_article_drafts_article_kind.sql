-- article_drafts に記事区分(article_kind)を追加する。
--   news   : 通常のニュース記事(既定値。既存の記事はすべてこれになる)
--   column : 自作の解説・コラム記事(公開ページで「COLUMN」ラベルを出す)
-- 既存の article_type(breaking / standard / deep_dive)は記事の形式で、これとは別物。
--
-- ロールバック:
--   alter table article_drafts drop column if exists article_kind;

alter table article_drafts
  add column if not exists article_kind text not null default 'news'
  check (article_kind in ('news', 'column'));
