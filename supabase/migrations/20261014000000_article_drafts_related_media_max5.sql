-- 関連メディア(Xポスト・YouTube動画)の上限を、X・YouTube合計で3件から5件に変更する。
-- 20261013000000_article_drafts_related_media.sql で作った制約 article_drafts_related_media_urls_check を、
-- 件数の上限だけを5件に変えた同じ内容の制約に置き換える(URL の形のチェックは変えない)。
--
-- 既存の行は変更しない(既存の値はすべて3件以下のため、新しい制約も満たす)。
-- 制約の入れ替えは1つの処理で行い、途中で失敗した場合は元の制約のまま残る。
--
-- ロールバック(5件より多くは入らないため、4〜5件の行がなければそのまま戻せる):
--   alter table article_drafts drop constraint article_drafts_related_media_urls_check;
--   alter table article_drafts add constraint article_drafts_related_media_urls_check check (
--     cardinality(related_media_urls) <= 3 and (...20261013000000 と同じ URL の形のチェック...));

begin;

alter table article_drafts
  drop constraint article_drafts_related_media_urls_check;

alter table article_drafts
  add constraint article_drafts_related_media_urls_check check (
    cardinality(related_media_urls) <= 5
    and (
      cardinality(related_media_urls) = 0
      or array_to_string(related_media_urls, E'\n') ~ '^(https://x\.com/[A-Za-z0-9_]{1,15}/status/[0-9]{1,20}|https://www\.youtube\.com/(watch\?v=|shorts/)[A-Za-z0-9_-]{11})(\n(https://x\.com/[A-Za-z0-9_]{1,15}/status/[0-9]{1,20}|https://www\.youtube\.com/(watch\?v=|shorts/)[A-Za-z0-9_-]{11}))*$'
    )
  );

comment on column article_drafts.related_media_urls is
  '記事本文の後に表示する関連メディア(Xポスト・YouTube動画)の URL(任意・合計最大5件)。正規化した URL だけを保存する。';

commit;
