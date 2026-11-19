-- 重複して登録されていた選手「Craig Porter」(生年月日なし・ロスター未登録)の成績行を消す。
-- 本来の選手は「Craig Porter Jr.」(fd1573b2-b739-4a6f-9fee-0003711a9ca7、生年月日 2000-02-26)で、こちらの行には触れない。
-- 消すのは重複側の2行だけ: 2025 regular_season(64試合・1148分・289点)と 2025 playoffs(9試合・50分・9点)。
-- 選手レコード(players)自体は残す(成績が無くなるため、選手スタッツ一覧・チームスタッツには出なくなる)。
begin;

delete from player_stats s
using players p
where s.player_id = p.id
  and p.id = '1305aeff-89f1-4dd6-aadc-dd9872f5730d'
  and p.first_name = 'Craig'
  and p.last_name = 'Porter'
  and p.birth_date is null
  and s.season = 2025;

commit;
