-- 選手名鑑用プロフィール項目(player-profile-input-master-2026-27.xlsx)の受け皿。
-- 既存テーブル・既存カラムには一切変更を加えず、列の追加のみ行う。

BEGIN;

-- 最終在籍校/直前所属(大学・海外クラブ等)。選手個人の経歴であり season非依存のため players に置く。
alter table players add column pre_draft_team text;
comment on column players.pre_draft_team is
  '出身校・直前所属(例: "Maryland", "Real Madrid (Spain)")。出典: NBA_2026_2027ロスター完成版.xlsx Rosterシート。';

-- 2026-27の背番号。シーズン・チームが変わるとつけ直されるため、
-- players ではなく player_season_rosters(season単位のロスター行)に置く。
alter table player_season_rosters add column jersey_number smallint null;
comment on column player_season_rosters.jersey_number is
  '対象シーズン開幕時点の背番号。シーズン専用データのため players には持たせない。';

COMMIT;
