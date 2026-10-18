-- 関連メディア(article_drafts.related_media_urls)で、Instagram の公開投稿・リールと TikTok の公開動画の URL も使えるようにする。
-- 制約 article_drafts_related_media_urls_check を、許可する URL の形だけを増やした内容に置き換える
-- (件数の上限 5件・X / YouTube の URL の形は変えない)。
-- 保存する値は、管理画面で検証して正規化した次の形だけ(HTML・埋め込みコード・画像や動画そのものは保存しない):
--   Xポスト        : https://x.com/ユーザー名/status/数字
--   YouTube動画    : https://www.youtube.com/watch?v=動画ID ／ https://www.youtube.com/shorts/動画ID
--   Instagram      : https://www.instagram.com/p/投稿ID/ ／ https://www.instagram.com/reel/投稿ID/ ／ https://www.instagram.com/tv/投稿ID/
--   TikTok         : https://www.tiktok.com/@ユーザー名/video/数字
--
-- 既存の行は変更しない(既存の値は X・YouTube だけで、新しい制約も満たす)。
-- 制約の入れ替えは1つの処理で行い、途中で失敗した場合は元の制約のまま残る。
--
-- ロールバック(Instagram・TikTok の URL を保存した行がない場合のみ):
--   20261014000000_article_drafts_related_media_max5.sql の制約を作り直す

begin;

alter table article_drafts
  drop constraint article_drafts_related_media_urls_check;

alter table article_drafts
  add constraint article_drafts_related_media_urls_check check (
    cardinality(related_media_urls) <= 5
    and (
      cardinality(related_media_urls) = 0
      or array_to_string(related_media_urls, E'\n') ~ '^(https://x\.com/[A-Za-z0-9_]{1,15}/status/[0-9]{1,20}|https://www\.youtube\.com/(watch\?v=|shorts/)[A-Za-z0-9_-]{11}|https://www\.instagram\.com/(p|reel|tv)/[A-Za-z0-9_-]{5,40}/|https://www\.tiktok\.com/@[A-Za-z0-9_.]{1,24}/video/[0-9]{10,25})(\n(https://x\.com/[A-Za-z0-9_]{1,15}/status/[0-9]{1,20}|https://www\.youtube\.com/(watch\?v=|shorts/)[A-Za-z0-9_-]{11}|https://www\.instagram\.com/(p|reel|tv)/[A-Za-z0-9_-]{5,40}/|https://www\.tiktok\.com/@[A-Za-z0-9_.]{1,24}/video/[0-9]{10,25}))*$'
    )
  );

comment on column article_drafts.related_media_urls is
  '記事本文の後に表示する関連メディア(Xポスト・YouTube動画・Instagram投稿/リール・TikTok動画)の URL(任意・合計最大5件)。正規化した URL だけを保存する。';

commit;
