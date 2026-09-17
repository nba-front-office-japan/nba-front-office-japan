-- 2025-26 NBAアワード（個人賞・オールNBA等）を保存するための基盤テーブル。
-- 今回は箱と公開画面のみを追加し、受賞者データの投入は別途手作業で行う。

BEGIN;

create table season_player_awards (
  id uuid primary key default gen_random_uuid(),
  season smallint not null,
  player_id uuid not null references players (id) on delete cascade,
  team_id uuid references teams (id) on delete set null,
  award_key text not null check (
    award_key in (
      'mvp',
      'defensive_player_of_the_year',
      'rookie_of_the_year',
      'sixth_man_of_the_year',
      'most_improved_player',
      'clutch_player_of_the_year',
      'all_nba',
      'all_defensive',
      'all_rookie'
    )
  ),
  selection_team smallint,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint season_player_awards_selection_team_check check (
    (
      award_key in (
        'mvp',
        'defensive_player_of_the_year',
        'rookie_of_the_year',
        'sixth_man_of_the_year',
        'most_improved_player',
        'clutch_player_of_the_year'
      )
      and selection_team is null
    )
    or (award_key = 'all_nba' and selection_team in (1, 2, 3))
    or (award_key in ('all_defensive', 'all_rookie') and selection_team in (1, 2))
  )
);

-- 同一選手・同一シーズン・同一賞・同一選出区分の重複を防ぐ。個人賞はselection_teamが
-- nullになるため、標準のUNIQUE制約(NULL同士は重複とみなされない)では防げない。
-- coalesceで固定値に揃えたユニークインデックスにすることで、個人賞の二重登録も防ぐ。
create unique index season_player_awards_unique_idx on season_player_awards (
  season,
  player_id,
  award_key,
  coalesce(selection_team, 0)
);

create index season_player_awards_season_idx on season_player_awards (season);
create index season_player_awards_player_idx on season_player_awards (player_id);

create trigger set_updated_at
  before update on season_player_awards
  for each row execute function set_updated_at();

alter table season_player_awards enable row level security;

create policy "season_player_awards_public_read" on season_player_awards
  for select
  to anon, authenticated
  using (true);

COMMIT;
