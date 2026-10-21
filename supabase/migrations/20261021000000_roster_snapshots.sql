-- [1/2] シーズンごとのロスターの固定スナップショット(取り込んだ時点の名鑑データ)を保存するテーブル。
-- ・roster_snapshots        : スナップショット1件(シーズン・基準日・出典)
-- ・roster_snapshot_players : スナップショットの選手1人1行。元ファイルの値(ポジション・身長・体重・生年月日・出身地・
--                             経験年数・出身校・Two-Way)をそのまま保存する。背番号など元にない値は NULL のまま
-- ・どちらも登録後は変更・削除できない(トリガーで防ぐ)。自動取得などで上書きされない固定の記録にするため
-- ・ユーザーが確認して元ファイルの値を修正した項目(例外修正)は、元の値(source_birth_date)と修正内容(correction_note)を残す
-- ・選手名鑑の 2026-27 の選手プロフィール(身長・体重・生年月日・出身校など)はこのスナップショットから表示する。
--   選手データ(players)は [2/2] で、ユーザー確認済みの生年月日4名の修正と新規2名の追加だけを行う
-- ・現在のロスター(player_season_rosters の 2026 年度)を置き換える前に、今の行をバックアップテーブルに保存する
--
-- 既存テーブルの構造・既存の行は変更しない(バックアップ用テーブルの作成とコピーのみ)。
-- 読み取りは公開、書き込みは service_role のみ(他のテーブルと同じ)。

begin;

create table roster_snapshots (
  id uuid primary key default gen_random_uuid(),
  season smallint not null,
  as_of date not null,
  source_name text not null,
  source_note text,
  row_count integer not null,
  imported_at timestamptz not null default now(),
  constraint roster_snapshots_season_as_of_key unique (season, as_of)
);

create table roster_snapshot_players (
  id uuid primary key default gen_random_uuid(),
  snapshot_id uuid not null references roster_snapshots (id) on delete restrict,
  team_id uuid not null references teams (id) on delete restrict,
  player_id uuid not null references players (id) on delete restrict,
  -- 元ファイルの選手名(Two-Way は末尾に「 (TW)」)
  source_player_name text not null,
  two_way boolean not null,
  jersey_number smallint,
  -- 元ファイルの表記のまま(G / F / C / G-F / F-C など)
  position text not null,
  -- 元ファイルの表記(6-7)と、cm に換算した値
  height_text text,
  height_cm smallint,
  weight_lb smallint,
  weight_kg numeric(5, 1),
  -- 表示に使う生年月日(通常は元ファイルの値。ユーザー確認で修正した場合は修正後の値)
  birth_date date,
  -- 元ファイルの生年月日(修正した場合も、元の値をそのまま残す)
  source_birth_date date,
  -- 元ファイルの値を修正した場合の内容と理由(固定スナップショットの例外修正)。修正していない行は NULL
  correction_note text,
  -- 元ファイルの表記のまま(例: us US)
  birth_place text,
  -- 元ファイルの表記のまま(R = ルーキー)と、数値にした経験年数(R = 0)
  experience text,
  years_of_service smallint,
  college text,
  source_url text,
  constraint roster_snapshot_players_key unique (snapshot_id, player_id)
);

create index roster_snapshot_players_team_idx on roster_snapshot_players (snapshot_id, team_id);
create index roster_snapshot_players_player_idx on roster_snapshot_players (player_id);

-- 登録後の変更・削除を防ぐ(固定スナップショット)。取り込みを誤った場合は、このトリガーを外してから手作業で直す
create function roster_snapshot_immutable() returns trigger
language plpgsql as $$
begin
  raise exception 'ロスターのスナップショット(%)は変更・削除できません', tg_table_name;
end;
$$;

create trigger roster_snapshots_immutable before update or delete on roster_snapshots
  for each row execute function roster_snapshot_immutable();
create trigger roster_snapshot_players_immutable before update or delete on roster_snapshot_players
  for each row execute function roster_snapshot_immutable();

alter table roster_snapshots enable row level security;
alter table roster_snapshot_players enable row level security;
create policy "roster_snapshots_public_read" on roster_snapshots for select to anon, authenticated using (true);
create policy "roster_snapshot_players_public_read" on roster_snapshot_players for select to anon, authenticated using (true);
revoke all on table roster_snapshots, roster_snapshot_players from anon, authenticated;
grant select on table roster_snapshots, roster_snapshot_players to anon, authenticated;

comment on table roster_snapshots is 'シーズンごとのロスターの固定スナップショット(基準日・出典)。登録後は変更・削除できない。';
comment on table roster_snapshot_players is 'ロスターのスナップショットの選手(元ファイルの値をそのまま保存)。登録後は変更・削除できない。';

-- 置き換える前の 2026 年度の現在ロスターを保存しておく(元に戻す場合に使う。公開しない)
create table player_season_rosters_backup_20261021 as
  select * from player_season_rosters where season = 2026;
alter table player_season_rosters_backup_20261021 enable row level security;
revoke all on table player_season_rosters_backup_20261021 from anon, authenticated;

commit;
