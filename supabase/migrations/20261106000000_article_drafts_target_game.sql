-- ==========================================================================
-- 記事に任意項目「対象試合」を追加する(試合プレビュー記事を /games の試合カードに紐づける)
--
--   target_game_date : /games の表示日(日本時間の日付)
--   target_away_team : アウェイチームの略称(teams.abbreviation。例: LAL)
--   target_home_team : ホームチームの略称
--   3つとも NULL = 未設定(既存の記事はすべて未設定のまま。表示も変わらない)
--   3つそろっているか、3つとも NULL のどちらかだけを許す
--
-- 元に戻す場合:
--   alter table article_drafts drop constraint if exists article_drafts_target_game_all_or_none;
--   drop index if exists article_drafts_target_game_date_idx;
--   alter table article_drafts drop column if exists target_game_date,
--     drop column if exists target_away_team, drop column if exists target_home_team;
-- ==========================================================================

begin;

alter table article_drafts
  add column if not exists target_game_date date,
  add column if not exists target_away_team text check (target_away_team ~ '^[A-Z]{2,4}$'),
  add column if not exists target_home_team text check (target_home_team ~ '^[A-Z]{2,4}$');

alter table article_drafts
  add constraint article_drafts_target_game_all_or_none check (
    (target_game_date is null and target_away_team is null and target_home_team is null)
    or (target_game_date is not null and target_away_team is not null and target_home_team is not null)
  );

-- /games で、その日の試合に紐づく公開記事を探すための索引
create index if not exists article_drafts_target_game_date_idx
  on article_drafts (target_game_date)
  where target_game_date is not null;

comment on column article_drafts.target_game_date is '対象試合: /games の表示日(日本時間)。試合プレビュー記事の紐づけに使う。NULL は未設定';
comment on column article_drafts.target_away_team is '対象試合: アウェイチームの略称(teams.abbreviation)';
comment on column article_drafts.target_home_team is '対象試合: ホームチームの略称(teams.abbreviation)';

commit;

-- 実行後の確認用: 3列が追加され、既存の記事はすべて未設定(0件)になっていること
-- select column_name, data_type from information_schema.columns
--   where table_name = 'article_drafts' and column_name like 'target_%' order by column_name;
-- select count(*) from article_drafts where target_game_date is not null;
