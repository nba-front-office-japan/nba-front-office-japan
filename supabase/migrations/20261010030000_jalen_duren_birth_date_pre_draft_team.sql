-- Jalen Duren の生年月日・最終在籍校を、最新ロスターデータの値で登録する(この1人のみ)。
-- 年齢は保存しない(表示時に生年月日から計算する)。
-- 既に値が入っている場合は上書きしない(birth_date・pre_draft_team が NULL のときだけ更新)。

update players
set birth_date = '2003-11-18', pre_draft_team = 'Memphis'
where id = '22cd2a09-9e54-4101-a5cf-896ae6b73901'
  and full_name = 'Jalen Duren'
  and birth_date is null
  and pre_draft_team is null;
