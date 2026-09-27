-- NBAチーム資産価値ランキング(/teams/valuations)のデータ基盤。
-- メディアが公表するチーム資産価値の「推計値」を、出典・年版ごとに履歴として保存する。
-- NBA・各チームの公式発表ではないため、画面では必ず「推計値」と出典を併記する。
--
-- ・team_valuation_editions : 出典の年版ごとに1行(例: CNBC 2026年版)。記事URL・公開日・価値の定義・記事中の平均値
-- ・team_valuations         : 年版 × チームごとに1行。順位・資産価値・売上・EBITDA・前年比
--
-- 既存テーブル・データへの変更は一切ない。行の投入(INSERT)はこのファイルでは行わない。
-- 読み取りは anon / authenticated に公開。書き込みポリシーは作らず、service_role のみ書き込み可。
-- 金額はすべて米ドルの整数(ドル単位)で保存する。例: 108億ドル = 10800000000

BEGIN;

-- ==========================================================================
-- team_valuation_editions: 出典の年版ごとに1行
-- ==========================================================================

create table team_valuation_editions (
  id uuid primary key default gen_random_uuid(),

  -- 出典(cnbc / forbes / sportico)と、出典側の年版表記(例: CNBC "2026")
  source_key text not null,
  edition_year smallint not null,

  -- 画面表示用の出典名と記事タイトル(例: 'CNBC' / 'CNBC''s Official NBA Team Valuations 2026')
  source_name text not null,
  title text not null,
  published_on date not null,
  source_url text not null,

  -- 価値の定義(出典の説明を日本語で要約。例: 企業価値(株式+純負債)、アリーナ収益を含む)
  value_definition text,
  -- 売上・EBITDAが対象とするシーズン(開始年。例: 2024 = 2024-25)。出典に無ければNULL
  financials_season smallint,
  -- 記事中に明記された30チーム平均(照合用)。明記が無ければNULL
  stated_average_value_usd bigint,

  -- この年版の内容を出典で確認した日
  last_verified date not null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint team_valuation_editions_source_key_check check (source_key in ('cnbc', 'forbes', 'sportico')),
  constraint team_valuation_editions_edition_year_range check (edition_year between 1990 and 2100),
  constraint team_valuation_editions_source_name_not_blank check (btrim(source_name) <> ''),
  constraint team_valuation_editions_title_not_blank check (btrim(title) <> ''),
  constraint team_valuation_editions_value_definition_not_blank check (value_definition is null or btrim(value_definition) <> ''),
  constraint team_valuation_editions_source_url_format check (source_url ~ '^https?://'),
  constraint team_valuation_editions_financials_season_range check (financials_season is null or financials_season between 1990 and 2100),
  constraint team_valuation_editions_stated_average_positive check (stated_average_value_usd is null or stated_average_value_usd > 0),
  -- 同じ出典の同じ年版は1行だけ
  constraint team_valuation_editions_source_edition_key unique (source_key, edition_year)
);

create trigger set_updated_at
  before update on team_valuation_editions
  for each row execute function set_updated_at();

alter table team_valuation_editions enable row level security;

create policy "team_valuation_editions_public_read" on team_valuation_editions
  for select
  to anon, authenticated
  using (true);

revoke all on table team_valuation_editions from anon, authenticated;
grant select on table team_valuation_editions to anon, authenticated;

comment on table team_valuation_editions is
  'チーム資産価値ランキングの出典・年版(例: CNBC 2026年版)。値はメディアの推計値で、NBA・各チームの公式発表ではない。';
comment on column team_valuation_editions.source_key is
  '出典の識別子: cnbc / forbes / sportico。';
comment on column team_valuation_editions.edition_year is
  '出典側の年版表記(例: CNBC 2026年版 = 2026)。NBAのシーズン(開始年)ではない。';
comment on column team_valuation_editions.financials_season is
  '売上・EBITDAが対象とするシーズンの開始年(例: 2024 = 2024-25)。';
comment on column team_valuation_editions.stated_average_value_usd is
  '記事中に明記された30チーム平均(米ドル)。投入時の照合に使う。';

-- ==========================================================================
-- team_valuations: 年版 × チームごとに1行
-- ==========================================================================

create table team_valuations (
  id uuid primary key default gen_random_uuid(),
  edition_id uuid not null references team_valuation_editions (id) on delete cascade,
  team_id uuid not null references teams (id) on delete cascade,

  -- 出典どおりの順位(同額は同順位になりうる)
  rank smallint not null,
  -- 資産価値(米ドル)
  value_usd bigint not null,

  -- 出典に載っている場合のみ(米ドル)。EBITDAは赤字(マイナス)もありうる
  revenue_usd bigint,
  ebitda_usd bigint,
  -- 前年比(%)。出典に載っている場合のみ。例: 18.5
  change_pct numeric(6, 2),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint team_valuations_rank_range check (rank between 1 and 30),
  constraint team_valuations_value_positive check (value_usd > 0),
  constraint team_valuations_revenue_positive check (revenue_usd is null or revenue_usd > 0),
  -- 同じ年版に同じチームは1行だけ
  constraint team_valuations_edition_team_key unique (edition_id, team_id)
);

create index team_valuations_edition_rank_idx on team_valuations (edition_id, rank);
create index team_valuations_team_idx on team_valuations (team_id);

create trigger set_updated_at
  before update on team_valuations
  for each row execute function set_updated_at();

alter table team_valuations enable row level security;

create policy "team_valuations_public_read" on team_valuations
  for select
  to anon, authenticated
  using (true);

revoke all on table team_valuations from anon, authenticated;
grant select on table team_valuations to anon, authenticated;

comment on table team_valuations is
  'チーム資産価値の推計値(年版 × チームごとに1行)。出典情報は team_valuation_editions を参照。';
comment on column team_valuations.rank is
  '出典に掲載された順位。';
comment on column team_valuations.value_usd is
  '資産価値(米ドル・整数)。出典の推計値。';
comment on column team_valuations.revenue_usd is
  '売上(米ドル)。出典に掲載がある場合のみ。対象シーズンは editions.financials_season。';
comment on column team_valuations.ebitda_usd is
  'EBITDA(米ドル)。出典に掲載がある場合のみ。';
comment on column team_valuations.change_pct is
  '前年比(%)。出典に掲載がある場合のみ。';

COMMIT;
