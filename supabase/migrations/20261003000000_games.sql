-- 試合センター(/games)のデータ基盤。2026-10-03 に Supabase SQL Editor で実行済み。
-- 試合ごとのスコア(クオーター別)と、試合ごとの選手のボックススコアを保存する。
--
-- ・games             : 1試合1行。ホーム／アウェー、試合状態、クオーター別得点、合計得点
--                       → 無料の balldontlie API から取り込む(source_game_id は balldontlie の試合ID)
-- ・game_player_stats : 試合 × 選手ごとに1行。MIN・PTS・REB・AST・STL・BLK・FGM/FGA・3PM/3PA・FTM/FTA・+/-
--                       → 管理画面の「試合ボックススコアCSV取込」から登録する(source = 'csv')
-- ・replace_game_player_stats(): 1試合分の選手スタッツを、削除と登録を1つの処理で入れ替える関数。
--                       途中で失敗した場合は全体が取り消され、以前のデータが残る(再取込を安全に行うため)。
--
-- 既存テーブル・データへの変更は一切ない。行の投入(INSERT)はこのファイルでは行わない。
-- 読み取りは anon / authenticated に公開。書き込みポリシーは作らず、service_role のみ書き込み可。
-- スタッツは合計値(その試合の実数)で保存する。

BEGIN;

-- ==========================================================================
-- games: 1試合1行
-- ==========================================================================

create table games (
  id uuid primary key default gen_random_uuid(),

  -- 取得元と、取得元側の試合ID(同じ試合を重複して登録しないためのキー)
  source text not null,
  source_game_id bigint not null,

  -- シーズン(開始年。例: 2026 = 2026-27)
  season smallint not null,
  -- プレーオフ(プレーイン含む)ならtrue。取得元が区別できる範囲で保存する
  postseason boolean not null default false,

  -- 取得元の試合日(米国の日付)と、試合開始日時(UTCで保存し、画面では日本時間で表示)
  game_date date not null,
  tipoff_at timestamptz,

  home_team_id uuid not null references teams (id) on delete restrict,
  away_team_id uuid not null references teams (id) on delete restrict,

  -- 試合状態: scheduled(試合前) / in_progress(試合中) / final(試合終了) / postponed(延期)
  status text not null,
  -- 取得元の状態表記(例: 'Final', '3rd Qtr', 'Halftime')。画面の補足表示用
  status_detail text,
  -- 現在(または最終)のピリオド。試合前はNULL
  period smallint,

  -- 合計得点(試合前はNULL)
  home_score smallint,
  away_score smallint,
  -- クオーター別得点(未実施のクオーターはNULL)
  home_q1 smallint, home_q2 smallint, home_q3 smallint, home_q4 smallint,
  away_q1 smallint, away_q2 smallint, away_q3 smallint, away_q4 smallint,
  -- 延長の得点(延長1回目から順に。延長なしは空配列)
  home_ot_scores smallint[] not null default '{}',
  away_ot_scores smallint[] not null default '{}',

  -- 取得元から最後に取り込んだ日時
  last_synced_at timestamptz not null default now(),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint games_source_check check (source in ('balldontlie')),
  constraint games_status_check check (status in ('scheduled', 'in_progress', 'final', 'postponed')),
  constraint games_season_range check (season between 1946 and 2100),
  constraint games_period_range check (period is null or period between 1 and 20),
  constraint games_teams_differ check (home_team_id <> away_team_id),
  constraint games_source_game_key unique (source, source_game_id)
);

-- 日本時間の日付で絞り込むため、開始日時で検索する
create index games_tipoff_at_idx on games (tipoff_at);
create index games_game_date_idx on games (game_date);
create index games_home_team_idx on games (home_team_id);
create index games_away_team_idx on games (away_team_id);

create trigger set_updated_at
  before update on games
  for each row execute function set_updated_at();

alter table games enable row level security;

create policy "games_public_read" on games
  for select
  to anon, authenticated
  using (true);

revoke all on table games from anon, authenticated;
grant select on table games to anon, authenticated;

comment on table games is
  '試合センターの試合。1試合1行。クオーター別得点と合計得点を持つ。結果の表示はネタバレ防止のため画面側で利用者の操作後に限る。';
comment on column games.game_date is '取得元の試合日(米国の日付)。日本時間の日付ではない。';
comment on column games.tipoff_at is '試合開始日時(UTC)。画面では日本時間に変換して日付ごとにまとめる。';
comment on column games.home_ot_scores is '延長の得点(延長1回目から順)。延長なしは空配列。';

-- ==========================================================================
-- game_player_stats: 試合 × 選手ごとに1行
-- ==========================================================================

create table game_player_stats (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references games (id) on delete cascade,
  team_id uuid not null references teams (id) on delete restrict,

  -- 登録元(現在はCSVのみ)
  source text not null default 'csv',
  -- 当サイトのplayersと照合できた場合のみ。照合できない場合もplayer_nameで表示できるようにする
  player_id uuid references players (id) on delete set null,
  -- CSVに記入された選手名(表示に使う)
  player_name text not null,

  -- 出場時間(秒)。出場なしは0
  seconds_played integer not null default 0,
  pts smallint not null default 0,
  reb smallint not null default 0,
  ast smallint not null default 0,
  stl smallint not null default 0,
  blk smallint not null default 0,
  fgm smallint not null default 0,
  fga smallint not null default 0,
  fg3m smallint not null default 0,
  fg3a smallint not null default 0,
  ftm smallint not null default 0,
  fta smallint not null default 0,
  -- 取得元に無い場合はNULL
  plus_minus smallint,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint game_player_stats_source_check check (source in ('csv')),
  constraint game_player_stats_player_name_not_blank check (btrim(player_name) <> ''),
  constraint game_player_stats_seconds_nonnegative check (seconds_played >= 0),
  constraint game_player_stats_made_le_attempts check (fgm <= fga and fg3m <= fg3a and ftm <= fta),
  -- 3Pは2P・3Pを合わせたFGの内数
  constraint game_player_stats_fg3_within_fg check (fg3m <= fgm and fg3a <= fga),
  -- 同じ試合に同じ選手名は1行だけ
  constraint game_player_stats_game_player_key unique (game_id, player_name)
);

create index game_player_stats_game_idx on game_player_stats (game_id, team_id);
create index game_player_stats_player_idx on game_player_stats (player_id);

create trigger set_updated_at
  before update on game_player_stats
  for each row execute function set_updated_at();

alter table game_player_stats enable row level security;

create policy "game_player_stats_public_read" on game_player_stats
  for select
  to anon, authenticated
  using (true);

revoke all on table game_player_stats from anon, authenticated;
grant select on table game_player_stats to anon, authenticated;

comment on table game_player_stats is
  '試合ごとの選手のボックススコア。試合 × 選手ごとに1行。値はその試合の実数。';
comment on column game_player_stats.seconds_played is '出場時間(秒)。画面ではMM:SSで表示する。';

-- ==========================================================================
-- replace_game_player_stats: 1試合分の選手スタッツを入れ替える
-- ==========================================================================
-- 同じ試合のCSVを再取込したときに使う。既存の行を削除してから新しい行を登録するが、
-- 関数全体が1つのトランザクションとして実行されるため、登録の途中でエラーになった場合は
-- 削除も取り消され、以前のデータがそのまま残る。
-- p_rows は次のキーを持つオブジェクトの配列(JSON):
--   team_id, player_id(NULL可), player_name, seconds_played, pts, reb, ast, stl, blk,
--   fgm, fga, fg3m, fg3a, ftm, fta, plus_minus(NULL可)
-- 戻り値は登録した行数。管理画面(サーバー側、service_role)からのみ呼び出す。

create function replace_game_player_stats(p_game_id uuid, p_rows jsonb)
returns integer
language plpgsql
set search_path = public
as $$
declare
  inserted_count integer;
begin
  if not exists (select 1 from games where id = p_game_id) then
    raise exception 'game % not found', p_game_id;
  end if;

  delete from game_player_stats where game_id = p_game_id;

  insert into game_player_stats (
    game_id, team_id, source, player_id, player_name, seconds_played,
    pts, reb, ast, stl, blk, fgm, fga, fg3m, fg3a, ftm, fta, plus_minus
  )
  select
    p_game_id, x.team_id, 'csv', x.player_id, x.player_name, x.seconds_played,
    x.pts, x.reb, x.ast, x.stl, x.blk, x.fgm, x.fga, x.fg3m, x.fg3a, x.ftm, x.fta, x.plus_minus
  from jsonb_to_recordset(p_rows) as x(
    team_id uuid, player_id uuid, player_name text, seconds_played integer,
    pts smallint, reb smallint, ast smallint, stl smallint, blk smallint,
    fgm smallint, fga smallint, fg3m smallint, fg3a smallint, ftm smallint, fta smallint,
    plus_minus smallint
  );

  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$;

revoke all on function replace_game_player_stats(uuid, jsonb) from public, anon, authenticated;
grant execute on function replace_game_player_stats(uuid, jsonb) to service_role;

comment on function replace_game_player_stats(uuid, jsonb) is
  '1試合分の選手スタッツを、削除と登録を1つのトランザクションで入れ替える(CSV再取込用)。service_roleのみ実行可。';

COMMIT;
