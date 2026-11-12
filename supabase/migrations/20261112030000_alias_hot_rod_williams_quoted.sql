-- /draft/1985 の45位「John "Hot Rod" Williams」を選手名鑑にリンクするため、名鑑の選手に別名を登録する(2026-11-12)。
--  - 「Hot Rod,Williams」(1985年45位。名鑑の表記が崩れている) に、ドラフト一覧の表記「John "Hot Rod" Williams」
-- 選手IDとドラフト年・指名順位の両方が一致する行だけを対象にし、同じ別名が登録済みなら何もしない。
--
-- ロールバック:
--   delete from player_name_aliases
--   where player_id = '0b0dff95-d326-4845-8de4-83f761d672e7' and alias_full_name = 'John "Hot Rod" Williams';

insert into player_name_aliases (player_id, alias_full_name)
select p.id, 'John "Hot Rod" Williams'
from players p
where p.id = '0b0dff95-d326-4845-8de4-83f761d672e7'::uuid
  and p.draft_year = 1985
  and p.draft_pick = 45
on conflict (player_id, alias_full_name) do nothing;
