-- ホームアリーナ詳細(所在地・収容人数・開場年・公式サイト)を保存する team_arenas を追加する。
-- アリーナ名は既存の team_profiles.arena_name_ja / arena_name_en をそのまま使い、ここには持たない。
-- 既存テーブル・データへの変更は一切ない。行の投入(INSERT)はこのファイルでは行わない。
--
-- 出典の扱い:
--   ・所在地・開場年 … 各アリーナ公式サイトに明記された値だけ。確認できない項目は NULL。
--                       確認日・出典は last_verified / source_url。
--   ・収容人数       … 出典を別に持つ(capacity_source_name / capacity_source_url / capacity_as_of /
--                       capacity_last_verified)。画面では「NBA.com掲載値(2024年8月)」のように出典を併記する。
--
-- 読み取りは anon / authenticated に公開。書き込みポリシーは作らず、service_role のみ書き込み可。

BEGIN;

create table team_arenas (
  team_id uuid primary key references teams (id) on delete cascade,

  -- 所在地(アリーナ公式サイトの記載どおり)
  address text,
  city text,
  state_region text,
  postal_code text,
  country text,

  -- 開場年(アリーナ公式サイトに明記された年のみ)
  opened_year smallint,

  -- アリーナ公式サイト
  official_url text,

  -- 所在地・開場年を公式情報で確認した日と、その出典(複数ある場合は改行区切り)
  last_verified date,
  source_url text,

  -- 収容人数(バスケットボール開催時)と、その出典
  capacity_basketball integer,
  capacity_source_name text,
  capacity_source_url text,
  capacity_as_of date,
  capacity_last_verified date,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- 未確認は NULL で表す。空文字・空白のみは保存させない。
  constraint team_arenas_address_not_blank check (address is null or btrim(address) <> ''),
  constraint team_arenas_city_not_blank check (city is null or btrim(city) <> ''),
  constraint team_arenas_state_region_not_blank check (state_region is null or btrim(state_region) <> ''),
  constraint team_arenas_postal_code_not_blank check (postal_code is null or btrim(postal_code) <> ''),
  constraint team_arenas_country_not_blank check (country is null or btrim(country) <> ''),
  constraint team_arenas_capacity_source_name_not_blank check (capacity_source_name is null or btrim(capacity_source_name) <> ''),

  constraint team_arenas_opened_year_range check (opened_year is null or opened_year between 1850 and 2100),
  constraint team_arenas_capacity_range check (capacity_basketball is null or capacity_basketball between 1000 and 50000),

  constraint team_arenas_official_url_format check (official_url is null or official_url ~ '^https?://'),
  constraint team_arenas_source_url_format check (source_url is null or source_url ~ '^https?://'),
  constraint team_arenas_capacity_source_url_format check (capacity_source_url is null or capacity_source_url ~ '^https?://'),

  -- 収容人数を入れる場合は、出典名・出典URL・掲載時点を必ずそろえる
  constraint team_arenas_capacity_source_required check (
    capacity_basketball is null
    or (capacity_source_name is not null and capacity_source_url is not null and capacity_as_of is not null)
  )
);

create trigger set_updated_at
  before update on team_arenas
  for each row execute function set_updated_at();

alter table team_arenas enable row level security;

-- 読み取りのみ公開。INSERT / UPDATE / DELETE のポリシーは作らない(service_roleのみ書き込み可)。
create policy "team_arenas_public_read" on team_arenas
  for select
  to anon, authenticated
  using (true);

revoke all on table team_arenas from anon, authenticated;
grant select on table team_arenas to anon, authenticated;

comment on table team_arenas is
  'ホームアリーナの詳細(チームごとに1行)。アリーナ名は team_profiles に保存。公式情報で確認できた値だけを入力する。';
comment on column team_arenas.address is
  '番地・通り名(アリーナ公式サイトの記載どおり)。未確認はNULL。';
comment on column team_arenas.state_region is
  '州・準州・州相当の略称(例: GA, DC, ON)。';
comment on column team_arenas.opened_year is
  'アリーナの開場年。アリーナ公式サイトに年が明記されている場合のみ。';
comment on column team_arenas.last_verified is
  '所在地・開場年を公式情報で確認した日付。';
comment on column team_arenas.source_url is
  '所在地・開場年の確認に使った公式情報のURL(複数ある場合は改行区切り)。';
comment on column team_arenas.capacity_basketball is
  'バスケットボール開催時の収容人数。出典は capacity_source_* を参照。';
comment on column team_arenas.capacity_source_name is
  '収容人数の出典名(例: NBA.com)。';
comment on column team_arenas.capacity_as_of is
  '収容人数の出典の掲載日(公開日)。';
comment on column team_arenas.capacity_last_verified is
  '収容人数を出典で確認した日付。';

COMMIT;
