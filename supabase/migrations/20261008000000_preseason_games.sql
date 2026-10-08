-- プレシーズンの試合結果(管理画面からアップロードする Excel「NBA_Preseason_2026.xlsx」から取り込む)。
-- レギュラーシーズンの games / game_player_stats / replace_game_player_stats は一切変更しない。
--
-- ・preseason_games        : 1試合1行。Excel の Game Summary(Game ID ごと)。スコア・クオーター別得点・会場など
-- ・preseason_player_stats : 試合 × 選手ごとに1行。Excel の Player Stats。選手名は Excel の表記のまま保存し、
--                            既存の選手データ(players)とは照合・リンクしない
-- ・preseason_team_totals  : 試合 × チームごとに1行。Excel の Team Totals(Total 行と 成功率 行)
-- ・preseason_coverage     : Excel の Coverage(日付ごとの試合数の照合用)。公開データには使わず、管理画面だけで使う
-- ・import_preseason()     : 上の4つを1つの処理で取り込む関数。同じ Game ID は更新、新しい Game ID は追加。
--                            アップロードに含まれない既存の試合は削除しない。途中で失敗した場合は全体が取り消される。
--
-- 既存テーブル・データへの変更はない。行の投入はこのファイルでは行わない。
-- preseason_games / preseason_player_stats / preseason_team_totals の読み取りは anon / authenticated に公開。
-- preseason_coverage は公開しない(service_role のみ)。書き込みは service_role のみ。
--
-- ロールバック:
--   drop function if exists import_preseason(jsonb, jsonb, jsonb, jsonb);
--   drop table if exists preseason_coverage, preseason_team_totals, preseason_player_stats, preseason_games;

BEGIN;

-- ==========================================================================
-- preseason_games: 1試合1行
-- ==========================================================================

create table preseason_games (
  id uuid primary key default gen_random_uuid(),

  -- Excel の Game ID(例: 20261003hea-rap)。同じ試合を重複して登録しないためのキー
  game_key text not null unique,
  -- Excel の Game Date。出典(日本のサイト)の日付で、日本時間の日付として扱う
  game_date date not null,

  away_team_id uuid not null references teams (id) on delete restrict,
  home_team_id uuid not null references teams (id) on delete restrict,
  -- Excel のチーム表記(例: ヒート)。取り込み結果の確認用
  away_team_label text not null,
  home_team_label text not null,

  -- 試合状態(試合センターと同じ値): scheduled / in_progress / final / postponed
  status text not null,
  -- Excel の Status の表記(例: Final)
  status_detail text,

  away_score smallint,
  home_score smallint,
  away_q1 smallint, away_q2 smallint, away_q3 smallint, away_q4 smallint,
  home_q1 smallint, home_q2 smallint, home_q3 smallint, home_q4 smallint,

  -- Excel の Game Information / Venue / Location / Source Consistency Notes / Source URL
  game_info text,
  venue text,
  source_notes text,
  source_url text,

  last_imported_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint preseason_games_status_check check (status in ('scheduled', 'in_progress', 'final', 'postponed')),
  constraint preseason_games_teams_differ check (home_team_id <> away_team_id)
);

create index preseason_games_game_date_idx on preseason_games (game_date);

create trigger set_updated_at
  before update on preseason_games
  for each row execute function set_updated_at();

alter table preseason_games enable row level security;

create policy "preseason_games_public_read" on preseason_games
  for select to anon, authenticated using (true);

revoke all on table preseason_games from anon, authenticated;
grant select on table preseason_games to anon, authenticated;

comment on table preseason_games is
  'プレシーズンの試合(管理画面のExcelから取り込み)。レギュラーシーズンの games とは別に管理する。';

-- ==========================================================================
-- preseason_player_stats: 試合 × 選手ごとに1行
-- ==========================================================================

create table preseason_player_stats (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references preseason_games (id) on delete cascade,
  side text not null,
  -- Excel の並び順(チーム内の表示順)
  row_order smallint not null,
  -- Excel の表記のまま(選手データとは照合しない)
  player_name text not null,
  -- Excel の Position(先発のみ記載。控えは NULL)
  position text,
  -- 出場したか(Excel で成績がすべて空欄の行は false)
  played boolean not null,

  minutes smallint,
  pts smallint,
  fgm smallint, fga smallint,
  fg3m smallint, fg3a smallint,
  ftm smallint, fta smallint,
  oreb smallint, dreb smallint, reb smallint,
  ast smallint, stl smallint, blk smallint, tov smallint, pf smallint,

  created_at timestamptz not null default now(),

  constraint preseason_player_stats_side_check check (side in ('away', 'home')),
  constraint preseason_player_stats_name_not_blank check (btrim(player_name) <> ''),
  constraint preseason_player_stats_order_key unique (game_id, side, row_order)
);

create index preseason_player_stats_game_idx on preseason_player_stats (game_id);

alter table preseason_player_stats enable row level security;

create policy "preseason_player_stats_public_read" on preseason_player_stats
  for select to anon, authenticated using (true);

revoke all on table preseason_player_stats from anon, authenticated;
grant select on table preseason_player_stats to anon, authenticated;

comment on table preseason_player_stats is
  'プレシーズンの個人成績(Excelから取り込み)。選手名はExcelの表記のままで、選手データ(players)とはリンクしない。';

-- ==========================================================================
-- preseason_team_totals: 試合 × チームごとに1行
-- ==========================================================================

create table preseason_team_totals (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references preseason_games (id) on delete cascade,
  side text not null,

  pts smallint,
  fgm smallint, fga smallint,
  fg3m smallint, fg3a smallint,
  ftm smallint, fta smallint,
  oreb smallint, dreb smallint, reb smallint,
  ast smallint, stl smallint, blk smallint, tov smallint, pf smallint,
  -- Excel の 成功率 行の表記のまま(例: 48.8%)
  fg_pct text, fg3_pct text, ft_pct text,

  created_at timestamptz not null default now(),

  constraint preseason_team_totals_side_check check (side in ('away', 'home')),
  constraint preseason_team_totals_key unique (game_id, side)
);

alter table preseason_team_totals enable row level security;

create policy "preseason_team_totals_public_read" on preseason_team_totals
  for select to anon, authenticated using (true);

revoke all on table preseason_team_totals from anon, authenticated;
grant select on table preseason_team_totals to anon, authenticated;

-- ==========================================================================
-- preseason_coverage: Excel の Coverage(管理画面の照合用。公開しない)
-- ==========================================================================

create table preseason_coverage (
  game_date date primary key,
  scheduled_games smallint,
  linked_games smallint,
  final_games smallint,
  monthly_completed_games smallint,
  source_notes text,
  source_url text,
  last_imported_at timestamptz not null default now()
);

alter table preseason_coverage enable row level security;
-- ポリシーを作らないため、anon / authenticated からは読めない(service_role のみ)
revoke all on table preseason_coverage from anon, authenticated;

comment on table preseason_coverage is
  'プレシーズンExcelの Coverage シート(日付ごとの試合数)。公開データには使わず、管理画面の不整合確認だけに使う。';

-- ==========================================================================
-- import_preseason: Excel 1ファイル分を1つの処理で取り込む
-- ==========================================================================
-- p_games    : [{game_key, game_date, away_team_id, home_team_id, away_team_label, home_team_label, status, status_detail,
--                away_score, home_score, away_q1..q4, home_q1..q4, game_info, venue, source_notes, source_url}]
-- p_players  : [{game_key, side, row_order, player_name, position, played, minutes, pts, fgm, fga, fg3m, fg3a, ftm, fta,
--                oreb, dreb, reb, ast, stl, blk, tov, pf}]
-- p_totals   : [{game_key, side, pts, fgm, ..., pf, fg_pct, fg3_pct, ft_pct}]
-- p_coverage : [{game_date, scheduled_games, linked_games, final_games, monthly_completed_games, source_notes, source_url}]
-- 取り込む試合の個人成績・チーム合計は、その試合の分だけ入れ替える。戻り値は {"inserted": 追加数, "updated": 更新数}。

create function import_preseason(p_games jsonb, p_players jsonb, p_totals jsonb, p_coverage jsonb)
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
      game_key text, game_date date, away_team_id uuid, home_team_id uuid,
      away_team_label text, home_team_label text, status text, status_detail text,
      away_score smallint, home_score smallint,
      away_q1 smallint, away_q2 smallint, away_q3 smallint, away_q4 smallint,
      home_q1 smallint, home_q2 smallint, home_q3 smallint, home_q4 smallint,
      game_info text, venue text, source_notes text, source_url text
    )
  loop
    insert into preseason_games (
      game_key, game_date, away_team_id, home_team_id, away_team_label, home_team_label, status, status_detail,
      away_score, home_score, away_q1, away_q2, away_q3, away_q4, home_q1, home_q2, home_q3, home_q4,
      game_info, venue, source_notes, source_url, last_imported_at
    ) values (
      g.game_key, g.game_date, g.away_team_id, g.home_team_id, g.away_team_label, g.home_team_label, g.status, g.status_detail,
      g.away_score, g.home_score, g.away_q1, g.away_q2, g.away_q3, g.away_q4, g.home_q1, g.home_q2, g.home_q3, g.home_q4,
      g.game_info, g.venue, g.source_notes, g.source_url, now()
    )
    on conflict (game_key) do update set
      game_date = excluded.game_date,
      away_team_id = excluded.away_team_id,
      home_team_id = excluded.home_team_id,
      away_team_label = excluded.away_team_label,
      home_team_label = excluded.home_team_label,
      status = excluded.status,
      status_detail = excluded.status_detail,
      away_score = excluded.away_score,
      home_score = excluded.home_score,
      away_q1 = excluded.away_q1, away_q2 = excluded.away_q2, away_q3 = excluded.away_q3, away_q4 = excluded.away_q4,
      home_q1 = excluded.home_q1, home_q2 = excluded.home_q2, home_q3 = excluded.home_q3, home_q4 = excluded.home_q4,
      game_info = excluded.game_info,
      venue = excluded.venue,
      source_notes = excluded.source_notes,
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
  delete from preseason_player_stats
  where game_id in (select id from preseason_games where game_key in (select x->>'game_key' from jsonb_array_elements(p_games) as x));
  delete from preseason_team_totals
  where game_id in (select id from preseason_games where game_key in (select x->>'game_key' from jsonb_array_elements(p_games) as x));

  insert into preseason_player_stats (
    game_id, side, row_order, player_name, position, played, minutes, pts, fgm, fga, fg3m, fg3a, ftm, fta,
    oreb, dreb, reb, ast, stl, blk, tov, pf
  )
  select pg.id, x.side, x.row_order, x.player_name, x.position, x.played, x.minutes, x.pts, x.fgm, x.fga, x.fg3m, x.fg3a,
    x.ftm, x.fta, x.oreb, x.dreb, x.reb, x.ast, x.stl, x.blk, x.tov, x.pf
  from jsonb_to_recordset(p_players) as x(
    game_key text, side text, row_order smallint, player_name text, position text, played boolean,
    minutes smallint, pts smallint, fgm smallint, fga smallint, fg3m smallint, fg3a smallint, ftm smallint, fta smallint,
    oreb smallint, dreb smallint, reb smallint, ast smallint, stl smallint, blk smallint, tov smallint, pf smallint
  )
  join preseason_games pg on pg.game_key = x.game_key;

  insert into preseason_team_totals (
    game_id, side, pts, fgm, fga, fg3m, fg3a, ftm, fta, oreb, dreb, reb, ast, stl, blk, tov, pf, fg_pct, fg3_pct, ft_pct
  )
  select pg.id, x.side, x.pts, x.fgm, x.fga, x.fg3m, x.fg3a, x.ftm, x.fta, x.oreb, x.dreb, x.reb, x.ast, x.stl, x.blk,
    x.tov, x.pf, x.fg_pct, x.fg3_pct, x.ft_pct
  from jsonb_to_recordset(p_totals) as x(
    game_key text, side text, pts smallint, fgm smallint, fga smallint, fg3m smallint, fg3a smallint, ftm smallint, fta smallint,
    oreb smallint, dreb smallint, reb smallint, ast smallint, stl smallint, blk smallint, tov smallint, pf smallint,
    fg_pct text, fg3_pct text, ft_pct text
  )
  join preseason_games pg on pg.game_key = x.game_key;

  insert into preseason_coverage (
    game_date, scheduled_games, linked_games, final_games, monthly_completed_games, source_notes, source_url, last_imported_at
  )
  select x.game_date, x.scheduled_games, x.linked_games, x.final_games, x.monthly_completed_games, x.source_notes, x.source_url, now()
  from jsonb_to_recordset(p_coverage) as x(
    game_date date, scheduled_games smallint, linked_games smallint, final_games smallint, monthly_completed_games smallint,
    source_notes text, source_url text
  )
  on conflict (game_date) do update set
    scheduled_games = excluded.scheduled_games,
    linked_games = excluded.linked_games,
    final_games = excluded.final_games,
    monthly_completed_games = excluded.monthly_completed_games,
    source_notes = excluded.source_notes,
    source_url = excluded.source_url,
    last_imported_at = now();

  return jsonb_build_object('inserted', inserted_count, 'updated', updated_count);
end;
$$;

revoke all on function import_preseason(jsonb, jsonb, jsonb, jsonb) from public, anon, authenticated;
grant execute on function import_preseason(jsonb, jsonb, jsonb, jsonb) to service_role;

comment on function import_preseason(jsonb, jsonb, jsonb, jsonb) is
  'プレシーズンExcel 1ファイル分を取り込む(同じGame IDは更新、新しいGame IDは追加、含まれない試合は削除しない)。service_roleのみ実行可。';

COMMIT;
