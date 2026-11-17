-- 引退した名選手(惜しくも75選外)第4バッチ5人の日本語名・生年月日・ドラフト前の所属を入れる(2026-11-17)。
-- 生年月日・ドラフト前の所属は Basketball-Reference の選手ページから。日本語名はドラフト一覧の表記と同じ。
-- 選手ID・英語名が一致し、日本語名がまだ空の行だけを更新する(すでに入っている値は変えない)。
--
-- ロールバック:
--   update players set full_name_ja = null, birth_date = null, pre_draft_team = null
--   where id in ('0586d69f-aaa5-4137-9503-78de8cc89d76','5c38ad97-e239-41e5-89c3-f4ae64966152',
--                '4dce9697-34d6-4ea5-88de-8e5698ef2915','4c2179ee-d4d9-4fe5-b0c1-1bcc712931aa',
--                'd0600f11-a24d-499c-a784-e5aa309935b4');

update players as p
set full_name_ja = v.name_ja,
    birth_date = coalesce(p.birth_date, v.birth_date),
    pre_draft_team = coalesce(p.pre_draft_team, v.pre_draft_team)
from (values
  ('0586d69f-aaa5-4137-9503-78de8cc89d76'::uuid, 'Tim Hardaway',     'ティム・ハーダウェイ', date '1966-09-01', 'UTEP'),
  ('5c38ad97-e239-41e5-89c3-f4ae64966152'::uuid, 'Chris Mullin',     'クリス・マリン',       date '1963-07-30', 'St. John''s'),
  ('4dce9697-34d6-4ea5-88de-8e5698ef2915'::uuid, 'Mitch Richmond',   'ミッチ・リッチモンド', date '1965-06-30', 'Kansas State'),
  ('4c2179ee-d4d9-4fe5-b0c1-1bcc712931aa'::uuid, 'Joe Dumars',       'ジョー・デュマース',   date '1963-05-24', 'McNeese State'),
  ('d0600f11-a24d-499c-a784-e5aa309935b4'::uuid, 'Gheorghe Muresan', 'ゲオルゲ・ムレシャン', date '1971-02-14', 'Pau-Orthez (France)')
) as v(id, full_name, name_ja, birth_date, pre_draft_team)
where p.id = v.id
  and p.full_name = v.full_name
  and p.full_name_ja is null;
