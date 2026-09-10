-- Seed data: Golden State Warriors / Stephen Curry
-- Phase 1スキーマ（teams / players / player_team_history / player_stats / team_stats）の
-- 動作確認用データです。id は他テーブルから参照するため固定値を使用しています。
--
-- 注意: points / rebounds / assists 等の数値は公開情報をもとにした概算値です。
-- 正式なデータ investment（NBA公式API等からのインポート）はPhase 2以降で
-- 上書き・検証してください。games_played / wins / losses / 得点合計は
-- 2015-16シーズンの公表値に基づいています。

insert into teams (
  id, name, abbreviation, city, conference, division, founded_year, is_active
) values (
  '11111111-1111-1111-1111-111111111111',
  'Golden State Warriors',
  'GSW',
  'San Francisco',
  'West',
  'Pacific',
  1946,
  true
);

insert into players (
  id, first_name, last_name, birth_date, height_cm, weight_kg,
  position, draft_year, draft_round, draft_pick, nationality,
  nba_person_id, is_active
) values (
  '22222222-2222-2222-2222-222222222222',
  'Stephen',
  'Curry',
  '1988-03-14',
  191,
  84.0,
  'PG',
  2009,
  1,
  7,
  'USA',
  201939,
  true
);

-- ドラフトでGSWに加入して以降、現在まで同一球団に在籍（移籍なし）
insert into player_team_history (
  player_id, team_id, season, start_date, end_date, acquisition_type
) values (
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  2009,
  '2009-10-28',
  null,
  'draft'
);

-- 2015-16 レギュラーシーズン（単一チーム在籍のためTOT行なし）
insert into player_stats (
  player_id, team_id, season, season_type,
  games_played, games_started, minutes_played,
  points, field_goals_made, field_goals_attempted,
  three_pointers_made, three_pointers_attempted,
  free_throws_made, free_throws_attempted,
  rebounds_offensive, rebounds_defensive, rebounds_total,
  assists, steals, blocks, turnovers, personal_fouls
) values (
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  2015,
  'regular_season',
  79, 79, 2700.0,
  2375, 805, 1598,
  402, 886,
  363, 400,
  42, 391, 433,
  527, 169, 15, 232, 155
);

-- 2015-16 レギュラーシーズン チーム成績（NBA記録の73勝9敗シーズン）
insert into team_stats (
  team_id, season, season_type,
  games_played, wins, losses,
  points_for, points_against
) values (
  '11111111-1111-1111-1111-111111111111',
  2015,
  'regular_season',
  82, 73, 9,
  9422, 8536
);
