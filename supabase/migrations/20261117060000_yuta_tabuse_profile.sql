-- 田臥勇太(日本人初のNBA選手。「惜しくも75選外」の最後に載せる)の日本語名・生年月日・ドラフト前の所属を入れる(2026-11-17)。
-- 生年月日は Basketball-Reference の選手ページから。ドラフト外のため、ドラフト前の所属は最後に在籍した大学。
-- 選手ID・英語名が一致し、日本語名がまだ空の行だけを更新する(すでに入っている値は変えない)。
--
-- ロールバック:
--   update players set full_name_ja = null, birth_date = null, pre_draft_team = null
--   where id = 'bf328779-7783-4970-ac28-d2927273fa71';

update players as p
set full_name_ja = v.name_ja,
    birth_date = coalesce(p.birth_date, v.birth_date),
    pre_draft_team = coalesce(p.pre_draft_team, v.pre_draft_team)
from (values
  ('bf328779-7783-4970-ac28-d2927273fa71'::uuid, 'Yuta Tabuse', '田臥勇太', date '1980-10-05', 'BYU-Hawaii')
) as v(id, full_name, name_ja, birth_date, pre_draft_team)
where p.id = v.id
  and p.full_name = v.full_name
  and p.full_name_ja is null;
