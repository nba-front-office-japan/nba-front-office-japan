-- 引退した名選手(惜しくも75選外)第1バッチ5人の日本語名・生年月日・ドラフト前の所属を入れる(2026-11-17)。
-- 生年月日・ドラフト前の所属は Basketball-Reference の選手ページから。
-- 選手ID・英語名が一致し、日本語名がまだ空の行だけを更新する(すでに入っている値は変えない)。
--
-- ロールバック:
--   update players set full_name_ja = null, birth_date = null, pre_draft_team = null
--   where id in ('f383a5eb-d69c-4218-87c8-3a310ac507e7','6a62eb20-ffb5-45e2-aa6a-d0516ff53ed8',
--                '7fab05cb-7ca5-4e61-ac62-47d590ff4db9','0034a3d5-75c4-4e4a-aa1e-a8bb2833544f',
--                'c79c5fc8-86ae-4672-b141-d40918b7a0d4');

update players as p
set full_name_ja = v.name_ja,
    birth_date = coalesce(p.birth_date, v.birth_date),
    pre_draft_team = coalesce(p.pre_draft_team, v.pre_draft_team)
from (values
  ('f383a5eb-d69c-4218-87c8-3a310ac507e7'::uuid, 'Tracy McGrady',     'トレイシー・マグレディ', date '1979-05-24', 'Mt. Zion Christian Academy (HS)'),
  ('6a62eb20-ffb5-45e2-aa6a-d0516ff53ed8'::uuid, 'Yao Ming',          'ヤオ・ミン',             date '1980-09-12', 'Shanghai Sharks (China)'),
  ('7fab05cb-7ca5-4e61-ac62-47d590ff4db9'::uuid, 'Anfernee Hardaway', 'ペニー・ハーダウェイ',   date '1971-07-18', 'Memphis'),
  ('0034a3d5-75c4-4e4a-aa1e-a8bb2833544f'::uuid, 'Muggsy Bogues',     'マグジー・ボーグス',     date '1965-01-09', 'Wake Forest'),
  ('c79c5fc8-86ae-4672-b141-d40918b7a0d4'::uuid, 'Dikembe Mutombo',   'ディケンベ・ムトンボ',   date '1966-06-25', 'Georgetown')
) as v(id, full_name, name_ja, birth_date, pre_draft_team)
where p.id = v.id
  and p.full_name = v.full_name
  and p.full_name_ja is null;
