-- 表彰データExcel(NBA_Awards_2026-27_2026-10-09.xlsx)の表記「Jimmy Butler III」を、
-- 既存の選手「Jimmy Butler」の別名として登録する(2026-10-09 に Supabase SQL Editor で実行済み)。
-- 選手IDとフルネームの両方が一致する1人だけを対象にし、同じ別名が登録済みなら何もしない。
-- Elfrid Payton(サイトでは Elfrid Payton Jr)は今回は登録しない。
--
-- ロールバック:
--   delete from player_name_aliases
--   where player_id = '3e6f7e10-4d43-44a6-8875-3a6094d6ef7d' and alias_full_name = 'Jimmy Butler III';

insert into player_name_aliases (player_id, alias_full_name)
select p.id, 'Jimmy Butler III'
from players p
where p.id = '3e6f7e10-4d43-44a6-8875-3a6094d6ef7d'
  and p.full_name = 'Jimmy Butler'
on conflict (player_id, alias_full_name) do nothing;
