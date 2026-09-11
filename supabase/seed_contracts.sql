-- Seed data: Stephen Curry contract (Contracts UI動作確認用のサンプルデータ)
--
-- 注意: 2021年8月署名のスーパーマックス契約に基づく2023-24シーズンの
-- 公開報道ベースの概算値です。正式な年俸データソースが決まるまでの
-- 暫定サンプルとして扱ってください。

insert into contracts (
  player_id, team_id, season, salary, contract_type,
  is_player_option, is_team_option, is_guaranteed, signed_date
) values (
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  2023,
  51915615,
  'supermax',
  false,
  false,
  true,
  '2021-08-03'
);
