-- チームプロフィール(選手名鑑とは別の、フロント・コーチングスタッフ情報のページ)のデータ基盤。
-- 既存の teams(都市・カンファレンス・ディビジョン・創設年)はそのまま使い、ここでは追加で必要な
-- 公開用の項目だけを保存する。既存テーブル・データへの変更は一切ない。
--
-- ・team_profiles       : チームごとに1行(アリーナ・Gリーグ提携先・フロント・ヘッドコーチ)
-- ・team_staff_members  : アシスタントコーチ等を1人1行で保存
--
-- 保存しないもの(管理用の情報はExcel側で管理する): Original Notes / Verification Status / open_issues
-- 行の投入(INSERT)はこのファイルでは行わない。空のテーブルを作るだけ。
--
-- 注意: 公開サイトで読む前提のため、読み取りは anon / authenticated に許可する。
--       書き込みポリシーは作らず、書き込みは service_role のみ(RLSをバイパスする)。

BEGIN;

-- ==========================================================================
-- team_profiles: チームごとに1行
-- ==========================================================================

create table team_profiles (
  team_id uuid primary key references teams (id) on delete cascade,

  -- 概要
  arena_name_ja text,
  arena_name_en text,
  g_league_affiliate text,

  -- フロントオフィス
  owner_name text,
  governor_name text,
  team_president_name text,
  team_president_role text,
  basketball_operations_name text,
  basketball_operations_role text,
  gm_name text,

  -- コーチングスタッフ(アシスタントコーチは team_staff_members に1人1行で保存する)
  head_coach_name text,

  -- このプロフィール行を公式情報で確認した日と、その出典
  last_verified date,
  source_url text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- 未公表・未確認は NULL で表す。空文字・空白のみは保存させない。
  constraint team_profiles_arena_name_ja_not_blank check (arena_name_ja is null or btrim(arena_name_ja) <> ''),
  constraint team_profiles_arena_name_en_not_blank check (arena_name_en is null or btrim(arena_name_en) <> ''),
  constraint team_profiles_g_league_affiliate_not_blank check (g_league_affiliate is null or btrim(g_league_affiliate) <> ''),
  constraint team_profiles_owner_name_not_blank check (owner_name is null or btrim(owner_name) <> ''),
  constraint team_profiles_governor_name_not_blank check (governor_name is null or btrim(governor_name) <> ''),
  constraint team_profiles_team_president_name_not_blank check (team_president_name is null or btrim(team_president_name) <> ''),
  constraint team_profiles_team_president_role_not_blank check (team_president_role is null or btrim(team_president_role) <> ''),
  constraint team_profiles_basketball_operations_name_not_blank check (basketball_operations_name is null or btrim(basketball_operations_name) <> ''),
  constraint team_profiles_basketball_operations_role_not_blank check (basketball_operations_role is null or btrim(basketball_operations_role) <> ''),
  constraint team_profiles_gm_name_not_blank check (gm_name is null or btrim(gm_name) <> ''),
  constraint team_profiles_head_coach_name_not_blank check (head_coach_name is null or btrim(head_coach_name) <> ''),
  constraint team_profiles_source_url_format check (source_url is null or source_url ~ '^https?://')
);

create trigger set_updated_at
  before update on team_profiles
  for each row execute function set_updated_at();

alter table team_profiles enable row level security;

-- 読み取りのみ公開。INSERT / UPDATE / DELETE のポリシーは作らない(service_roleのみ書き込み可)。
create policy "team_profiles_public_read" on team_profiles
  for select
  to anon, authenticated
  using (true);

revoke all on table team_profiles from anon, authenticated;
grant select on table team_profiles to anon, authenticated;

comment on table team_profiles is
  'チームプロフィール画面の公開用データ(チームごとに1行)。役職者名は公式情報で確認できたものだけを入力する。';
comment on column team_profiles.governor_name is
  'Governor。公式に未公表・未確認の場合はNULL。';
comment on column team_profiles.gm_name is
  'General Managerの氏名。GM職が公式に確認できない場合はNULL。NULLはGM不在を意味しない。';
comment on column team_profiles.team_president_role is
  'Team Presidentの公式役職名(英語)。';
comment on column team_profiles.basketball_operations_role is
  'バスケットボール運営責任者の公式役職名(英語)。';
comment on column team_profiles.last_verified is
  'このプロフィール行の内容を公式情報で確認した日付。';
comment on column team_profiles.source_url is
  '確認に使った公式情報のURL(複数ある場合は改行区切り)。';

-- ==========================================================================
-- team_staff_members: アシスタントコーチを1人1行で保存
-- ==========================================================================

create table team_staff_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams (id) on delete cascade,
  name text not null,
  role_title text not null,
  display_order smallint not null,
  last_verified date,
  source_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint team_staff_members_name_not_blank check (btrim(name) <> ''),
  constraint team_staff_members_role_title_check
    check (role_title in ('Assistant Coach', 'Lead Assistant Coach', 'Associate Head Coach')),
  constraint team_staff_members_display_order_positive check (display_order >= 1),
  constraint team_staff_members_source_url_format check (source_url is null or source_url ~ '^https?://'),
  -- 同じチームの表示順は重複させない(並べ替え時の一時的な重複を許すため、コミット時に検査する)
  constraint team_staff_members_team_display_order_key
    unique (team_id, display_order) deferrable initially deferred
);

-- 同じチームに同じスタッフを二重登録させない(大文字小文字・前後の空白の違いは同一とみなす)。
create unique index team_staff_members_team_name_key
  on team_staff_members (team_id, lower(btrim(name)));

create trigger set_updated_at
  before update on team_staff_members
  for each row execute function set_updated_at();

alter table team_staff_members enable row level security;

create policy "team_staff_members_public_read" on team_staff_members
  for select
  to anon, authenticated
  using (true);

revoke all on table team_staff_members from anon, authenticated;
grant select on table team_staff_members to anon, authenticated;

comment on table team_staff_members is
  'アシスタントコーチを1人1行で保存する公開用データ。公式情報で確認できた人だけを登録する。';
comment on column team_staff_members.role_title is
  '公式役職名: Assistant Coach / Lead Assistant Coach / Associate Head Coach。';
comment on column team_staff_members.display_order is
  'チーム内の表示順(1から)。';
comment on column team_staff_members.last_verified is
  'この人物を公式情報で確認した日付。';
comment on column team_staff_members.source_url is
  'この人物を確認できた公式情報のURL。';

COMMIT;
