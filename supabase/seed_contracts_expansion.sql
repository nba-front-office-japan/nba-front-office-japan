-- 年俸拡充: 各チームの最高年俸選手 × 30チーム（season=2025 = 2025-26シーズン想定）
--
-- 注意: すべて記憶ベースの概算サンプルデータです（Claudeの学習カットオフは2026年1月、
-- 本セッションの実行時点は2026年9月のため、それ以降の契約更新・延長・トレードは
-- 反映されていません）。特にORL・POR・UTA・WASなど直近でロスターの主力が
-- 入れ替わりやすいチームは確度が低めです。Spotrac等の公式ソースでの
-- 事後検証を前提としてください。
--
-- Stephen Curry (GSW) は season=2023 の契約が既存データとして登録済みのため、
-- ここでは season=2025 の新しい行として追加します（(player_id, season)の
-- unique制約と衝突しません）。

insert into contracts (
  player_id, team_id, season, salary, contract_type,
  is_player_option, is_team_option, is_guaranteed
) values
  -- BOS: Jayson Tatum
  ('80ad917c-1576-42f2-8f0d-c7a0a868b39e', '00000000-0000-4000-8000-000000000002', 2025, 54126450, 'max', false, false, true),
  -- BKN: Cam Thomas
  ('87985f92-50b8-4773-8a4e-26845def12ac', '00000000-0000-4000-8000-000000000003', 2025, 24000000, 'standard', false, false, true),
  -- NYK: Karl-Anthony Towns
  ('d96eb2cf-a83d-4a50-bbcb-486db47f1b74', '00000000-0000-4000-8000-000000000004', 2025, 53142264, 'supermax', false, false, true),
  -- PHI: Joel Embiid
  ('f6047091-9f30-4d6a-ad34-9cf96398e1c1', '00000000-0000-4000-8000-000000000005', 2025, 55224526, 'supermax', false, false, true),
  -- TOR: Scottie Barnes
  ('201d7dc5-fc02-4f51-8d81-346bb3279129', '00000000-0000-4000-8000-000000000006', 2025, 40064220, 'max', false, false, true),
  -- CHI: Nikola Vucevic
  ('ad7305a4-c566-4939-8059-62a680e52f9a', '00000000-0000-4000-8000-000000000007', 2025, 21000000, 'veteran', false, false, true),
  -- CLE: Donovan Mitchell
  ('2bbffc20-92fb-4ac9-95af-be3066050d9d', '00000000-0000-4000-8000-000000000008', 2025, 51999973, 'max', true, false, true),
  -- DET: Cade Cunningham
  ('d3937b17-27ed-4b0a-afc8-b8611a7e9e65', '00000000-0000-4000-8000-000000000009', 2025, 45229900, 'max', false, false, true),
  -- IND: Pascal Siakam
  ('3e750d41-e5c3-4219-a470-cbe49d2a187a', '00000000-0000-4000-8000-000000000010', 2025, 50383838, 'max', false, false, true),
  -- MIL: Giannis Antetokounmpo
  ('6a529496-9f97-4443-8ad7-7bcf96d800f2', '00000000-0000-4000-8000-000000000011', 2025, 54126450, 'supermax', false, false, true),
  -- ATL: Trae Young
  ('1ff0df0a-44d3-44a8-8a27-d58a8024810f', '00000000-0000-4000-8000-000000000012', 2025, 45857140, 'max', true, false, true),
  -- CHA: LaMelo Ball
  ('e4888a31-57b7-42ac-9087-19a4db469961', '00000000-0000-4000-8000-000000000013', 2025, 37979589, 'max', false, false, true),
  -- MIA: Bam Adebayo
  ('e57e794c-840d-4d66-a380-41c6092ae612', '00000000-0000-4000-8000-000000000014', 2025, 37096620, 'max', false, false, true),
  -- ORL: Paolo Banchero（ロスター確度: 中）
  ('03001581-ef28-457e-903a-c910b5eb60e5', '00000000-0000-4000-8000-000000000015', 2025, 42568640, 'max', false, false, true),
  -- WAS: Jordan Poole（ロスター確度: 中）
  ('affa9af0-e3d6-4c1d-a9e6-3e49f0eecbb1', '00000000-0000-4000-8000-000000000016', 2025, 32370090, 'standard', false, false, true),
  -- DEN: Nikola Jokic
  ('0b6bf4c9-c412-4589-9292-6221d260ae30', '00000000-0000-4000-8000-000000000017', 2025, 55224526, 'supermax', false, false, true),
  -- MIN: Anthony Edwards
  ('c82d82e3-5f95-4eda-8fea-60c6c7f2a40e', '00000000-0000-4000-8000-000000000018', 2025, 43270000, 'max', false, false, true),
  -- OKC: Shai Gilgeous-Alexander
  ('3436425c-3f0a-4ad4-bfef-e7f2491cea9d', '00000000-0000-4000-8000-000000000019', 2025, 40064220, 'supermax', false, false, true),
  -- POR: Jerami Grant（ロスター確度: 中）
  ('2c81d83c-d71a-48c2-b976-bae44c384072', '00000000-0000-4000-8000-000000000020', 2025, 32000000, 'standard', false, false, true),
  -- UTA: Lauri Markkanen（ロスター確度: 中）
  ('562a1818-be9c-4964-98e9-d0b3672ad218', '00000000-0000-4000-8000-000000000021', 2025, 34000000, 'max', false, false, true),
  -- LAC: Kawhi Leonard
  ('0db2ed1f-9c63-49d2-9459-df7fda77014b', '00000000-0000-4000-8000-000000000022', 2025, 51179021, 'max', true, false, true),
  -- LAL: LeBron James
  ('46168554-25d8-46c4-a318-9b446b50b925', '00000000-0000-4000-8000-000000000023', 2025, 52627153, 'veteran', true, false, true),
  -- PHX: Devin Booker
  ('11807097-4de2-4a35-bce9-14c9a12bd91f', '00000000-0000-4000-8000-000000000024', 2025, 62600000, 'supermax', false, false, true),
  -- SAC: Domantas Sabonis
  ('34347c97-4c7a-4e7b-81c4-9bfd8c753f48', '00000000-0000-4000-8000-000000000025', 2025, 43610000, 'max', false, false, true),
  -- DAL: Anthony Davis（2025年トレード後、既存契約が移籍）
  ('10f0be88-c6f3-437b-82f4-63c9e59dfcc8', '00000000-0000-4000-8000-000000000026', 2025, 54126450, 'supermax', false, false, true),
  -- HOU: Kevin Durant（2025年トレード後、既存契約が移籍）
  ('44f91478-906a-4179-9d31-f53babfb5293', '00000000-0000-4000-8000-000000000027', 2025, 54708609, 'supermax', true, false, true),
  -- MEM: Ja Morant
  ('efce4ea9-56e9-4672-ae1b-7b1c68ef85f9', '00000000-0000-4000-8000-000000000028', 2025, 39344900, 'max', false, false, true),
  -- NOP: Zion Williamson
  ('ca091168-dc2a-4139-8432-f9082b7cba27', '00000000-0000-4000-8000-000000000029', 2025, 36970500, 'max', false, false, true),
  -- SAS: De'Aaron Fox（2025年トレード後、既存契約が移籍）
  ('c60347ec-2904-4e79-8bb4-f76e9370fca2', '00000000-0000-4000-8000-000000000030', 2025, 37096620, 'max', false, false, true),
  -- GSW: Stephen Curry（既存season=2023契約の後年分。新規行として追加）
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 2025, 59606817, 'supermax', false, false, true);
