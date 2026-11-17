-- 引退した名選手(惜しくも75選外)第2バッチ5人の日本語名・生年月日・ドラフト前の所属を入れる(2026-11-17)。
-- 生年月日・ドラフト前の所属は Basketball-Reference の選手ページから。
-- 選手ID・英語名が一致し、日本語名がまだ空の行だけを更新する(すでに入っている値は変えない)。
--
-- ロールバック:
--   update players set full_name_ja = null, birth_date = null, pre_draft_team = null
--   where id in ('e5dd8e99-af08-4bdc-b823-8084a518f675','ad56e523-a0d5-4a50-9e12-5bac4e120d69',
--                '933de97e-e472-4c50-9e37-62cb26cb35da','0be0cfcb-641a-4941-9ea0-0a3e5c2f19da',
--                '7d19772f-b491-4980-b612-05baec1a31c5');

update players as p
set full_name_ja = v.name_ja,
    birth_date = coalesce(p.birth_date, v.birth_date),
    pre_draft_team = coalesce(p.pre_draft_team, v.pre_draft_team)
from (values
  ('e5dd8e99-af08-4bdc-b823-8084a518f675'::uuid, 'Dwight Howard', 'ドワイト・ハワード', date '1985-12-08', 'Southwest Atlanta Christian Academy (HS)'),
  ('ad56e523-a0d5-4a50-9e12-5bac4e120d69'::uuid, 'Pau Gasol',     'パウ・ガソル',       date '1980-07-06', 'FC Barcelona (Spain)'),
  ('933de97e-e472-4c50-9e37-62cb26cb35da'::uuid, 'Tony Parker',   'トニー・パーカー',   date '1982-05-17', 'Paris Basket Racing (France)'),
  ('0be0cfcb-641a-4941-9ea0-0a3e5c2f19da'::uuid, 'Manu Ginobili', 'マヌ・ジノビリ',     date '1977-07-28', 'Viola Reggio Calabria (Italy)'),
  ('7d19772f-b491-4980-b612-05baec1a31c5'::uuid, 'Chris Bosh',    'クリス・ボッシュ',   date '1984-03-24', 'Georgia Tech')
) as v(id, full_name, name_ja, birth_date, pre_draft_team)
where p.id = v.id
  and p.full_name = v.full_name
  and p.full_name_ja is null;
