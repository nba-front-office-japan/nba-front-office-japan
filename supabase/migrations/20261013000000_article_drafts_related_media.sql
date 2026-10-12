-- ニュース記事に、関連メディア(公開Xポスト・YouTube動画)の URL を任意で最大3件(X・YouTube合計)登録できるようにする。
-- ・article_drafts.related_media_urls(text[]、既定は空配列)を追加する
-- ・保存する値は、管理画面で検証して正規化した次の形だけ(HTML や埋め込みコードは保存しない)
--     Xポスト        : https://x.com/ユーザー名/status/数字      (twitter.com の URL もこの形に直す)
--     YouTube動画    : https://www.youtube.com/watch?v=動画ID     (youtu.be の URL もこの形に直す)
--     YouTube Shorts : https://www.youtube.com/shorts/動画ID
-- ・DB でも件数(最大3件)と URL の形をチェックする
--
-- 既存の行は空配列になるだけで、ほかの列・データは変わらない。読み取り・書き込みの権限(RLS)も変更しない。
--
-- ロールバック:
--   alter table article_drafts drop column if exists related_media_urls;

begin;

alter table article_drafts
  add column related_media_urls text[] not null default '{}'::text[];

alter table article_drafts
  add constraint article_drafts_related_media_urls_check check (
    cardinality(related_media_urls) <= 3
    and (
      cardinality(related_media_urls) = 0
      or array_to_string(related_media_urls, E'\n') ~ '^(https://x\.com/[A-Za-z0-9_]{1,15}/status/[0-9]{1,20}|https://www\.youtube\.com/(watch\?v=|shorts/)[A-Za-z0-9_-]{11})(\n(https://x\.com/[A-Za-z0-9_]{1,15}/status/[0-9]{1,20}|https://www\.youtube\.com/(watch\?v=|shorts/)[A-Za-z0-9_-]{11}))*$'
    )
  );

comment on column article_drafts.related_media_urls is
  '記事本文の後に表示する関連メディア(Xポスト・YouTube動画)の URL(任意・合計最大3件)。正規化した URL だけを保存する。';

commit;
