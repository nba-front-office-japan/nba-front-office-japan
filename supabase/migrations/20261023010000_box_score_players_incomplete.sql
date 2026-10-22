-- 試合のボックススコアで「個人成績が取得元データで不足している試合」を記録できるようにする。
-- ・box_score_games.players_incomplete: 個人成績の合計がチーム合計と合わない(取得元に出場選手の行が足りない)試合は true
-- ・box_score_games.players_note      : その内容(管理画面・確認用の説明。公開ページには固定の注記を出す)
-- 試合結果・チーム合計は取り込み、個人成績は存在する行だけを保存する(推測・補完はしない)。
-- 既存の行は players_incomplete = false(完全なデータ)のまま変わらない。行の削除はしない。
-- import_box_scores() を、この2列も保存するように置き換える(引数・権限は従来どおり)。

begin;

alter table box_score_games
  add column players_incomplete boolean not null default false,
  add column players_note text;

comment on column box_score_games.players_incomplete is
  '個人成績が取得元データで不足している(個人成績の合計がチーム合計と一致しない)試合は true。試合結果・チーム合計は正しい。';
comment on column box_score_games.players_note is
  '個人成績の不足の内容(取り込み時の検査結果)。';

create or replace function import_box_scores(p_games jsonb, p_players jsonb, p_totals jsonb)
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
      away_ot_scores smallint[], home_ot_scores smallint[], source_url text,
      players_incomplete boolean, players_note text
    )
  loop
    insert into box_score_games (
      bref_game_id, game_date, away_team_id, home_team_id, away_score, home_score,
      away_q1, away_q2, away_q3, away_q4, home_q1, home_q2, home_q3, home_q4,
      away_ot_scores, home_ot_scores, source_url, players_incomplete, players_note, last_imported_at
    ) values (
      g.bref_game_id, g.game_date, g.away_team_id, g.home_team_id, g.away_score, g.home_score,
      g.away_q1, g.away_q2, g.away_q3, g.away_q4, g.home_q1, g.home_q2, g.home_q3, g.home_q4,
      coalesce(g.away_ot_scores, '{}'), coalesce(g.home_ot_scores, '{}'), g.source_url,
      coalesce(g.players_incomplete, false), g.players_note, now()
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
      players_incomplete = excluded.players_incomplete,
      players_note = excluded.players_note,
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
