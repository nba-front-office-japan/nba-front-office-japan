-- 用語辞典(NBA用語辞典のニックネーム)から選手名鑑へリンクするため、名鑑の選手に別名を登録する(2026-11-12)。
--  - 「Hot Rod,Williams」(1985年45位。名鑑の表記が崩れている) に「Hot Rod Williams」
--  - 「Metta World Peace」(1999年16位) に旧名「Ron Artest」
-- 選手IDとドラフト年・指名順位の両方が一致する行だけを対象にし、同じ別名が登録済みなら何もしない。
-- Larry Johnson(1991年1位)は名鑑に本人の行が無いため登録しない(1977年の同名の別人には付けない)。
--
-- ロールバック:
--   delete from player_name_aliases
--   where (player_id = '0b0dff95-d326-4845-8de4-83f761d672e7' and alias_full_name = 'Hot Rod Williams')
--      or (player_id = '36d8c378-5fa6-4ad3-b706-5869fa917856' and alias_full_name = 'Ron Artest');

insert into player_name_aliases (player_id, alias_full_name)
select p.id, v.alias
from (values
  ('0b0dff95-d326-4845-8de4-83f761d672e7'::uuid, 'Hot Rod Williams', 1985, 45),
  ('36d8c378-5fa6-4ad3-b706-5869fa917856'::uuid, 'Ron Artest', 1999, 16)
) as v(player_id, alias, draft_year, draft_pick)
join players p on p.id = v.player_id and p.draft_year = v.draft_year and p.draft_pick = v.draft_pick
on conflict (player_id, alias_full_name) do nothing;
