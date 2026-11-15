-- ダリアス・エイカフJr.(Darius Acuff Jr.、2026年ドラフト1巡目7位・キングス)の日本語名の表記をそろえる(2026-11-15)。
-- 現在の「ダリアス・エイカフ・ Jr.」(中黒のあとに空白)を、ドラフト一覧やほかの選手(ジャレン・ジャクソンJr.など)と同じ「ダリアス・エイカフJr.」にする。
-- 選手ID・英語名・現在の日本語名がすべて一致する1行だけを更新する。
--
-- ロールバック:
--   update players set full_name_ja = 'ダリアス・エイカフ・ Jr.'
--   where id = 'a7fa3a55-f982-47ef-a471-a37fff986454' and full_name = 'Darius Acuff Jr.';

update players
set full_name_ja = 'ダリアス・エイカフJr.'
where id = 'a7fa3a55-f982-47ef-a471-a37fff986454'
  and full_name = 'Darius Acuff Jr.'
  and full_name_ja = 'ダリアス・エイカフ・ Jr.';
