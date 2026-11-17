-- 引退した名選手(惜しくも75選外)第5バッチ5人の日本語名・生年月日・ドラフト前の所属を入れる(2026-11-17)。
-- 生年月日・ドラフト前の所属は Basketball-Reference の選手ページから。
-- 選手ID・英語名が一致し、日本語名がまだ空の行だけを更新する(すでに入っている値は変えない)。
--
-- ロールバック:
--   update players set full_name_ja = null, birth_date = null, pre_draft_team = null
--   where id in ('c3e772e8-8c01-4b57-8c26-dc498b2ff586','c2ede491-524b-4b55-8d53-98979bdb448c',
--                '4608e733-8134-4941-a105-9e6a44ed82d0','3aca8a41-06e6-42c1-aa49-c638bb88cd0b',
--                'c301a0ed-705e-4587-8126-d8a94e854063');

update players as p
set full_name_ja = v.name_ja,
    birth_date = coalesce(p.birth_date, v.birth_date),
    pre_draft_team = coalesce(p.pre_draft_team, v.pre_draft_team)
from (values
  ('c3e772e8-8c01-4b57-8c26-dc498b2ff586'::uuid, 'Artis Gilmore',  'アーティス・ギルモア',       date '1949-09-21', 'Jacksonville'),
  ('c2ede491-524b-4b55-8d53-98979bdb448c'::uuid, 'Alex English',   'アレックス・イングリッシュ', date '1954-01-05', 'South Carolina'),
  ('4608e733-8134-4941-a105-9e6a44ed82d0'::uuid, 'Adrian Dantley', 'エイドリアン・ダントリー',   date '1955-02-28', 'Notre Dame'),
  ('3aca8a41-06e6-42c1-aa49-c638bb88cd0b'::uuid, 'Bernard King',   'バーナード・キング',         date '1956-12-04', 'Tennessee'),
  ('c301a0ed-705e-4587-8126-d8a94e854063'::uuid, 'Mark Eaton',     'マーク・イートン',           date '1957-01-24', 'UCLA')
) as v(id, full_name, name_ja, birth_date, pre_draft_team)
where p.id = v.id
  and p.full_name = v.full_name
  and p.full_name_ja is null;
