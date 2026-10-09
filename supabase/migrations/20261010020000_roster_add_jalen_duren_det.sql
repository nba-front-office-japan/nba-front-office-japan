-- 2026-27ロスター(season=2026)に、既存の選手データ「Jalen Duren」を
-- デトロイト・ピストンズ所属として1行追加する。players には何も追加しない(重複を作らない)。
-- 背番号・ポジション・経験年数は、追加後にユーザー確認済みの値で更新する(下の update)。
-- 既に season=2026 の行がある場合は何もしない(on conflict do nothing)。

insert into player_season_rosters (player_id, team_id, season, roster_status)
select p.id, t.id, 2026, 'active'
from players p
join teams t on t.abbreviation = 'DET'
where p.id = '22cd2a09-9e54-4101-a5cf-896ae6b73901'
  and p.full_name = 'Jalen Duren'
on conflict (player_id, season) do nothing;

-- 追加後、ユーザー確認済みの値(C / 背番号0 / 経験4年)で更新(2026-10-09 実行済み)
update player_season_rosters
set position = 'C', jersey_number = 0, years_of_service = 4
where player_id = '22cd2a09-9e54-4101-a5cf-896ae6b73901' and season = 2026;
