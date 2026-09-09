-- Phase 1: core reference tables (teams, players, player_team_history, player_stats, team_stats)

create extension if not exists pgcrypto;
create extension if not exists btree_gist;

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ==========================================================================
-- teams
-- ==========================================================================

create table teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  abbreviation text not null,
  city text not null,
  conference text not null check (conference in ('East', 'West')),
  division text not null,
  founded_year smallint,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint teams_abbreviation_key unique (abbreviation)
);

create index teams_conference_idx on teams (conference);
create index teams_division_idx on teams (division);

create trigger set_updated_at
  before update on teams
  for each row execute function set_updated_at();

alter table teams enable row level security;

create policy "teams_public_read" on teams
  for select
  to anon, authenticated
  using (true);

-- ==========================================================================
-- players
-- ==========================================================================

create table players (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  full_name text generated always as (first_name || ' ' || last_name) stored,
  birth_date date,
  height_cm smallint,
  weight_kg numeric(5,1),
  position text,
  draft_year smallint,
  draft_round smallint,
  draft_pick smallint,
  nationality text,
  nba_person_id bigint,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint players_nba_person_id_key unique (nba_person_id)
);

create index players_last_name_idx on players (last_name);
create index players_is_active_idx on players (is_active);

create trigger set_updated_at
  before update on players
  for each row execute function set_updated_at();

alter table players enable row level security;

create policy "players_public_read" on players
  for select
  to anon, authenticated
  using (true);

-- ==========================================================================
-- player_team_history
-- ==========================================================================

create table player_team_history (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players (id) on delete cascade,
  team_id uuid not null references teams (id) on delete restrict,
  season smallint not null,
  start_date date not null,
  end_date date,
  acquisition_type text check (
    acquisition_type in ('draft', 'trade', 'free_agent', 'waiver', 'ten_day', 'two_way', 'other')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint player_team_history_dates_check check (end_date is null or end_date >= start_date),
  constraint player_team_history_no_overlap exclude using gist (
    player_id with =,
    daterange(start_date, end_date, '[]') with &&
  )
);

create index player_team_history_player_id_idx on player_team_history (player_id);
create index player_team_history_team_id_idx on player_team_history (team_id);
create index player_team_history_season_idx on player_team_history (season);

create trigger set_updated_at
  before update on player_team_history
  for each row execute function set_updated_at();

alter table player_team_history enable row level security;

create policy "player_team_history_public_read" on player_team_history
  for select
  to anon, authenticated
  using (true);

-- ==========================================================================
-- player_stats
-- ==========================================================================

create table player_stats (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players (id) on delete cascade,
  team_id uuid references teams (id) on delete restrict,
  season smallint not null,
  season_type text not null check (season_type in ('regular_season', 'playoffs')),
  games_played smallint not null default 0,
  games_started smallint not null default 0,
  minutes_played numeric(8,1) not null default 0,
  points integer not null default 0,
  field_goals_made integer not null default 0,
  field_goals_attempted integer not null default 0,
  three_pointers_made integer not null default 0,
  three_pointers_attempted integer not null default 0,
  free_throws_made integer not null default 0,
  free_throws_attempted integer not null default 0,
  rebounds_offensive integer not null default 0,
  rebounds_defensive integer not null default 0,
  rebounds_total integer not null default 0,
  assists integer not null default 0,
  steals integer not null default 0,
  blocks integer not null default 0,
  turnovers integer not null default 0,
  personal_fouls integer not null default 0,
  plus_minus integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint player_stats_games_check check (games_started <= games_played)
);

-- one row per player/season/season_type/team
create unique index player_stats_team_unique_idx
  on player_stats (player_id, season, season_type, team_id)
  where team_id is not null;

-- at most one season-total (TOT) row per player/season/season_type
create unique index player_stats_total_unique_idx
  on player_stats (player_id, season, season_type)
  where team_id is null;

create index player_stats_player_id_idx on player_stats (player_id);
create index player_stats_team_id_idx on player_stats (team_id);
create index player_stats_season_idx on player_stats (season);
create index player_stats_season_type_idx on player_stats (season_type);
create index player_stats_player_season_idx on player_stats (player_id, season);

create trigger set_updated_at
  before update on player_stats
  for each row execute function set_updated_at();

alter table player_stats enable row level security;

create policy "player_stats_public_read" on player_stats
  for select
  to anon, authenticated
  using (true);

-- ==========================================================================
-- team_stats
-- ==========================================================================

create table team_stats (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams (id) on delete restrict,
  season smallint not null,
  season_type text not null check (season_type in ('regular_season', 'playoffs')),
  games_played smallint not null default 0,
  wins smallint not null default 0,
  losses smallint not null default 0,
  points_for integer not null default 0,
  points_against integer not null default 0,
  field_goals_made integer not null default 0,
  field_goals_attempted integer not null default 0,
  three_pointers_made integer not null default 0,
  three_pointers_attempted integer not null default 0,
  free_throws_made integer not null default 0,
  free_throws_attempted integer not null default 0,
  rebounds_offensive integer not null default 0,
  rebounds_defensive integer not null default 0,
  rebounds_total integer not null default 0,
  assists integer not null default 0,
  steals integer not null default 0,
  blocks integer not null default 0,
  turnovers integer not null default 0,
  personal_fouls integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint team_stats_games_check check (wins + losses = games_played),
  constraint team_stats_unique unique (team_id, season, season_type)
);

create index team_stats_team_id_idx on team_stats (team_id);
create index team_stats_season_idx on team_stats (season);
create index team_stats_season_type_idx on team_stats (season_type);

create trigger set_updated_at
  before update on team_stats
  for each row execute function set_updated_at();

alter table team_stats enable row level security;

create policy "team_stats_public_read" on team_stats
  for select
  to anon, authenticated
  using (true);
