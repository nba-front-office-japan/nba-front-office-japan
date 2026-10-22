-- 試合のボックススコア(新書式 NBA_Box_Scores.xlsx: Game Summary / Player Box Scores / Team Totals / Metadata / Errors)を保存するテーブル。
-- ・box_score_games       : 1試合1行(Game ID・米国の試合日・両チーム・クオーター別/延長の得点・出典URL)
-- ・box_score_players     : 試合 × 選手ごとに1行(先発/控え/DNP・DNPの理由・出場時間・各スタッツ・GmSc・+/-)
-- ・box_score_team_totals : 試合 × チームごとに1行(Team Totals)
-- 試合センターでは、games(日程・スコア)の同じ日付・同じ対戦の試合にこのボックススコアを表示する。
-- games に無い試合(日程を取り込んでいない日の試合)は、この box_score_games だけで表示する。
-- 既存のテーブル(games / game_player_stats / preseason_*)の構造・行は変更しない。
-- 読み取りは公開、書き込みは service_role のみ(管理画面の Excel 取り込みから import_box_scores() を呼ぶ)。

begin;

create table box_score_games (
  id uuid primary key default gen_random_uuid(),
  -- Excel の Game ID(例: 202610200DET)。同じ試合を重複して登録しないためのキー
  bref_game_id text not null unique,
  -- Excel の Date(米国東部時間の試合日)。日本時間の日付ではない
  game_date date not null,
  away_team_id uuid not null references teams (id) on delete restrict,
  home_team_id uuid not null references teams (id) on delete restrict,
  away_score smallint not null,
  home_score smallint not null,
  away_q1 smallint, away_q2 smallint, away_q3 smallint, away_q4 smallint,
  home_q1 smallint, home_q2 smallint, home_q3 smallint, home_q4 smallint,
  -- 延長の得点(OT1, OT2 … の順。延長なしは空配列)
  away_ot_scores smallint[] not null default '{}',
  home_ot_scores smallint[] not null default '{}',
  source_url text,
  last_imported_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint box_score_games_teams_differ check (home_team_id <> away_team_id)
);

create index box_score_games_game_date_idx on box_score_games (game_date);

create trigger set_updated_at
  before update on box_score_games
  for each row execute function set_updated_at();

create table box_score_players (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references box_score_games (id) on delete cascade,
  team_id uuid not null references teams (id) on delete restrict,
  side text not null,
  -- Excel の並び順(チーム内の表示順。先発 → 控え → DNP)
  row_order smallint not null,
  -- Excel の選手名(表示に使う)と、当サイトの選手データと照合できた場合の選手ID
  player_name text not null,
  player_id uuid references players (id) on delete set null,
  bref_player_id text,
  -- Starter / Bench / DNP
  role text not null,
  -- DNP の理由(Excel の表記のまま)
  dnp_reason text,
  -- 出場時間(秒)。DNP など空欄は NULL
  seconds_played integer,
  fgm smallint, fga smallint,
  fg3m smallint, fg3a smallint,
  ftm smallint, fta smallint,
  oreb smallint, dreb smallint, reb smallint,
  ast smallint, stl smallint, blk smallint, tov smallint, pf smallint,
  pts smallint,
  game_score numeric(5, 1),
  plus_minus smallint,
  created_at timestamptz not null default now(),
  constraint box_score_players_side_check check (side in ('away', 'home')),
  constraint box_score_players_role_check check (role in ('starter', 'bench', 'dnp')),
  constraint box_score_players_name_not_blank check (btrim(player_name) <> ''),
  constraint box_score_players_seconds_nonnegative check (seconds_played is null or seconds_played >= 0),
  constraint box_score_players_order_key unique (game_id, side, row_order)
);

create index box_score_players_game_idx on box_score_players (game_id);
create index box_score_players_player_idx on box_score_players (player_id);

create table box_score_team_totals (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references box_score_games (id) on delete cascade,
  team_id uuid not null references teams (id) on delete restrict,
  side text not null,
  -- チームの出場時間の合計(分。延長なしは 240)
  minutes smallint,
  fgm smallint, fga smallint,
  fg3m smallint, fg3a smallint,
  ftm smallint, fta smallint,
  oreb smallint, dreb smallint, reb smallint,
  ast smallint, stl smallint, blk smallint, tov smallint, pf smallint,
  pts smallint,
  created_at timestamptz not null default now(),
  constraint box_score_team_totals_side_check check (side in ('away', 'home')),
  constraint box_score_team_totals_key unique (game_id, side)
);

alter table box_score_games enable row level security;
alter table box_score_players enable row level security;
alter table box_score_team_totals enable row level security;
create policy "box_score_games_public_read" on box_score_games for select to anon, authenticated using (true);
create policy "box_score_players_public_read" on box_score_players for select to anon, authenticated using (true);
create policy "box_score_team_totals_public_read" on box_score_team_totals for select to anon, authenticated using (true);
revoke all on table box_score_games, box_score_players, box_score_team_totals from anon, authenticated;
grant select on table box_score_games, box_score_players, box_score_team_totals to anon, authenticated;

comment on table box_score_games is '試合のボックススコア(新書式Excelから取り込み)の試合。games の同じ日付・同じ対戦の試合に表示する。';
comment on column box_score_games.game_date is 'Excel の Date(米国東部時間の試合日)。日本時間の日付ではない。';
comment on table box_score_players is '試合のボックススコアの個人成績(新書式Excelから取り込み)。DNP の空欄は NULL のまま。';
comment on table box_score_team_totals is '試合のボックススコアのチーム合計(Team Totals)。';

-- 取り込み: 同じ Game ID は試合を更新し、個人成績・チーム合計を入れ替える。新しい Game ID は追加する。
-- アップロードに含まれない試合は削除しない。全体を1つの処理として行う(途中で失敗したら何も変わらない)。
create function import_box_scores(p_games jsonb, p_players jsonb, p_totals jsonb)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  g record;
  was_inserted boolean;
  inserted_count integer := 0;
  updated_count integer := 0;
begin
  for g in
    select * from jsonb_to_recordset(p_games) as x(
      bref_game_id text, game_date date, away_team_id uuid, home_team_id uuid,
      away_score smallint, home_score smallint,
      away_q1 smallint, away_q2 smallint, away_q3 smallint, away_q4 smallint,
      home_q1 smallint, home_q2 smallint, home_q3 smallint, home_q4 smallint,
      away_ot_scores smallint[], home_ot_scores smallint[], source_url text
    )
  loop
    insert into box_score_games (
      bref_game_id, game_date, away_team_id, home_team_id, away_score, home_score,
      away_q1, away_q2, away_q3, away_q4, home_q1, home_q2, home_q3, home_q4,
      away_ot_scores, home_ot_scores, source_url, last_imported_at
    ) values (
      g.bref_game_id, g.game_date, g.away_team_id, g.home_team_id, g.away_score, g.home_score,
      g.away_q1, g.away_q2, g.away_q3, g.away_q4, g.home_q1, g.home_q2, g.home_q3, g.home_q4,
      coalesce(g.away_ot_scores, '{}'), coalesce(g.home_ot_scores, '{}'), g.source_url, now()
    )
    on conflict (bref_game_id) do update set
      game_date = excluded.game_date,
      away_team_id = excluded.away_team_id,
      home_team_id = excluded.home_team_id,
      away_score = excluded.away_score,
      home_score = excluded.home_score,
      away_q1 = excluded.away_q1, away_q2 = excluded.away_q2, away_q3 = excluded.away_q3, away_q4 = excluded.away_q4,
      home_q1 = excluded.home_q1, home_q2 = excluded.home_q2, home_q3 = excluded.home_q3, home_q4 = excluded.home_q4,
      away_ot_scores = excluded.away_ot_scores,
      home_ot_scores = excluded.home_ot_scores,
      source_url = excluded.source_url,
      last_imported_at = now()
    returning (xmax = 0) into was_inserted;

    if was_inserted then
      inserted_count := inserted_count + 1;
    else
      updated_count := updated_count + 1;
    end if;
  end loop;

  -- 取り込む試合の個人成績・チーム合計を入れ替える(ほかの試合には触れない)
  delete from box_score_players
  where game_id in (select id from box_score_games where bref_game_id in (select x->>'bref_game_id' from jsonb_array_elements(p_games) as x));
  delete from box_score_team_totals
  where game_id in (select id from box_score_games where bref_game_id in (select x->>'bref_game_id' from jsonb_array_elements(p_games) as x));

  insert into box_score_players (
    game_id, team_id, side, row_order, player_name, player_id, bref_player_id, role, dnp_reason, seconds_played,
    fgm, fga, fg3m, fg3a, ftm, fta, oreb, dreb, reb, ast, stl, blk, tov, pf, pts, game_score, plus_minus
  )
  select bg.id, x.team_id, x.side, x.row_order, x.player_name, x.player_id, x.bref_player_id, x.role, x.dnp_reason, x.seconds_played,
    x.fgm, x.fga, x.fg3m, x.fg3a, x.ftm, x.fta, x.oreb, x.dreb, x.reb, x.ast, x.stl, x.blk, x.tov, x.pf, x.pts, x.game_score, x.plus_minus
  from jsonb_to_recordset(p_players) as x(
    bref_game_id text, team_id uuid, side text, row_order smallint, player_name text, player_id uuid, bref_player_id text,
    role text, dnp_reason text, seconds_played integer,
    fgm smallint, fga smallint, fg3m smallint, fg3a smallint, ftm smallint, fta smallint,
    oreb smallint, dreb smallint, reb smallint, ast smallint, stl smallint, blk smallint, tov smallint, pf smallint,
    pts smallint, game_score numeric, plus_minus smallint
  )
  join box_score_games bg on bg.bref_game_id = x.bref_game_id;

  insert into box_score_team_totals (
    game_id, team_id, side, minutes, fgm, fga, fg3m, fg3a, ftm, fta, oreb, dreb, reb, ast, stl, blk, tov, pf, pts
  )
  select bg.id, x.team_id, x.side, x.minutes, x.fgm, x.fga, x.fg3m, x.fg3a, x.ftm, x.fta, x.oreb, x.dreb, x.reb,
    x.ast, x.stl, x.blk, x.tov, x.pf, x.pts
  from jsonb_to_recordset(p_totals) as x(
    bref_game_id text, team_id uuid, side text, minutes smallint,
    fgm smallint, fga smallint, fg3m smallint, fg3a smallint, ftm smallint, fta smallint,
    oreb smallint, dreb smallint, reb smallint, ast smallint, stl smallint, blk smallint, tov smallint, pf smallint, pts smallint
  )
  join box_score_games bg on bg.bref_game_id = x.bref_game_id;

  return jsonb_build_object('inserted', inserted_count, 'updated', updated_count);
end;
$$;

revoke all on function import_box_scores(jsonb, jsonb, jsonb) from public, anon, authenticated;
grant execute on function import_box_scores(jsonb, jsonb, jsonb) to service_role;

commit;
