-- アデイ・マーラ(Aday Mara、2026年ドラフト1巡目12位・サンダー)の日本語名を「アダイ・マーラ」に変更する(2026-11-14)。
-- 選手ページ・選手名鑑・記事の「この記事の選手」/選手ページの「関連ニュース」は players.full_name_ja を使うため、この1行の更新で揃う。
-- 選手ID・英語名・ドラフト年・指名順位・現在の日本語名がすべて一致する1行だけを更新する。
--
-- ロールバック:
--   update players set full_name_ja = 'アデイ・マーラ'
--   where id = '38609672-ad85-4739-ace0-9d41e8f4c3c1' and full_name = 'Aday Mara';

update players
set full_name_ja = 'アダイ・マーラ'
where id = '38609672-ad85-4739-ace0-9d41e8f4c3c1'
  and full_name = 'Aday Mara'
  and draft_year = 2026
  and draft_pick = 12
  and full_name_ja = 'アデイ・マーラ';
