-- player_name_aliases に公開の読み取りポリシーを追加する(2026-11-12)。
-- これまでRLSは有効だが読み取りポリシーが無く、サイト(anonキー)からは別名が0件に見えていた。
-- そのため /draft と用語辞典の選手名鑑照合で別名(例: Hot Rod Williams)が使われていなかった。
-- 他のテーブルと同じく SELECT は公開、書き込みは service_role のみ(書き込みポリシーは作らない)。
--
-- ロールバック:
--   drop policy "player_name_aliases_public_read" on player_name_aliases;

create policy "player_name_aliases_public_read" on player_name_aliases
  for select
  to anon, authenticated
  using (true);
