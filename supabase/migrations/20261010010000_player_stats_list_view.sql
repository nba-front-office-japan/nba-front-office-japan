-- 選手スタッツ一覧(/stats)用のビュー。DBの段階で並べ替え・絞り込み・100件ずつの取得をできるようにする。
-- 1行 = 選手 × シーズン × 種別(レギュラーシーズン / プレーオフ)。
-- 成績は、合計行(team_id が NULL の行)があればそれを使い、なければチーム別の行を足し合わせる
-- (これまで画面側で行っていた集計と同じ)。1試合平均・FG% などもここで計算する。
--
-- ・player_stats_list : 一覧の行(並べ替え用の計算済みの値と、チーム表示用の値を持つ)
-- ・player_stats_list_seasons : 一覧で選べるシーズン・種別(SEASON の選択肢用)
--
-- テーブル・データの変更はない(読み取り専用のビューを2つ作るだけ)。
-- security_invoker を付けるため、元のテーブルの読み取り権限(RLS)がそのまま適用される。
--
-- ロールバック:
--   drop view if exists player_stats_list_seasons;
--   drop view if exists player_stats_list;

BEGIN;

create view player_stats_list with (security_invoker = true) as
with grouped as (
  select
    s.player_id,
    s.season,
    s.season_type,
    -- チーム別の行の数(2以上 = シーズン中に複数チームでプレー)
    count(*) filter (where s.team_id is not null) as team_count,
    bool_or(s.team_id is null) as has_total_row,
    coalesce(array_agg(s.team_id order by s.team_id) filter (where s.team_id is not null), '{}') as team_ids,
    -- 合計行があればその値、なければチーム別の行の合計
    case when bool_or(s.team_id is null) then sum(s.games_played) filter (where s.team_id is null) else sum(s.games_played) end as games_played,
    case when bool_or(s.team_id is null) then sum(s.minutes_played) filter (where s.team_id is null) else sum(s.minutes_played) end as minutes_played,
    case when bool_or(s.team_id is null) then sum(s.points) filter (where s.team_id is null) else sum(s.points) end as points,
    case when bool_or(s.team_id is null) then sum(s.rebounds_offensive) filter (where s.team_id is null) else sum(s.rebounds_offensive) end as rebounds_offensive,
    case when bool_or(s.team_id is null) then sum(s.rebounds_defensive) filter (where s.team_id is null) else sum(s.rebounds_defensive) end as rebounds_defensive,
    case when bool_or(s.team_id is null) then sum(s.rebounds_total) filter (where s.team_id is null) else sum(s.rebounds_total) end as rebounds_total,
    case when bool_or(s.team_id is null) then sum(s.assists) filter (where s.team_id is null) else sum(s.assists) end as assists,
    case when bool_or(s.team_id is null) then sum(s.steals) filter (where s.team_id is null) else sum(s.steals) end as steals,
    case when bool_or(s.team_id is null) then sum(s.blocks) filter (where s.team_id is null) else sum(s.blocks) end as blocks,
    case when bool_or(s.team_id is null) then sum(s.turnovers) filter (where s.team_id is null) else sum(s.turnovers) end as turnovers,
    case when bool_or(s.team_id is null) then sum(s.personal_fouls) filter (where s.team_id is null) else sum(s.personal_fouls) end as personal_fouls,
    case when bool_or(s.team_id is null) then sum(s.field_goals_made) filter (where s.team_id is null) else sum(s.field_goals_made) end as field_goals_made,
    case when bool_or(s.team_id is null) then sum(s.field_goals_attempted) filter (where s.team_id is null) else sum(s.field_goals_attempted) end as field_goals_attempted,
    case when bool_or(s.team_id is null) then sum(s.three_pointers_made) filter (where s.team_id is null) else sum(s.three_pointers_made) end as three_pointers_made,
    case when bool_or(s.team_id is null) then sum(s.three_pointers_attempted) filter (where s.team_id is null) else sum(s.three_pointers_attempted) end as three_pointers_attempted,
    case when bool_or(s.team_id is null) then sum(s.free_throws_made) filter (where s.team_id is null) else sum(s.free_throws_made) end as free_throws_made,
    case when bool_or(s.team_id is null) then sum(s.free_throws_attempted) filter (where s.team_id is null) else sum(s.free_throws_attempted) end as free_throws_attempted
  from player_stats s
  group by s.player_id, s.season, s.season_type
),
-- ポジションは最新シーズンのロスターの値(これまでの画面と同じく、ロスターにない選手は NULL)
latest_roster as (
  select r.player_id, r.position
  from player_season_rosters r
  where r.season = (select max(season) from player_season_rosters)
)
select
  -- 一覧の行のキー(選手・シーズン・種別の組み合わせ)
  g.player_id || ':' || g.season || ':' || g.season_type as id,
  g.player_id,
  g.season,
  g.season_type,
  coalesce(p.full_name_ja, p.full_name) as player_name,
  lr.position,
  g.team_count,
  g.has_total_row,
  g.team_ids,
  -- チーム欄: 1チームならその略称、複数チームなら「2チーム合計」など、
  -- チーム別の行がなく合計行だけの場合(過去シーズンの移籍選手)は「複数チーム合計」
  case
    when g.team_count = 1 then coalesce(t.abbreviation, '-')
    when g.team_count >= 2 then g.team_count || 'チーム合計'
    else '複数チーム合計'
  end as team_label,
  g.games_played,
  g.minutes_played,
  g.points,
  g.rebounds_offensive,
  g.rebounds_defensive,
  g.rebounds_total,
  g.assists,
  g.steals,
  g.blocks,
  g.turnovers,
  g.personal_fouls,
  g.field_goals_made,
  g.field_goals_attempted,
  g.three_pointers_made,
  g.three_pointers_attempted,
  g.free_throws_made,
  g.free_throws_attempted,
  -- 1試合平均・成功率(試合数・試投数が0なら NULL)。並べ替えに使う
  g.minutes_played::numeric / nullif(g.games_played, 0) as mpg,
  g.points::numeric / nullif(g.games_played, 0) as ppg,
  g.rebounds_offensive::numeric / nullif(g.games_played, 0) as orb_pg,
  g.rebounds_defensive::numeric / nullif(g.games_played, 0) as drb_pg,
  g.rebounds_total::numeric / nullif(g.games_played, 0) as rpg,
  g.assists::numeric / nullif(g.games_played, 0) as apg,
  g.steals::numeric / nullif(g.games_played, 0) as stl_pg,
  g.blocks::numeric / nullif(g.games_played, 0) as blk_pg,
  g.turnovers::numeric / nullif(g.games_played, 0) as tov_pg,
  g.personal_fouls::numeric / nullif(g.games_played, 0) as pf_pg,
  g.field_goals_made::numeric * 100 / nullif(g.field_goals_attempted, 0) as fg_pct,
  g.three_pointers_made::numeric * 100 / nullif(g.three_pointers_attempted, 0) as three_pct,
  g.free_throws_made::numeric * 100 / nullif(g.free_throws_attempted, 0) as ft_pct,
  g.points::numeric * 100 / nullif(2 * (g.field_goals_attempted + 0.44 * g.free_throws_attempted), 0) as ts_pct
from grouped g
join players p on p.id = g.player_id
left join teams t on g.team_count = 1 and t.id = g.team_ids[1]
left join latest_roster lr on lr.player_id = g.player_id;

comment on view player_stats_list is
  '選手スタッツ一覧(/stats)用。選手×シーズン×種別で1行。合計行があればそれを、なければチーム別の行を合算。1試合平均・成功率を計算済み。';

create view player_stats_list_seasons with (security_invoker = true) as
select distinct season, season_type from player_stats;

comment on view player_stats_list_seasons is '選手スタッツ一覧(/stats)で選べるシーズン・種別。';

revoke all on player_stats_list, player_stats_list_seasons from anon, authenticated;
grant select on player_stats_list, player_stats_list_seasons to anon, authenticated;

COMMIT;
