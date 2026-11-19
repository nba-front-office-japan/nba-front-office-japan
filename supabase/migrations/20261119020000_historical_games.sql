-- 過去シーズンの試合結果(過去の順位表用)。balldontlie の /v1/games から取り込む。
-- 今季の試合センターが使う games テーブルとは分ける(サイトマップ・試合センターの日付送りに出さないため)。
-- チームは「今のフランチャイズ」(teams)で持つ。当時のチーム名・地区は画面側の対応表で表示する。
begin;

create table historical_games (
  id uuid primary key default gen_random_uuid(),

  source text not null default 'balldontlie',
  source_game_id bigint not null,

  season smallint not null,
  postseason boolean not null default false,
  game_date date not null,

  home_team_id uuid not null references teams (id) on delete restrict,
  away_team_id uuid not null references teams (id) on delete restrict,
  home_score smallint not null,
  away_score smallint not null,
  -- 最終のピリオド(5以上は延長あり)
  period smallint,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint historical_games_source_check check (source in ('balldontlie')),
  constraint historical_games_source_game_key unique (source, source_game_id),
  constraint historical_games_season_range check (season between 1946 and 2100),
  constraint historical_games_teams_differ check (home_team_id <> away_team_id),
  constraint historical_games_scores_nonnegative check (home_score >= 0 and away_score >= 0)
);

create index historical_games_season_idx on historical_games (season, postseason);

create trigger set_updated_at
  before update on historical_games
  for each row execute function set_updated_at();

alter table historical_games enable row level security;

create policy "historical_games_public_read" on historical_games
  for select
  to anon, authenticated
  using (true);

revoke all on table historical_games from anon, authenticated;
grant select on table historical_games to anon, authenticated;

comment on table historical_games is
  '過去シーズンの試合結果(過去の順位表用)。balldontlie /v1/games から取り込む。今季の games とは別。チームは今のフランチャイズで持つ。';

commit;
