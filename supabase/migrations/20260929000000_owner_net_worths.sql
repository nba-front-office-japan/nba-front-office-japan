-- NBAオーナー資産ランキング(/rankings/owner-net-worth)のデータ基盤。
-- 各チームの代表オーナー1名(または一族)の推定資産額を、出典・基準日ごとに履歴として保存する。
-- 値は Forbes の個人ページの推定値で、本人・チームの公式発表ではない。画面では必ず「推定値」と出典・基準日を併記する。
--
-- ・owner_net_worth_editions : 出典×基準日ごとに1行(例: Forbes 個人ページ 2026-10-01 確認分)
-- ・team_owner_net_worths    : 基準日×チームごとに1行(30チーム)。推定値が無いチームも行を残す
--
-- 順位は保存しない(表示時に推定資産額の多い順で計算。同額は同順位)。
-- 推定値が無い行(net_worth_usd が NULL)と、順位対象外の行(is_rank_eligible = false)は順位を付けず表の最後に出す。
--
-- 既存テーブル・データへの変更は一切ない。行の投入(INSERT)はこのファイルでは行わない。
-- 読み取りは anon / authenticated に公開。書き込みポリシーは作らず、service_role のみ書き込み可。
-- 金額はすべて米ドルの整数(ドル単位)で保存する。例: 1,560億ドル = 156000000000

BEGIN;

-- ==========================================================================
-- owner_net_worth_editions: 出典×基準日ごとに1行
-- ==========================================================================

create table owner_net_worth_editions (
  id uuid primary key default gen_random_uuid(),

  -- 出典(forbes / bloomberg)と基準日(30チームを同じ日に確認した日)
  source_key text not null,
  as_of_date date not null,

  -- 画面表示用の出典名とタイトル(例: 'Forbes' / 'Forbes Real-Time Billionaires')
  source_name text not null,
  title text not null,
  -- 出典の一覧・方法論のURL(個人ページのURLは team_owner_net_worths.profile_url)
  source_url text not null,

  -- 推定資産額の定義(出典の説明を日本語で要約)
  value_definition text,
  -- 代表オーナーの選び方(画面の出典欄に表示する)
  representative_rule text,

  -- この基準日の内容を出典で確認した日
  last_verified date not null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint owner_net_worth_editions_source_key_check check (source_key in ('forbes', 'bloomberg')),
  constraint owner_net_worth_editions_source_name_not_blank check (btrim(source_name) <> ''),
  constraint owner_net_worth_editions_title_not_blank check (btrim(title) <> ''),
  constraint owner_net_worth_editions_value_definition_not_blank check (value_definition is null or btrim(value_definition) <> ''),
  constraint owner_net_worth_editions_representative_rule_not_blank check (representative_rule is null or btrim(representative_rule) <> ''),
  constraint owner_net_worth_editions_source_url_format check (source_url ~ '^https?://'),
  constraint owner_net_worth_editions_verified_after_as_of check (last_verified >= as_of_date),
  -- 同じ出典の同じ基準日は1行だけ
  constraint owner_net_worth_editions_source_date_key unique (source_key, as_of_date)
);

create trigger set_updated_at
  before update on owner_net_worth_editions
  for each row execute function set_updated_at();

alter table owner_net_worth_editions enable row level security;

create policy "owner_net_worth_editions_public_read" on owner_net_worth_editions
  for select
  to anon, authenticated
  using (true);

revoke all on table owner_net_worth_editions from anon, authenticated;
grant select on table owner_net_worth_editions to anon, authenticated;

comment on table owner_net_worth_editions is
  'NBAオーナー資産ランキングの出典・基準日。値は出典の推定値で、本人・チームの公式発表ではない。';
comment on column owner_net_worth_editions.as_of_date is
  '基準日。30チームの推定資産額を同じ日に確認した日。';
comment on column owner_net_worth_editions.representative_rule is
  '代表オーナーの選び方(例: 支配権を持つ筆頭オーナー1名。明確でない場合はGovernor)。';

-- ==========================================================================
-- team_owner_net_worths: 基準日×チームごとに1行
-- ==========================================================================

create table team_owner_net_worths (
  id uuid primary key default gen_random_uuid(),
  edition_id uuid not null references owner_net_worth_editions (id) on delete cascade,
  team_id uuid not null references teams (id) on delete cascade,

  -- 代表オーナー(英語表記)。一族は 'DeVos family'、法人は 'MLSE' のように保存する
  owner_name text not null,
  -- principal_owner: 筆頭オーナー / governor: 筆頭が明確でないためGovernor / family: 一族 / corporate: 法人
  owner_role text not null,
  -- 出典の推定値が一族の合算かどうか
  is_family_estimate boolean not null default false,

  -- 推定資産額(米ドル)。NULL は「推定値なし」(出典に推定値が無い、または順位対象外)
  net_worth_usd bigint,
  -- false は順位対象外(例: 法人所有)。行は残し、画面では「推定値なし」と表示する
  is_rank_eligible boolean not null default true,
  exclusion_reason text,

  -- 推定値を確認した出典の個人ページ
  profile_url text,
  note text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint team_owner_net_worths_owner_name_not_blank check (btrim(owner_name) <> ''),
  constraint team_owner_net_worths_owner_role_check
    check (owner_role in ('principal_owner', 'governor', 'family', 'corporate')),
  constraint team_owner_net_worths_net_worth_positive check (net_worth_usd is null or net_worth_usd > 0),
  constraint team_owner_net_worths_profile_url_format check (profile_url is null or profile_url ~ '^https?://'),
  -- 推定値を入れる場合は、確認した個人ページのURLを必ず添える
  constraint team_owner_net_worths_value_requires_source
    check (net_worth_usd is null or profile_url is not null),
  -- 順位対象外の行は推定値を持たず、理由を必ず書く
  constraint team_owner_net_worths_exclusion_consistency
    check (is_rank_eligible or (net_worth_usd is null and exclusion_reason is not null and btrim(exclusion_reason) <> '')),
  -- 一族の推定値は family ロールか、一族合算として扱う筆頭オーナーに限る
  constraint team_owner_net_worths_family_role
    check (owner_role <> 'family' or is_family_estimate),
  -- 同じ基準日に同じチームは1行だけ
  constraint team_owner_net_worths_edition_team_key unique (edition_id, team_id)
);

create index team_owner_net_worths_edition_idx on team_owner_net_worths (edition_id);
create index team_owner_net_worths_team_idx on team_owner_net_worths (team_id);

create trigger set_updated_at
  before update on team_owner_net_worths
  for each row execute function set_updated_at();

alter table team_owner_net_worths enable row level security;

create policy "team_owner_net_worths_public_read" on team_owner_net_worths
  for select
  to anon, authenticated
  using (true);

revoke all on table team_owner_net_worths from anon, authenticated;
grant select on table team_owner_net_worths to anon, authenticated;

comment on table team_owner_net_worths is
  '各チームの代表オーナーの推定資産額(基準日×チームごとに1行)。出典情報は owner_net_worth_editions を参照。';
comment on column team_owner_net_worths.owner_role is
  'principal_owner=筆頭オーナー / governor=筆頭が明確でないためGovernor / family=一族 / corporate=法人。';
comment on column team_owner_net_worths.net_worth_usd is
  '推定資産額(米ドル・整数)。NULLは推定値なし。';
comment on column team_owner_net_worths.is_rank_eligible is
  'false は順位対象外(例: 法人所有)。一覧には残し「推定値なし」と表示する。';

COMMIT;
