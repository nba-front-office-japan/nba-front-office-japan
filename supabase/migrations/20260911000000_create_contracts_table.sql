-- Contracts (salary) table

create table contracts (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players (id) on delete cascade,
  team_id uuid not null references teams (id) on delete restrict,
  season smallint not null,
  salary bigint not null check (salary >= 0),
  contract_type text,
  is_player_option boolean not null default false,
  is_team_option boolean not null default false,
  is_guaranteed boolean not null default true,
  signed_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contracts_player_season_unique unique (player_id, season)
);

create index contracts_player_id_idx on contracts (player_id);
create index contracts_team_id_idx on contracts (team_id);
create index contracts_season_idx on contracts (season);

create trigger set_updated_at
  before update on contracts
  for each row execute function set_updated_at();

alter table contracts enable row level security;

create policy "contracts_public_read" on contracts
  for select
  to anon, authenticated
  using (true);
