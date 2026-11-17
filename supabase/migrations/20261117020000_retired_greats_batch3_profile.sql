-- 引退した名選手(惜しくも75選外)第3バッチ5人の日本語名・生年月日・ドラフト前の所属を入れる(2026-11-17)。
-- 生年月日・ドラフト前の所属は Basketball-Reference の選手ページから。
-- 選手ID・英語名が一致し、日本語名がまだ空の行だけを更新する(すでに入っている値は変えない)。
--
-- ロールバック:
--   update players set full_name_ja = null, birth_date = null, pre_draft_team = null
--   where id in ('74f6e638-b790-4b7c-bbcf-2f7fc593a456','c8c1d0fb-fb13-4d7f-a7b4-2bd75ac51597',
--                '0f047a04-42cc-423d-8afc-accff5d798ab','5fd13029-e992-48cc-9bc2-3bb60d493e21',
--                '821bdd50-e001-41f5-b3f4-3d6ac80d3228');

update players as p
set full_name_ja = v.name_ja,
    birth_date = coalesce(p.birth_date, v.birth_date),
    pre_draft_team = coalesce(p.pre_draft_team, v.pre_draft_team)
from (values
  ('74f6e638-b790-4b7c-bbcf-2f7fc593a456'::uuid, 'Grant Hill',      'グラント・ヒル',       date '1972-10-05', 'Duke'),
  ('c8c1d0fb-fb13-4d7f-a7b4-2bd75ac51597'::uuid, 'Chris Webber',    'クリス・ウェバー',     date '1973-03-01', 'Michigan'),
  ('0f047a04-42cc-423d-8afc-accff5d798ab'::uuid, 'Alonzo Mourning', 'アロンゾ・モーニング', date '1970-02-08', 'Georgetown'),
  ('5fd13029-e992-48cc-9bc2-3bb60d493e21'::uuid, 'Ben Wallace',     'ベン・ウォーレス',     date '1974-09-10', 'Virginia Union'),
  ('821bdd50-e001-41f5-b3f4-3d6ac80d3228'::uuid, 'Manute Bol',      'マヌート・ボル',       date '1962-10-16', 'Bridgeport')
) as v(id, full_name, name_ja, birth_date, pre_draft_team)
where p.id = v.id
  and p.full_name = v.full_name
  and p.full_name_ja is null;
