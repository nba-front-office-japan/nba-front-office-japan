-- 2026-27開幕時点の経験年数(YOS)を player_season_rosters に持たせる。
-- players(選手マスター)側には追加しない。経験年数はシーズン単位で変わる値であり、
-- 「2026-27開幕時点」という一時点のスナップショットとして season=2026 の行にのみ意味を持つため。
--
-- 値の出典: NBA_2026_2027ロスター完成版.xlsx の Roster シート「YOS」列。
-- YOS = 0 はルーキー(経験年数ゼロ)を表す有効な値であり、null(未登録)とは区別する。
--
-- このファイルはスキーマ変更のみを行う。実際の値の更新(UPDATE)は、
-- Excelとの照合が556名すべて一意に取れた場合にのみ別ファイルとして生成する。

alter table player_season_rosters add column years_of_service smallint null;

comment on column player_season_rosters.years_of_service is
  '対象シーズン開幕時点のNBA経験年数。0はルーキーを意味する有効値(nullは未登録)。出典: NBA_2026_2027ロスター完成版.xlsx Rosterシート YOS列。';
