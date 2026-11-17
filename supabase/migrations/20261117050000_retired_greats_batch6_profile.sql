-- 引退した名選手(惜しくも75選外)第6バッチ2人の日本語名・生年月日・ドラフト前の所属を入れる(2026-11-17)。
-- 生年月日・ドラフト前の所属は Basketball-Reference の選手ページから。
-- 選手ID・英語名が一致し、日本語名がまだ空の行だけを更新する(すでに入っている値は変えない)。
--
-- ロールバック:
--   update players set full_name_ja = null, birth_date = null, pre_draft_team = null
--   where id in ('400b712c-5d4c-45f6-858a-eb7e16cddccc','193bdf00-f9e7-474d-9ca6-6faa290bb3a3');

update players as p
set full_name_ja = v.name_ja,
    birth_date = coalesce(p.birth_date, v.birth_date),
    pre_draft_team = coalesce(p.pre_draft_team, v.pre_draft_team)
from (values
  ('400b712c-5d4c-45f6-858a-eb7e16cddccc'::uuid, 'Dennis Johnson', 'デニス・ジョンソン', date '1954-09-18', 'Pepperdine'),
  ('193bdf00-f9e7-474d-9ca6-6faa290bb3a3'::uuid, 'Ralph Sampson',  'ラルフ・サンプソン', date '1960-07-07', 'Virginia')
) as v(id, full_name, name_ja, birth_date, pre_draft_team)
where p.id = v.id
  and p.full_name = v.full_name
  and p.full_name_ja is null;
