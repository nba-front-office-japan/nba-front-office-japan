-- 「2026-27現在ロスター × 2025-26実績」選手名鑑機能。
-- 既存のplayer_team_history（トレード履歴・日付範囲モデル）とは別に、
-- 「シーズン単位で今どのチームに所属しているか」だけを単純に持つテーブルを追加する。
-- 既存テーブル・データ・RLSポリシーへの変更はない（列追加のみ）。

alter table players add column full_name_ja text;
comment on column players.full_name_ja is
  '日本語表記の選手名（任意・手動入力）。未設定の場合はfull_name（英語表記）を使用する。';

create table player_season_rosters (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players (id) on delete cascade,
  team_id uuid not null references teams (id) on delete restrict,
  season smallint not null,
  roster_status text not null default 'active' check (
    roster_status in ('active', 'two_way', 'inactive')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint player_season_rosters_unique unique (player_id, season)
);

create index player_season_rosters_team_season_idx on player_season_rosters (team_id, season);
create index player_season_rosters_season_idx on player_season_rosters (season);

create trigger set_updated_at
  before update on player_season_rosters
  for each row execute function set_updated_at();

alter table player_season_rosters enable row level security;

create policy "player_season_rosters_public_read" on player_season_rosters
  for select
  to anon, authenticated
  using (true);
