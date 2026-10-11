-- プレシーズンの試合に延長(OT)の得点を保存する列を追加し、取り込み関数 import_preseason() を OT 対応にする。
-- ・preseason_games に away_ot / home_ot(延長の合計得点。延長なしは NULL)を追加
-- ・import_preseason() は同じ引数のまま、Excel の Away OT / Home OT を保存・更新するように置き換える
--   (同じ Game ID は更新、新しい Game ID は追加、含まれない試合は削除しない、は従来どおり)
-- 既存の行は OT が NULL になるだけで、ほかの列・データは変わらない。
-- レギュラーシーズンの games / game_player_stats / replace_game_player_stats には触れない。
--
-- ロールバック:
--   (20261008000000_preseason_games.sql の import_preseason を再作成してから)
--   alter table preseason_games drop column away_ot, drop column home_ot;

BEGIN;

alter table preseason_games
  add column away_ot smallint,
  add column home_ot smallint,
  add constraint preseason_games_ot_nonnegative check ((away_ot is null or away_ot >= 0) and (home_ot is null or home_ot >= 0));

comment on column preseason_games.away_ot is 'アウェーの延長の合計得点(Excel の Away OT)。延長なしは NULL。';
comment on column preseason_games.home_ot is 'ホームの延長の合計得点(Excel の Home OT)。延長なしは NULL。';

create or replace function import_preseason(p_games jsonb, p_players jsonb, p_totals jsonb, p_coverage jsonb)
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
      away_ot smallint, home_ot smallint,
      game_info text, venue text, source_notes text, source_url text
    )
  loop
    insert into preseason_games (
      game_key, game_date, away_team_id, home_team_id, away_team_label, home_team_label, status, status_detail,
      away_score, home_score, away_q1, away_q2, away_q3, away_q4, home_q1, home_q2, home_q3, home_q4,
      away_ot, home_ot, game_info, venue, source_notes, source_url, last_imported_at
    ) values (
      g.game_key, g.game_date, g.away_team_id, g.home_team_id, g.away_team_label, g.home_team_label, g.status, g.status_detail,
      g.away_score, g.home_score, g.away_q1, g.away_q2, g.away_q3, g.away_q4, g.home_q1, g.home_q2, g.home_q3, g.home_q4,
      g.away_ot, g.home_ot, g.game_info, g.venue, g.source_notes, g.source_url, now()
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
      away_ot = excluded.away_ot, home_ot = excluded.home_ot,
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

COMMIT;
