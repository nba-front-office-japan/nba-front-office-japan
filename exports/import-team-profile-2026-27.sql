-- Excelのチームプロフィール情報(2026-27)を team_profiles / team_staff_members へ取り込む
-- 入力Excel: C:\Users\user\OneDrive\デスクトップ\NBA DATA BASE\team-profile-input-2026-27.xlsx
--   ・teams シート            → team_profiles        30チーム
--   ・assistant_coaches シート → team_staff_members  216名
-- 取り込まないもの: Original Notes / Verification Status / open_issues(および assistant_coaches の Notes)
-- 取り込み方:
--   ・team_id は Excelの Abbr と既存 teams.abbreviation の照合で取得する
--   ・GM・Governor が空欄のチームは NULL(GM 7チーム、Governor 1チーム)。NULL はGM/Governor不在を意味しない
--   ・Source URL は複数URLの改行を保持する
--   ・Head Coach は team_profiles のみ。team_staff_members には入れない
--   ・role_title はExcelの役職名そのまま(Assistant Coach / Lead Assistant Coach / Associate Head Coach)
--   ・Display Order はExcelの値をそのまま使う
--   ・team_president_role はExcelに専用列が無い(Original Notes内のみ)ため NULL で取り込む
-- 前提: supabase/migrations/20260920010000_team_profiles.sql を先に実行し、2テーブルが空であること。
-- このファイルはまだ実行しない。内容確認後に手作業で実行すること。
--
-- 安全策(満たさなければ例外で全体をロールバックする):
--   ・先頭で2テーブルの存在と「空であること」を確認(データがあれば何も変更せず停止)
--   ・Abbr 30件すべてが既存 teams と1対1で一致すること
--   ・取り込み後に 30チーム / 216名、チームごとの人数、GM・Governorの空欄数、役職別人数を検証

BEGIN;

-- 0) 取り込み前の確認(先頭)
do $$
declare v_n bigint;
begin
  if to_regclass('public.team_profiles') is null or to_regclass('public.team_staff_members') is null then
    raise exception '中止: team_profiles / team_staff_members が存在しません(マイグレーション未実行)';
  end if;
  select count(*) into v_n from team_profiles;
  if v_n <> 0 then raise exception '中止: team_profiles に既に % 行あります(空ではない)', v_n; end if;
  select count(*) into v_n from team_staff_members;
  if v_n <> 0 then raise exception '中止: team_staff_members に既に % 行あります(空ではない)', v_n; end if;
end $$;

-- 1) Excelの内容を一時テーブルへ
create temp table imp_profiles (
  abbr text primary key, arena_name_ja text, arena_name_en text, g_league_affiliate text, owner_name text, governor_name text,
  team_president_name text, basketball_operations_name text, basketball_operations_role text, gm_name text, head_coach_name text,
  last_verified date, source_url text
) on commit drop;

create temp table imp_staff (
  abbr text not null, name text not null, role_title text not null, display_order smallint not null, last_verified date, source_url text
) on commit drop;

insert into imp_profiles (abbr, arena_name_ja, arena_name_en, g_league_affiliate, owner_name, governor_name, team_president_name, basketball_operations_name, basketball_operations_role, gm_name, head_coach_name, last_verified, source_url) values
  ('BOS', 'TDガーデン', 'TD Garden', 'Maine Celtics', 'Bill Chisholm', 'Bill Chisholm', 'Rich Gotham', 'Brad Stevens', 'President of Basketball Operations', null, 'Joe Mazzulla', '2026-09-20', E'https://basketball.realgm.com/nba/staff-members/16/General-Manager/Current\nhttps://www.nba.com/teams\nhttps://nbacoaches.com/nba-head-coaches/\nhttps://www.basketball-reference.com/coaches/'),
  ('BKN', 'バークレイズ・センター', 'Barclays Center', 'Long Island Nets', 'Joe Tsai, Clara Wu Tsai', 'Joe Tsai', 'Sam Zussman', 'Sean Marks', 'General Manager（編成責任者）', 'Sean Marks', 'Jordi Fernández', '2026-09-20', E'https://basketball.realgm.com/nba/staff-members/17/General-Manager/Current\nhttps://www.nba.com/teams\nhttps://nbacoaches.com/nba-head-coaches/\nhttps://www.basketball-reference.com/coaches/'),
  ('NYK', 'マディソン・スクエア・ガーデン', 'Madison Square Garden', 'Westchester Knicks', 'MSG Sports / Dolan family', 'James Dolan', 'Leon Rose', 'Leon Rose', 'President, New York Knicks', null, 'Mike Brown', '2026-09-24', E'https://basketball.realgm.com/nba/staff-members/18/General-Manager/Current\nhttps://www.nba.com/teams\nhttps://nbacoaches.com/nba-head-coaches/\nhttps://www.basketball-reference.com/coaches/'),
  ('PHI', 'エックスフィニティ・モバイル・アリーナ', 'Xfinity Mobile Arena', 'Delaware Blue Coats', 'Josh Harris, David Blitzer (HBSE)', 'Josh Harris', 'Tad Brown', 'Mike Gansey', 'President of Basketball Operations', 'Jameer Nelson', 'Nick Nurse', '2026-09-20', E'https://basketball.realgm.com/nba/staff-members/19/General-Manager/Current\nhttps://www.nba.com/teams\nhttps://nbacoaches.com/nba-head-coaches/\nhttps://www.basketball-reference.com/coaches/'),
  ('TOR', 'スコシアバンク・アリーナ', 'Scotiabank Arena', 'Raptors 905', 'MLSE (Rogers-controlled)', 'Larry Tanenbaum', 'Keith Pelley', 'Bobby Webster', 'Executive Vice President & General Manager', 'Bobby Webster', 'Darko Rajaković', '2026-09-20', E'https://basketball.realgm.com/nba/staff-members/20/General-Manager/Current\nhttps://www.nba.com/teams\nhttps://nbacoaches.com/nba-head-coaches/\nhttps://www.basketball-reference.com/coaches/'),
  ('CHI', 'ユナイテッド・センター', 'United Center', 'Windy City Bulls', 'Jerry Reinsdorf group', 'Michael Reinsdorf', 'Michael Reinsdorf', 'Bryson Graham', 'EVP, Basketball Operations', null, 'Tiago Splitter', '2026-09-20', E'https://basketball.realgm.com/nba/staff-members/21/General-Manager/Current\nhttps://www.nba.com/teams\nhttps://nbacoaches.com/nba-head-coaches/\nhttps://www.basketball-reference.com/coaches/'),
  ('CLE', 'ロケット・アリーナ', 'Rocket Arena', 'Cleveland Charge', 'Dan Gilbert', 'Dan Gilbert', 'Nic Barlage', 'Koby Altman', 'President of Basketball Operations', 'Brandon Weems', 'Kenny Atkinson', '2026-09-20', E'https://basketball.realgm.com/nba/staff-members/22/General-Manager/Current\nhttps://www.nba.com/teams\nhttps://nbacoaches.com/nba-head-coaches/\nhttps://www.basketball-reference.com/coaches/'),
  ('DET', 'リトル・シーザーズ・アリーナ', 'Little Caesars Arena', 'Motor City Cruise', 'Tom Gores', 'Tom Gores', 'Melanie Harris', 'Trajan Langdon', 'President of Basketball Operations', null, 'J. B. Bickerstaff', '2026-09-20', E'https://basketball.realgm.com/nba/staff-members/23/General-Manager/Current\nhttps://www.nba.com/teams\nhttps://nbacoaches.com/nba-head-coaches/\nhttps://www.basketball-reference.com/coaches/'),
  ('IND', 'ゲインブリッジ・フィールドハウス', 'Gainbridge Fieldhouse', 'Noblesville Boom', 'Herb Simon / Simon family', 'Herb Simon', 'Mel Raines', 'Kevin Pritchard', 'President of Basketball Operations', 'Chad Buchanan', 'Rick Carlisle', '2026-09-20', E'https://basketball.realgm.com/nba/staff-members/24/General-Manager/Current\nhttps://www.nba.com/teams\nhttps://nbacoaches.com/nba-head-coaches/\nhttps://www.basketball-reference.com/coaches/'),
  ('MIL', 'ファイサーブ・フォーラム', 'Fiserv Forum', 'Wisconsin Herd', 'Wes Edens, Jimmy & Dee Haslam, Jamie Dinan', 'Wes Edens', 'Josh Glessing', 'Jon Horst', 'General Manager（編成責任者）', 'Jon Horst', 'Taylor Jenkins', '2026-09-20', E'https://basketball.realgm.com/nba/staff-members/25/General-Manager/Current\nhttps://www.nba.com/teams\nhttps://nbacoaches.com/nba-head-coaches/\nhttps://www.basketball-reference.com/coaches/'),
  ('ATL', 'ステートファーム・アリーナ', 'State Farm Arena', 'College Park Skyhawks', 'Tony Ressler, Jami Gertz', 'Tony Ressler', 'Steve Koonin', 'Onsi Saleh', 'President of Basketball Operations', null, 'Quin Snyder', '2026-09-24', E'https://basketball.realgm.com/nba/staff-members/26/General-Manager/Current\nhttps://www.nba.com/teams\nhttps://nbacoaches.com/nba-head-coaches/\nhttps://www.basketball-reference.com/coaches/'),
  ('CHA', 'スペクトラム・センター', 'Spectrum Center', 'Greensboro Swarm', 'Rick Schnall, Gabe Plotkin', 'Rick Schnall', 'Shelly Cayette-Weston', 'Jeff Peterson', 'President of Basketball Operations', null, 'Charles Lee', '2026-09-20', E'https://basketball.realgm.com/nba/staff-members/27/General-Manager/Current\nhttps://www.nba.com/teams\nhttps://nbacoaches.com/nba-head-coaches/\nhttps://www.basketball-reference.com/coaches/'),
  ('MIA', 'カセヤ・センター', 'Kaseya Center', 'Sioux Falls Skyforce', 'Micky Arison', 'Micky Arison', 'Eric Woolworth', 'Pat Riley', 'President（編成担当）', 'Andy Elisburg', 'Erik Spoelstra', '2026-09-20', E'https://basketball.realgm.com/nba/staff-members/28/General-Manager/Current\nhttps://www.nba.com/teams\nhttps://nbacoaches.com/nba-head-coaches/\nhttps://www.basketball-reference.com/coaches/'),
  ('ORL', 'キア・センター', 'Kia Center', 'Osceola Magic', 'DeVos family', 'Dan DeVos', 'Charles (Charlie) Freeman', 'Jeff Weltman', 'President of Basketball Operations', 'Anthony Parker', 'Sean Sweeney', '2026-09-20', E'https://basketball.realgm.com/nba/staff-members/29/General-Manager/Current\nhttps://www.nba.com/teams\nhttps://nbacoaches.com/nba-head-coaches/\nhttps://www.basketball-reference.com/coaches/'),
  ('WAS', 'キャピタル・ワン・アリーナ', 'Capital One Arena', 'Capital City Go-Go', 'Ted Leonsis / Monumental Sports & Entertainment', 'Ted Leonsis', 'Jim Van Stone', 'Michael Winger', 'President, Monumental Basketball', 'Will Dawkins', 'Brian Keefe', '2026-09-20', E'https://basketball.realgm.com/nba/staff-members/30/General-Manager/Current\nhttps://www.nba.com/teams\nhttps://nbacoaches.com/nba-head-coaches/\nhttps://www.basketball-reference.com/coaches/'),
  ('DEN', 'ボール・アリーナ', 'Ball Arena', 'Grand Rapids Gold', 'E. Stanley Kroenke', 'E. Stanley Kroenke', 'Kevin Demoff', 'Ben Tenzer', 'Executive Vice President of Basketball Operations', null, 'David Adelman', '2026-09-24', E'https://basketball.realgm.com/nba/staff-members/31/General-Manager/Current\nhttps://www.nba.com/teams\nhttps://nbacoaches.com/nba-head-coaches/\nhttps://www.basketball-reference.com/coaches/'),
  ('MIN', 'ターゲット・センター', 'Target Center', 'Iowa Wolves', 'Marc Lore, Alex Rodriguez', 'Marc Lore', 'Matthew Caldwell', 'Tim Connelly', 'President of Basketball Operations', 'Matt Lloyd', 'Chris Finch', '2026-09-24', E'https://basketball.realgm.com/nba/staff-members/32/General-Manager/Current\nhttps://www.nba.com/teams\nhttps://nbacoaches.com/nba-head-coaches/\nhttps://www.basketball-reference.com/coaches/'),
  ('OKC', 'ペイコム・センター', 'Paycom Center', 'Oklahoma City Blue', 'Clay Bennett group / Professional Basketball Club LLC', 'Clay Bennett', 'Danny Barth', 'Sam Presti', 'Executive Vice President & General Manager', 'Sam Presti', 'Mark Daigneault', '2026-09-20', E'https://basketball.realgm.com/nba/staff-members/33/General-Manager/Current\nhttps://www.nba.com/teams\nhttps://nbacoaches.com/nba-head-coaches/\nhttps://www.basketball-reference.com/coaches/'),
  ('POR', 'モダ・センター', 'Moda Center', 'Rip City Remix', 'Tom Dundon', 'Tom Dundon', 'Dewayne Hankins', 'Joe Cronin', 'General Manager（編成責任者）', 'Joe Cronin', 'Micah Nori', '2026-09-20', E'https://basketball.realgm.com/nba/staff-members/34/General-Manager/Current\nhttps://www.nba.com/teams\nhttps://nbacoaches.com/nba-head-coaches/\nhttps://www.basketball-reference.com/coaches/'),
  ('UTA', 'デルタ・センター', 'Delta Center', 'Salt Lake City Stars', 'Ryan & Ashley Smith / Smith Entertainment Group', 'Ryan Smith', 'Jim Olson', 'Austin Ainge', 'President of Basketball Operations', 'Justin Zanik', 'Will Hardy', '2026-09-20', E'https://basketball.realgm.com/nba/staff-members/35/General-Manager/Current\nhttps://www.nba.com/teams\nhttps://nbacoaches.com/nba-head-coaches/\nhttps://www.basketball-reference.com/coaches/'),
  ('GSW', 'チェイス・センター', 'Chase Center', 'Santa Cruz Warriors', 'Joe Lacob, Peter Guber group', 'Joe Lacob', 'Brandon Schneider', 'Mike Dunleavy Jr.', 'General Manager（編成責任者）', 'Mike Dunleavy Jr.', 'Steve Kerr', '2026-09-20', E'https://basketball.realgm.com/nba/staff-members/36/General-Manager/Current\nhttps://www.nba.com/teams\nhttps://nbacoaches.com/nba-head-coaches/\nhttps://www.basketball-reference.com/coaches/'),
  ('LAC', 'インテュイット・ドーム', 'Intuit Dome', 'San Diego Clippers', 'Steve Ballmer', null, 'Gillian Zucker', 'Lawrence Frank', 'President of Basketball Operations', 'Trent Redden', 'Tyronn Lue', '2026-09-24', E'https://basketball.realgm.com/nba/staff-members/37/General-Manager/Current\nhttps://www.nba.com/teams\nhttps://nbacoaches.com/nba-head-coaches/\nhttps://www.basketball-reference.com/coaches/'),
  ('LAL', 'クリプト・ドットコム・アリーナ', 'Crypto.com Arena', 'Coachella Valley Lakers', 'Mark Walter', 'Jeanie Buss', 'Lon Rosen', 'Rob Pelinka', 'President of Basketball Operations & GM', 'Rob Pelinka', 'JJ Redick', '2026-09-24', E'https://basketball.realgm.com/nba/staff-members/38/General-Manager/Current\nhttps://www.nba.com/teams\nhttps://nbacoaches.com/nba-head-coaches/\nhttps://www.basketball-reference.com/coaches/'),
  ('PHX', 'モーゲージ・マッチアップ・センター', 'Mortgage Matchup Center', 'Valley Suns', 'Mat Ishbia, Justin Ishbia', 'Mat Ishbia', 'Josh Bartelstein', 'Brian Gregory', 'General Manager（編成責任者）', 'Brian Gregory', 'Jordan Ott', '2026-09-20', E'https://basketball.realgm.com/nba/staff-members/39/General-Manager/Current\nhttps://www.nba.com/teams\nhttps://nbacoaches.com/nba-head-coaches/\nhttps://www.basketball-reference.com/coaches/'),
  ('SAC', 'ゴールデン1センター', 'Golden 1 Center', 'Stockton Kings', 'Vivek Ranadivé', 'Vivek Ranadivé', 'John Rinehart', 'Scott Perry', 'General Manager（編成責任者）', 'Scott Perry', 'Doug Christie', '2026-09-20', E'https://basketball.realgm.com/nba/staff-members/40/General-Manager/Current\nhttps://www.nba.com/teams\nhttps://nbacoaches.com/nba-head-coaches/\nhttps://www.basketball-reference.com/coaches/'),
  ('DAL', 'アメリカン・エアラインズ・センター', 'American Airlines Center', 'Texas Legends', 'Adelson / Dumont families', 'Patrick Dumont', 'Ethan Casson', 'Masai Ujiri', 'President & Alternate Governor（編成担当）', 'Mike Schmitz', 'Dusty May', '2026-09-20', E'https://basketball.realgm.com/nba/staff-members/41/General-Manager/Current\nhttps://www.nba.com/teams\nhttps://nbacoaches.com/nba-head-coaches/\nhttps://www.basketball-reference.com/coaches/'),
  ('HOU', 'トヨタ・センター', 'Toyota Center', 'Rio Grande Valley Vipers', 'Tilman Fertitta', 'Tilman Fertitta', 'Gretchen Sheirr', 'Rafael Stone', 'General Manager（編成責任者）', 'Rafael Stone', 'Ime Udoka', '2026-09-20', E'https://basketball.realgm.com/nba/staff-members/42/General-Manager/Current\nhttps://www.nba.com/teams\nhttps://nbacoaches.com/nba-head-coaches/\nhttps://www.basketball-reference.com/coaches/'),
  ('MEM', 'フェデックス・フォーラム', 'FedExForum', 'Memphis Hustle', 'Robert Pera', 'Robert Pera', 'Jason Wexler', 'Zach Kleiman', 'EVP, Basketball Operations & General Manager', 'Zach Kleiman', 'Tuomas Iisalo', '2026-09-20', E'https://basketball.realgm.com/nba/staff-members/43/General-Manager/Current\nhttps://www.nba.com/teams\nhttps://nbacoaches.com/nba-head-coaches/\nhttps://www.basketball-reference.com/coaches/'),
  ('NOP', 'スムージー・キング・センター', 'Smoothie King Center', 'Laketown Squadron', 'Gayle Benson', 'Gayle Benson', 'Dennis Lauscha', 'Joe Dumars', 'EVP, Basketball Operations', 'Troy Weaver', 'Jamahl Mosley', '2026-09-20', E'https://basketball.realgm.com/nba/staff-members/44/General-Manager/Current\nhttps://www.nba.com/teams\nhttps://nbacoaches.com/nba-head-coaches/\nhttps://www.basketball-reference.com/coaches/'),
  ('SAS', 'フロスト・バンク・センター', 'Frost Bank Center', 'Austin Spurs', 'Holt family / Spurs Sports & Entertainment', 'Peter J. Holt', 'Peter J. Holt', 'Gregg Popovich', 'President of Basketball Operations', 'Brian Wright', 'Mitch Johnson', '2026-09-20', E'https://basketball.realgm.com/nba/staff-members/45/General-Manager/Current\nhttps://www.nba.com/teams\nhttps://nbacoaches.com/nba-head-coaches/\nhttps://www.basketball-reference.com/coaches/');

insert into imp_staff (abbr, name, role_title, display_order, last_verified, source_url) values
  ('BOS', 'Amile Jefferson', 'Assistant Coach', 1, '2026-09-24', 'https://www.nba.com/team/1610612738/roster'),
  ('BOS', 'D.J. MacLeay', 'Assistant Coach', 2, '2026-09-24', 'https://www.nba.com/team/1610612738/roster'),
  ('BOS', 'Matt Reynolds', 'Assistant Coach', 3, '2026-09-24', 'https://www.nba.com/team/1610612738/roster'),
  ('BOS', 'Tony Dobbins', 'Assistant Coach', 4, '2026-09-24', 'https://www.nba.com/team/1610612738/roster'),
  ('BOS', 'Sam Cassell', 'Assistant Coach', 5, '2026-09-24', 'https://www.nba.com/team/1610612738/roster'),
  ('BOS', 'Ross McMains', 'Assistant Coach', 6, '2026-09-24', 'https://www.nba.com/celtics/coaches'),
  ('BOS', 'Tyler Lashbrook', 'Assistant Coach', 7, '2026-09-24', 'https://www.nba.com/celtics/coaches'),
  ('BKN', 'Steve Hetzel', 'Assistant Coach', 1, '2026-09-24', 'https://www.nba.com/team/1610612751/roster'),
  ('BKN', 'Jay Hernandez', 'Assistant Coach', 2, '2026-09-24', 'https://www.nba.com/team/1610612751/roster'),
  ('BKN', 'Travis Bader', 'Assistant Coach', 3, '2026-09-24', 'https://www.nba.com/team/1610612751/roster'),
  ('BKN', 'Ryan Forehan-Kelly', 'Assistant Coach', 4, '2026-09-24', 'https://www.nba.com/team/1610612751/roster'),
  ('BKN', 'Deividas Dulkys', 'Assistant Coach', 5, '2026-09-24', 'https://www.nba.com/team/1610612751/roster'),
  ('BKN', 'Dutch Gaitley', 'Assistant Coach', 6, '2026-09-24', 'https://www.nba.com/team/1610612751/roster'),
  ('BKN', 'Corey Vinson', 'Assistant Coach', 7, '2026-09-24', 'https://www.nba.com/team/1610612751/roster'),
  ('BKN', 'Connor Griffin', 'Assistant Coach', 8, '2026-09-24', 'https://www.nba.com/team/1610612751/roster'),
  ('BKN', 'Juwan Howard', 'Assistant Coach', 9, '2026-09-24', 'https://www.nba.com/team/1610612751/roster'),
  ('NYK', 'Chris Jent', 'Assistant Coach', 1, '2026-09-24', 'https://www.nba.com/team/1610612752/roster'),
  ('NYK', 'Brendan O''Connor', 'Assistant Coach', 2, '2026-09-24', 'https://www.nba.com/team/1610612752/roster'),
  ('NYK', 'Mark Bryant', 'Assistant Coach', 3, '2026-09-24', 'https://www.nba.com/team/1610612752/roster'),
  ('NYK', 'Rick Brunson', 'Assistant Coach', 4, '2026-09-24', 'https://www.nba.com/team/1610612752/roster'),
  ('NYK', 'Darren Erman', 'Assistant Coach', 5, '2026-09-24', 'https://www.nba.com/team/1610612752/roster'),
  ('NYK', 'TJ Saint', 'Assistant Coach', 6, '2026-09-24', 'https://www.nba.com/team/1610612752/roster'),
  ('NYK', 'Riccardo Fois', 'Assistant Coach', 7, '2026-09-24', 'https://www.nba.com/team/1610612752/roster'),
  ('NYK', 'Charles Allen', 'Assistant Coach', 8, '2026-09-24', 'https://www.nba.com/team/1610612752/roster'),
  ('NYK', 'Maurice Cheeks', 'Assistant Coach', 9, '2026-09-24', 'https://www.nba.com/team/1610612752/roster'),
  ('PHI', 'Rico Hines', 'Assistant Coach', 1, '2026-09-24', 'https://www.nba.com/team/1610612755/roster'),
  ('PHI', 'Coby Karl', 'Assistant Coach', 2, '2026-09-24', 'https://www.nba.com/team/1610612755/roster'),
  ('PHI', 'Mike Longabardi', 'Assistant Coach', 3, '2026-09-24', 'https://www.nba.com/team/1610612755/roster'),
  ('PHI', 'Bryan Gates', 'Assistant Coach', 4, '2026-09-24', 'https://www.nba.com/team/1610612755/roster'),
  ('PHI', 'Matt Brase', 'Assistant Coach', 5, '2026-09-24', 'https://www.nba.com/team/1610612755/roster'),
  ('PHI', 'Doug West', 'Assistant Coach', 6, '2026-09-24', 'https://www.nba.com/team/1610612755/roster'),
  ('TOR', 'Pat Delany', 'Assistant Coach', 1, '2026-09-24', 'https://www.nba.com/team/1610612761/roster'),
  ('TOR', 'Mike Batiste', 'Assistant Coach', 2, '2026-09-24', 'https://www.nba.com/team/1610612761/roster'),
  ('TOR', 'Vin Bhavnani', 'Assistant Coach', 3, '2026-09-24', 'https://www.nba.com/team/1610612761/roster'),
  ('TOR', 'Stephen Silas', 'Assistant Coach', 4, '2026-09-24', 'https://www.nba.com/team/1610612761/roster'),
  ('TOR', 'Jim Sann', 'Assistant Coach', 5, '2026-09-24', 'https://www.nba.com/team/1610612761/roster'),
  ('TOR', 'James Wade', 'Assistant Coach', 6, '2026-09-24', 'https://www.nba.com/team/1610612761/roster'),
  ('TOR', 'Jama Mahlalela', 'Assistant Coach', 7, '2026-09-24', 'https://www.nba.com/team/1610612761/roster'),
  ('TOR', 'Mery Andrade', 'Assistant Coach', 8, '2026-09-24', 'https://www.nba.com/team/1610612761/roster'),
  ('TOR', 'Ivo Simovic', 'Assistant Coach', 9, '2026-09-24', 'https://www.nba.com/team/1610612761/roster'),
  ('CHI', 'Blake Ahearn', 'Assistant Coach', 1, '2026-09-24', 'https://www.nba.com/team/1610612741/roster'),
  ('CHI', 'Taj Gibson', 'Assistant Coach', 2, '2026-09-24', 'https://www.nba.com/team/1610612741/roster'),
  ('CHI', 'Jonah Herscu', 'Assistant Coach', 3, '2026-09-24', 'https://www.nba.com/team/1610612741/roster'),
  ('CHI', 'Jamelle McMillan', 'Assistant Coach', 4, '2026-09-24', 'https://www.nba.com/team/1610612741/roster'),
  ('CHI', 'Wes Unseld', 'Assistant Coach', 5, '2026-09-24', 'https://www.nba.com/team/1610612741/roster'),
  ('CHI', 'Rex Kalamian', 'Assistant Coach', 6, '2026-09-24', 'https://www.nba.com/team/1610612741/roster'),
  ('CHI', 'Jordan Brink', 'Assistant Coach', 7, '2026-09-24', 'https://www.nba.com/team/1610612741/roster'),
  ('CLE', 'Johnnie Bryant', 'Associate Head Coach', 1, '2026-09-24', 'https://www.nba.com/team/1610612739/roster'),
  ('CLE', 'Mike Gerrity', 'Assistant Coach', 2, '2026-09-24', 'https://www.nba.com/team/1610612739/roster'),
  ('CLE', 'Trevor Hendry', 'Assistant Coach', 3, '2026-09-24', 'https://www.nba.com/team/1610612739/roster'),
  ('CLE', 'Omar Cook', 'Assistant Coach', 4, '2026-09-24', 'https://www.nba.com/team/1610612739/roster'),
  ('CLE', 'Nate Reinking', 'Assistant Coach', 5, '2026-09-24', 'https://www.nba.com/team/1610612739/roster'),
  ('CLE', 'Jawad Williams', 'Assistant Coach', 6, '2026-09-24', 'https://www.nba.com/team/1610612739/roster'),
  ('CLE', 'Andrew Olson', 'Assistant Coach', 7, '2026-09-24', 'https://www.nba.com/team/1610612739/roster'),
  ('DET', 'Jarrett Jack', 'Assistant Coach', 1, '2026-09-24', 'https://www.nba.com/team/1610612765/roster'),
  ('DET', 'Fred Vinson', 'Assistant Coach', 2, '2026-09-24', 'https://www.nba.com/team/1610612765/roster'),
  ('DET', 'Vitaly Potapenko', 'Assistant Coach', 3, '2026-09-24', 'https://www.nba.com/team/1610612765/roster'),
  ('DET', 'Steve Scalzi', 'Assistant Coach', 4, '2026-09-24', 'https://www.nba.com/team/1610612765/roster'),
  ('DET', 'Luke Walton', 'Assistant Coach', 5, '2026-09-24', 'https://www.nba.com/team/1610612765/roster'),
  ('DET', 'Jerome Allen', 'Assistant Coach', 6, '2026-09-24', 'https://www.nba.com/team/1610612765/roster'),
  ('DET', 'Kevin Burleson', 'Assistant Coach', 7, '2026-09-24', 'https://www.nba.com/team/1610612765/roster'),
  ('DET', 'Sidney Lowe', 'Assistant Coach', 8, '2026-09-24', 'https://www.nba.com/team/1610612765/roster'),
  ('DET', 'Greg Smith', 'Assistant Coach', 9, '2026-09-24', 'https://www.nba.com/team/1610612765/roster'),
  ('DET', 'Josh Estes', 'Assistant Coach', 10, '2026-09-24', 'https://www.nba.com/team/1610612765/roster'),
  ('IND', 'Lloyd Pierce', 'Lead Assistant Coach', 1, '2026-09-24', 'https://www.nba.com/team/1610612754/roster'),
  ('IND', 'Jim Boylen', 'Assistant Coach', 2, '2026-09-24', 'https://www.nba.com/team/1610612754/roster'),
  ('IND', 'Jenny Boucek', 'Assistant Coach', 3, '2026-09-24', 'https://www.nba.com/team/1610612754/roster'),
  ('MIL', 'Brad Jones', 'Assistant Coach', 1, '2026-09-24', 'https://www.nba.com/team/1610612749/roster'),
  ('MIL', 'Pat St. Andrews', 'Assistant Coach', 2, '2026-09-24', 'https://www.nba.com/team/1610612749/roster'),
  ('MIL', 'Isaiah Wilkins', 'Assistant Coach', 3, '2026-09-24', 'https://www.nba.com/team/1610612749/roster'),
  ('MIL', 'Vince Legarza', 'Assistant Coach', 4, '2026-09-24', 'https://www.nba.com/team/1610612749/roster'),
  ('MIL', 'Schuyler Rimmer', 'Assistant Coach', 5, '2026-09-24', 'https://www.nba.com/team/1610612749/roster'),
  ('MIL', 'Jack Herum', 'Assistant Coach', 6, '2026-09-24', 'https://www.nba.com/team/1610612749/roster'),
  ('MIL', 'Johnny Carpenter', 'Assistant Coach', 7, '2026-09-24', 'https://www.nba.com/team/1610612749/roster'),
  ('MIL', 'Nshan Kenjoian', 'Assistant Coach', 8, '2026-09-24', 'https://www.nba.com/team/1610612749/roster'),
  ('MIL', 'T.J. Ford', 'Assistant Coach', 9, '2026-09-24', 'https://www.nba.com/team/1610612749/roster'),
  ('MIL', 'Darvin Ham', 'Assistant Coach', 10, '2026-09-24', 'https://www.nba.com/team/1610612749/roster'),
  ('ATL', 'Ronald Nored', 'Assistant Coach', 1, '2026-09-24', 'https://www.nba.com/team/1610612737/roster'),
  ('ATL', 'Antonio Lang', 'Assistant Coach', 2, '2026-09-24', 'https://www.nba.com/team/1610612737/roster'),
  ('ATL', 'Jeff Watkinson', 'Assistant Coach', 3, '2026-09-24', 'https://www.nba.com/team/1610612737/roster'),
  ('ATL', 'Igor Kokoskov', 'Assistant Coach', 4, '2026-09-24', 'https://www.nba.com/team/1610612737/roster'),
  ('ATL', 'Ekpe Udoh', 'Assistant Coach', 5, '2026-09-24', 'https://www.nba.com/team/1610612737/roster'),
  ('ATL', 'Bryan Bailey', 'Assistant Coach', 6, '2026-09-24', 'https://www.nba.com/team/1610612737/roster'),
  ('ATL', 'Ryan Schmidt', 'Assistant Coach', 7, '2026-09-24', 'https://www.nba.com/team/1610612737/roster'),
  ('ATL', 'Sanjay Lumpkin', 'Assistant Coach', 8, '2026-09-24', 'https://www.nba.com/team/1610612737/roster'),
  ('ATL', 'Mike Brey', 'Assistant Coach', 9, '2026-09-24', 'https://www.nba.com/team/1610612737/roster'),
  ('CHA', 'Matt Hill', 'Assistant Coach', 1, '2026-09-24', 'https://www.nba.com/team/1610612766/roster'),
  ('CHA', 'Kemba Walker', 'Assistant Coach', 2, '2026-09-24', 'https://www.nba.com/team/1610612766/roster'),
  ('CHA', 'Joshua Longstaff', 'Assistant Coach', 3, '2026-09-24', 'https://www.nba.com/team/1610612766/roster'),
  ('CHA', 'Lamar Skeeter', 'Assistant Coach', 4, '2026-09-24', 'https://www.nba.com/team/1610612766/roster'),
  ('CHA', 'Zach Peterson', 'Assistant Coach', 5, '2026-09-24', 'https://www.nba.com/team/1610612766/roster'),
  ('CHA', 'Ryan Frazier', 'Assistant Coach', 6, '2026-09-24', 'https://www.nba.com/team/1610612766/roster'),
  ('CHA', 'Blaine Mueller', 'Assistant Coach', 7, '2026-09-24', 'https://www.nba.com/team/1610612766/roster'),
  ('CHA', 'Jermaine Bucknor', 'Assistant Coach', 8, '2026-09-24', 'https://www.nba.com/team/1610612766/roster'),
  ('CHA', 'Kyle Neptune', 'Assistant Coach', 9, '2026-09-24', 'https://www.nba.com/team/1610612766/roster'),
  ('MIA', 'Caron Butler', 'Assistant Coach', 1, '2026-09-24', 'https://www.nba.com/team/1610612748/roster'),
  ('MIA', 'Vin Baker', 'Assistant Coach', 2, '2026-09-24', 'https://www.nba.com/team/1610612748/roster'),
  ('MIA', 'Wayne Ellington', 'Assistant Coach', 3, '2026-09-24', 'https://www.nba.com/team/1610612748/roster'),
  ('MIA', 'Chris Quinn', 'Assistant Coach', 4, '2026-09-24', 'https://www.nba.com/team/1610612748/roster'),
  ('MIA', 'Malik Allen', 'Assistant Coach', 5, '2026-09-24', 'https://www.nba.com/team/1610612748/roster'),
  ('MIA', 'Eric Glass', 'Assistant Coach', 6, '2026-09-24', 'https://www.nba.com/team/1610612748/roster'),
  ('ORL', 'Joe Prunty', 'Assistant Coach', 1, '2026-09-24', 'https://www.nba.com/team/1610612753/roster'),
  ('ORL', 'Greg Buckner', 'Assistant Coach', 2, '2026-09-24', 'https://www.nba.com/team/1610612753/roster'),
  ('ORL', 'Popeye Jones', 'Assistant Coach', 3, '2026-09-24', 'https://www.nba.com/team/1610612753/roster'),
  ('ORL', 'Josh Broghamer', 'Assistant Coach', 4, '2026-09-24', 'https://www.nba.com/team/1610612753/roster'),
  ('ORL', 'Tom Bialaszewski', 'Assistant Coach', 5, '2026-09-24', 'https://www.nba.com/team/1610612753/roster'),
  ('ORL', 'Riley Crean', 'Assistant Coach', 6, '2026-09-24', 'https://www.nba.com/team/1610612753/roster'),
  ('ORL', 'Jon Harris', 'Assistant Coach', 7, '2026-09-24', 'https://www.nba.com/team/1610612753/roster'),
  ('ORL', 'Ben Johnson', 'Assistant Coach', 8, '2026-09-24', 'https://www.nba.com/team/1610612753/roster'),
  ('ORL', 'Jacqlyn Poss', 'Assistant Coach', 9, '2026-09-24', 'https://www.nba.com/team/1610612753/roster'),
  ('ORL', 'Mfon Udofia', 'Assistant Coach', 10, '2026-09-24', 'https://www.nba.com/team/1610612753/roster'),
  ('ORL', 'DJ Bakker', 'Assistant Coach', 11, '2026-09-24', 'https://www.nba.com/team/1610612753/roster'),
  ('ORL', 'Shannan Lum', 'Assistant Coach', 12, '2026-09-24', 'https://www.nba.com/team/1610612753/roster'),
  ('WAS', 'Adam Caporn', 'Lead Assistant Coach', 1, '2026-09-24', 'https://www.nba.com/team/1610612764/roster'),
  ('WAS', 'James Fraschilla', 'Assistant Coach', 2, '2026-09-24', 'https://www.nba.com/team/1610612764/roster'),
  ('WAS', 'TJ Sorrentine', 'Assistant Coach', 3, '2026-09-24', 'https://www.nba.com/team/1610612764/roster'),
  ('WAS', 'J.J. Outlaw', 'Assistant Coach', 4, '2026-09-24', 'https://www.nba.com/team/1610612764/roster'),
  ('WAS', 'Alexis Ajinca', 'Assistant Coach', 5, '2026-09-24', 'https://www.nba.com/team/1610612764/roster'),
  ('WAS', 'Patrick Ewing', 'Assistant Coach', 6, '2026-09-24', 'https://www.nba.com/team/1610612764/roster'),
  ('WAS', 'Cody Toppert', 'Assistant Coach', 7, '2026-09-24', 'https://www.nba.com/team/1610612764/roster'),
  ('DEN', 'Jared Dudley', 'Assistant Coach', 1, '2026-09-24', 'https://www.nba.com/team/1610612743/roster'),
  ('DEN', 'Chase Buford', 'Assistant Coach', 2, '2026-09-24', 'https://www.nba.com/team/1610612743/roster'),
  ('DEN', 'John Beckett', 'Assistant Coach', 3, '2026-09-24', 'https://www.nba.com/team/1610612743/roster'),
  ('DEN', 'Ognjen Stojakovic', 'Assistant Coach', 4, '2026-09-24', 'https://www.nba.com/team/1610612743/roster'),
  ('DEN', 'Elvis Valcarcel', 'Assistant Coach', 5, '2026-09-24', 'https://www.nba.com/team/1610612743/roster'),
  ('MIN', 'Pablo Prigioni', 'Assistant Coach', 1, '2026-09-24', 'https://www.nba.com/team/1610612750/roster'),
  ('MIN', 'Elston Turner', 'Assistant Coach', 2, '2026-09-24', 'https://www.nba.com/team/1610612750/roster'),
  ('MIN', 'Kevin Hanson', 'Assistant Coach', 3, '2026-09-24', 'https://www.nba.com/team/1610612750/roster'),
  ('MIN', 'Chris Hines', 'Assistant Coach', 4, '2026-09-24', 'https://www.nba.com/team/1610612750/roster'),
  ('MIN', 'Jeff Newton', 'Assistant Coach', 5, '2026-09-24', 'https://www.nba.com/team/1610612750/roster'),
  ('OKC', 'Grant Gibbs', 'Assistant Coach', 1, '2026-09-24', 'https://www.nba.com/team/1610612760/roster'),
  ('OKC', 'Mike Wilks', 'Assistant Coach', 2, '2026-09-24', 'https://www.nba.com/team/1610612760/roster'),
  ('OKC', 'Chip Engelland', 'Assistant Coach', 3, '2026-09-24', 'https://www.nba.com/team/1610612760/roster'),
  ('OKC', 'Eric Maynor', 'Assistant Coach', 4, '2026-09-24', 'https://www.nba.com/team/1610612760/roster'),
  ('OKC', 'David Akinyooye', 'Assistant Coach', 5, '2026-09-24', 'https://www.nba.com/team/1610612760/roster'),
  ('OKC', 'Dave Bliss', 'Assistant Coach', 6, '2026-09-24', 'https://www.nba.com/team/1610612760/roster'),
  ('OKC', 'Zoe Vernon', 'Assistant Coach', 7, '2026-09-24', 'https://www.nba.com/team/1610612760/roster'),
  ('POR', 'James Posey', 'Assistant Coach', 1, '2026-09-24', 'https://www.nba.com/team/1610612757/roster'),
  ('POR', 'Quinton Crawford', 'Assistant Coach', 2, '2026-09-24', 'https://www.nba.com/team/1610612757/roster'),
  ('POR', 'Ronnie Burrell', 'Assistant Coach', 3, '2026-09-24', 'https://www.nba.com/team/1610612757/roster'),
  ('POR', 'Nate Bjorkgren', 'Assistant Coach', 4, '2026-09-24', 'https://www.nba.com/team/1610612757/roster'),
  ('UTA', 'Mike Williams', 'Assistant Coach', 1, '2026-09-24', 'https://www.nba.com/team/1610612762/roster'),
  ('UTA', 'Sean Sheldon', 'Assistant Coach', 2, '2026-09-24', 'https://www.nba.com/team/1610612762/roster'),
  ('UTA', 'Jason Terry', 'Assistant Coach', 3, '2026-09-24', 'https://www.nba.com/team/1610612762/roster'),
  ('UTA', 'Chad Forcier', 'Assistant Coach', 4, '2026-09-24', 'https://www.nba.com/team/1610612762/roster'),
  ('UTA', 'Scott Morrison', 'Assistant Coach', 5, '2026-09-24', 'https://www.nba.com/team/1610612762/roster'),
  ('UTA', 'Chris Jones', 'Assistant Coach', 6, '2026-09-24', 'https://www.nba.com/team/1610612762/roster'),
  ('UTA', 'Steve Wojciechowski', 'Assistant Coach', 7, '2026-09-24', 'https://www.nba.com/team/1610612762/roster'),
  ('UTA', 'Andrew Warren', 'Assistant Coach', 8, '2026-09-24', 'https://www.nba.com/team/1610612762/roster'),
  ('GSW', 'Frank Vogel', 'Associate Head Coach', 1, '2026-09-24', 'https://www.nba.com/team/1610612744/roster'),
  ('GSW', 'Anthony Vereen', 'Assistant Coach', 2, '2026-09-24', 'https://www.nba.com/team/1610612744/roster'),
  ('GSW', 'Ron Adams', 'Assistant Coach', 3, '2026-09-24', 'https://www.nba.com/team/1610612744/roster'),
  ('GSW', 'Bruce Fraser', 'Assistant Coach', 4, '2026-09-24', 'https://www.nba.com/team/1610612744/roster'),
  ('GSW', 'Seth Cooper', 'Assistant Coach', 5, '2026-09-24', 'https://www.nba.com/team/1610612744/roster'),
  ('GSW', 'Kris Weems', 'Assistant Coach', 6, '2026-09-24', 'https://www.nba.com/team/1610612744/roster'),
  ('GSW', 'Jacob Rubin', 'Assistant Coach', 7, '2026-09-24', 'https://www.nba.com/team/1610612744/roster'),
  ('GSW', 'Nicholas Kerr', 'Assistant Coach', 8, '2026-09-24', 'https://www.nba.com/team/1610612744/roster'),
  ('GSW', 'Khalid Robinson', 'Assistant Coach', 9, '2026-09-24', 'https://www.nba.com/team/1610612744/roster'),
  ('LAC', 'Jeff Van Gundy', 'Lead Assistant Coach', 1, '2026-09-24', 'https://www.nba.com/team/1610612746/roster'),
  ('LAC', 'Dahntay Jones', 'Assistant Coach', 2, '2026-09-24', 'https://www.nba.com/team/1610612746/roster'),
  ('LAC', 'Brian Shaw', 'Assistant Coach', 3, '2026-09-24', 'https://www.nba.com/team/1610612746/roster'),
  ('LAC', 'Jay Larranaga', 'Assistant Coach', 4, '2026-09-24', 'https://www.nba.com/team/1610612746/roster'),
  ('LAC', 'Shaun Fein', 'Assistant Coach', 5, '2026-09-24', 'https://www.nba.com/team/1610612746/roster'),
  ('LAC', 'Jeremy Castleberry', 'Assistant Coach', 6, '2026-09-24', 'https://www.nba.com/team/1610612746/roster'),
  ('LAC', 'Chris Holguin', 'Assistant Coach', 7, '2026-09-24', 'https://www.nba.com/team/1610612746/roster'),
  ('LAC', 'Tim Dather', 'Assistant Coach', 8, '2026-09-24', 'https://www.nba.com/team/1610612746/roster'),
  ('LAC', 'Conor Dunleavy', 'Assistant Coach', 9, '2026-09-24', 'https://www.nba.com/team/1610612746/roster'),
  ('LAC', 'Larry Drew', 'Assistant Coach', 10, '2026-09-24', 'https://www.nba.com/team/1610612746/roster'),
  ('LAL', 'Zach Guthrie', 'Assistant Coach', 1, '2026-09-24', 'https://www.nba.com/team/1610612747/roster'),
  ('LAL', 'Nate McMillan', 'Assistant Coach', 2, '2026-09-24', 'https://www.nba.com/team/1610612747/roster'),
  ('LAL', 'Scott Brooks', 'Assistant Coach', 3, '2026-09-24', 'https://www.nba.com/team/1610612747/roster'),
  ('LAL', 'Bob Beyer', 'Assistant Coach', 4, '2026-09-24', 'https://www.nba.com/team/1610612747/roster'),
  ('LAL', 'Greg St. Jean', 'Assistant Coach', 5, '2026-09-24', 'https://www.nba.com/team/1610612747/roster'),
  ('LAL', 'Lindsey Harding', 'Assistant Coach', 6, '2026-09-24', 'https://www.nba.com/team/1610612747/roster'),
  ('LAL', 'Beau Levesque', 'Assistant Coach', 7, '2026-09-24', 'https://www.nba.com/team/1610612747/roster'),
  ('PHX', 'Brian Randle', 'Assistant Coach', 1, '2026-09-24', 'https://www.nba.com/team/1610612756/roster'),
  ('PHX', 'Chaisson Allen', 'Assistant Coach', 2, '2026-09-24', 'https://www.nba.com/team/1610612756/roster'),
  ('PHX', 'John Little', 'Assistant Coach', 3, '2026-09-24', 'https://www.nba.com/team/1610612756/roster'),
  ('PHX', 'Sean Dwyer', 'Assistant Coach', 4, '2026-09-24', 'https://www.nba.com/team/1610612756/roster'),
  ('PHX', 'DeMarre Carroll', 'Assistant Coach', 5, '2026-09-24', 'https://www.nba.com/team/1610612756/roster'),
  ('PHX', 'Mike Muscala', 'Assistant Coach', 6, '2026-09-24', 'https://www.nba.com/team/1610612756/roster'),
  ('PHX', 'Jesse Mermuys', 'Assistant Coach', 7, '2026-09-24', 'https://www.nba.com/team/1610612756/roster'),
  ('SAC', 'Mike Woodson', 'Associate Head Coach', 1, '2026-09-24', 'https://www.nba.com/team/1610612758/roster'),
  ('SAC', 'Brendan Suhr', 'Assistant Coach', 2, '2026-09-24', 'https://www.nba.com/team/1610612758/roster'),
  ('SAC', 'Mike Miller', 'Assistant Coach', 3, '2026-09-24', 'https://www.nba.com/team/1610612758/roster'),
  ('SAC', 'Chris Darnell', 'Assistant Coach', 4, '2026-09-24', 'https://www.nba.com/team/1610612758/roster'),
  ('SAC', 'Leandro Barbosa', 'Assistant Coach', 5, '2026-09-24', 'https://www.nba.com/team/1610612758/roster'),
  ('SAC', 'DJ Ham', 'Assistant Coach', 6, '2026-09-24', 'https://www.nba.com/team/1610612758/roster'),
  ('DAL', 'Willie Green', 'Lead Assistant Coach', 1, '2026-09-24', 'https://www.nba.com/team/1610612742/roster'),
  ('DAL', 'Garrett Temple', 'Assistant Coach', 2, '2026-09-24', 'https://www.nba.com/team/1610612742/roster'),
  ('DAL', 'Joe Boylan', 'Assistant Coach', 3, '2026-09-24', 'https://www.nba.com/team/1610612742/roster'),
  ('DAL', 'Drew Williamson', 'Assistant Coach', 4, '2026-09-24', 'https://www.nba.com/team/1610612742/roster'),
  ('DAL', 'Mody Maor', 'Assistant Coach', 5, '2026-09-24', 'https://www.nba.com/team/1610612742/roster'),
  ('HOU', 'Ben Sullivan', 'Assistant Coach', 1, '2026-09-24', 'https://www.nba.com/team/1610612745/roster'),
  ('HOU', 'Royal Ivey', 'Assistant Coach', 2, '2026-09-24', 'https://www.nba.com/team/1610612745/roster'),
  ('HOU', 'Garrett Jackson', 'Assistant Coach', 3, '2026-09-24', 'https://www.nba.com/team/1610612745/roster'),
  ('HOU', 'Cam Hodges', 'Assistant Coach', 4, '2026-09-24', 'https://www.nba.com/team/1610612745/roster'),
  ('HOU', 'Mike Moser', 'Assistant Coach', 5, '2026-09-24', 'https://www.nba.com/team/1610612745/roster'),
  ('HOU', 'Robbie Lemons', 'Assistant Coach', 6, '2026-09-24', 'https://www.nba.com/team/1610612745/roster'),
  ('HOU', 'Josh Bostic', 'Assistant Coach', 7, '2026-09-24', 'https://www.nba.com/team/1610612745/roster'),
  ('MEM', 'Erik Schmidt', 'Assistant Coach', 1, '2026-09-24', 'https://www.nba.com/team/1610612763/roster'),
  ('MEM', 'Darnell Lazare', 'Assistant Coach', 2, '2026-09-24', 'https://www.nba.com/team/1610612763/roster'),
  ('MEM', 'Ryan Saunders', 'Assistant Coach', 3, '2026-09-24', 'https://www.nba.com/team/1610612763/roster'),
  ('MEM', 'Jason March', 'Assistant Coach', 4, '2026-09-24', 'https://www.nba.com/team/1610612763/roster'),
  ('NOP', 'Dale Osbourne', 'Assistant Coach', 1, '2026-09-24', 'https://www.nba.com/team/1610612740/roster'),
  ('NOP', 'Bret Brielmaier', 'Assistant Coach', 2, '2026-09-24', 'https://www.nba.com/team/1610612740/roster'),
  ('NOP', 'Mike Hopkins', 'Assistant Coach', 3, '2026-09-24', 'https://www.nba.com/team/1610612740/roster'),
  ('NOP', 'Randy Gregory', 'Assistant Coach', 4, '2026-09-24', 'https://www.nba.com/team/1610612740/roster'),
  ('NOP', 'God Shammgod', 'Assistant Coach', 5, '2026-09-24', 'https://www.nba.com/team/1610612740/roster'),
  ('NOP', 'Will Bynum', 'Assistant Coach', 6, '2026-09-24', 'https://www.nba.com/team/1610612740/roster'),
  ('NOP', 'Greg Monroe', 'Assistant Coach', 7, '2026-09-24', 'https://www.nba.com/team/1610612740/roster'),
  ('SAS', 'Billy Donovan', 'Lead Assistant Coach', 1, '2026-09-24', 'https://www.nba.com/team/1610612759/roster'),
  ('SAS', 'Corliss Williamson', 'Assistant Coach', 2, '2026-09-24', 'https://www.nba.com/team/1610612759/roster'),
  ('SAS', 'Matt Nielsen', 'Assistant Coach', 3, '2026-09-24', 'https://www.nba.com/team/1610612759/roster'),
  ('SAS', 'Scott King', 'Assistant Coach', 4, '2026-09-24', 'https://www.nba.com/team/1610612759/roster'),
  ('SAS', 'Mike Noyes', 'Assistant Coach', 5, '2026-09-24', 'https://www.nba.com/team/1610612759/roster');

-- 2) 照合・取り込み・検証
do $$
declare
  v_n bigint; v_ins_p bigint; v_ins_s bigint;
begin
  select count(*) into v_n from imp_profiles; if v_n <> 30 then raise exception '中止: Excelのチーム数が % 件です(想定30)', v_n; end if;
  select count(*) into v_n from imp_staff; if v_n <> 216 then raise exception '中止: Excelのコーチ数が % 名です(想定216)', v_n; end if;
  select count(distinct abbr) into v_n from imp_staff; if v_n <> 30 then raise exception '中止: コーチのいるチームが % チームです(想定30)', v_n; end if;

  -- Abbr と teams.abbreviation の照合(30件すべてが1対1で一致すること)
  select count(*) into v_n from imp_profiles i join teams t on t.abbreviation = i.abbr;
  if v_n <> 30 then raise exception '中止: 略称が既存teamsと一致するのは % チームです(想定30)', v_n; end if;
  select count(*) into v_n from (select abbreviation from teams group by abbreviation having count(*) > 1) d;
  if v_n <> 0 then raise exception '中止: teams.abbreviation に重複があります'; end if;
  select count(*) into v_n from imp_staff s where not exists (select 1 from imp_profiles i where i.abbr = s.abbr);
  if v_n <> 0 then raise exception '中止: チーム一覧にない略称のコーチが % 名います', v_n; end if;

  insert into team_profiles (team_id, arena_name_ja, arena_name_en, g_league_affiliate, owner_name, governor_name, team_president_name,
                             team_president_role, basketball_operations_name, basketball_operations_role, gm_name, head_coach_name,
                             last_verified, source_url)
  select t.id, i.arena_name_ja, i.arena_name_en, i.g_league_affiliate, i.owner_name, i.governor_name, i.team_president_name,
         null, i.basketball_operations_name, i.basketball_operations_role, i.gm_name, i.head_coach_name,
         i.last_verified, i.source_url
  from imp_profiles i join teams t on t.abbreviation = i.abbr;
  get diagnostics v_ins_p = row_count;

  insert into team_staff_members (team_id, name, role_title, display_order, last_verified, source_url)
  select t.id, s.name, s.role_title, s.display_order, s.last_verified, s.source_url
  from imp_staff s join teams t on t.abbreviation = s.abbr;
  get diagnostics v_ins_s = row_count;

  -- 事後検証
  if v_ins_p <> 30 then raise exception '中止: team_profiles に % 行入りました(想定30)', v_ins_p; end if;
  if v_ins_s <> 216 then raise exception '中止: team_staff_members に % 行入りました(想定216)', v_ins_s; end if;
  select count(*) into v_n from team_profiles; if v_n <> 30 then raise exception '中止: team_profiles が % 行です(想定30)', v_n; end if;
  select count(*) into v_n from team_staff_members; if v_n <> 216 then raise exception '中止: team_staff_members が % 行です(想定216)', v_n; end if;

  -- チームごとの人数
  select count(*) into v_n
  from (values ('BOS', 7), ('BKN', 9), ('NYK', 9), ('PHI', 6), ('TOR', 9), ('CHI', 7), ('CLE', 7), ('DET', 10), ('IND', 3), ('MIL', 10), ('ATL', 9), ('CHA', 9), ('MIA', 6), ('ORL', 12), ('WAS', 7), ('DEN', 5), ('MIN', 5), ('OKC', 7), ('POR', 4), ('UTA', 8), ('GSW', 9), ('LAC', 10), ('LAL', 7), ('PHX', 7), ('SAC', 6), ('DAL', 5), ('HOU', 7), ('MEM', 4), ('NOP', 7), ('SAS', 5)) as e(abbr, cnt)
  join teams t on t.abbreviation = e.abbr
  left join (select team_id, count(*) as c from team_staff_members group by team_id) m on m.team_id = t.id
  where coalesce(m.c, 0) <> e.cnt;
  if v_n <> 0 then raise exception '中止: コーチ人数がExcelと異なるチームが % あります', v_n; end if;

  -- 空欄(NULL)の数・役職別人数・Head Coachの扱い
  select count(*) into v_n from team_profiles where gm_name is null; if v_n <> 7 then raise exception '中止: GMがNULLのチームが % です(想定7)', v_n; end if;
  select count(*) into v_n from team_profiles where governor_name is null; if v_n <> 1 then raise exception '中止: GovernorがNULLのチームが % です(想定1)', v_n; end if;
  select count(*) into v_n from team_profiles where head_coach_name is null or owner_name is null or team_president_name is null or basketball_operations_name is null; if v_n <> 0 then raise exception '中止: 必須項目が空のチームが % あります', v_n; end if;
  select count(*) into v_n from team_profiles where source_url like E'%\n%'; if v_n <> 30 then raise exception '中止: 複数URL(改行)を保持できたチームが % です(想定30)', v_n; end if;
  select count(*) into v_n from team_staff_members where role_title = 'Assistant Coach'; if v_n <> 208 then raise exception '中止: Assistant Coachが % 名です(想定208)', v_n; end if;
  select count(*) into v_n from team_staff_members where role_title = 'Lead Assistant Coach'; if v_n <> 5 then raise exception '中止: Lead Assistant Coachが % 名です(想定5)', v_n; end if;
  select count(*) into v_n from team_staff_members where role_title = 'Associate Head Coach'; if v_n <> 3 then raise exception '中止: Associate Head Coachが % 名です(想定3)', v_n; end if;
  select count(*) into v_n from team_staff_members m join team_profiles p on p.team_id = m.team_id where lower(btrim(m.name)) = lower(btrim(p.head_coach_name));
  if v_n <> 0 then raise exception '中止: Head Coachと同名のスタッフが team_staff_members に % 名います', v_n; end if;

  raise notice '完了: team_profiles % 行 / team_staff_members % 行を取り込みました', v_ins_p, v_ins_s;
end $$;

COMMIT;
