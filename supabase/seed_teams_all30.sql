-- NBA全30チーム Seedデータ（Warriors以外の29チーム）
--
-- Golden State Warriors（id: 11111111-1111-1111-1111-111111111111, abbreviation: GSW）は
-- supabase/seed.sql で投入済みのため、このファイルには含めていません。
-- このファイル実行後、teamsテーブルの合計行数は30件になります。
--
-- id は他テーブルからの参照時に使いやすいよう固定値（00000000-0000-4000-8000-000000000002 〜 030）を採番。
-- conference / division は現行のNBA編成（2004-05シーズン以降、Eastern: Atlantic/Central/Southeast、
-- Western: Northwest/Pacific/Southwest）に基づく。
--
-- 注意（founded_yearについて）: franchiseの「創設年」はNBA公式でも歴史的経緯が複雑な球団があります。
-- 特に以下は移転・改称・記録継承の扱いに議論があるため、正式なデータ運用前にNBA.com公式球団ページでの
-- 再確認を推奨します。
--   - Charlotte Hornets: 1988年創設の初代Hornets（2002年New Orleansへ移転）の歴史を、
--     2004年設立のCharlotte Bobcatsが2014年に継承・改称する形で現球団に付与されている
--   - New Orleans Pelicans: 2002年に初代Charlotte Hornetsが移転し発足（2013年Pelicansに改称）
--   - Oklahoma City Thunder: 1967年創設のSeattle SuperSonicsが2008年に移転
--   - Detroit Pistons / Sacramento Kings: NBL時代までさかのぼる古参球団で創設年の資料により差がある

-- ==========================================================================
-- Eastern Conference（15チーム）
-- ==========================================================================

-- Atlantic Division
insert into teams (id, name, abbreviation, city, conference, division, founded_year, is_active) values
  ('00000000-0000-4000-8000-000000000002', 'Boston Celtics',        'BOS', 'Boston',       'East', 'Atlantic', 1946, true),
  ('00000000-0000-4000-8000-000000000003', 'Brooklyn Nets',         'BKN', 'Brooklyn',     'East', 'Atlantic', 1967, true),
  ('00000000-0000-4000-8000-000000000004', 'New York Knicks',       'NYK', 'New York',     'East', 'Atlantic', 1946, true),
  ('00000000-0000-4000-8000-000000000005', 'Philadelphia 76ers',    'PHI', 'Philadelphia', 'East', 'Atlantic', 1946, true),
  ('00000000-0000-4000-8000-000000000006', 'Toronto Raptors',       'TOR', 'Toronto',      'East', 'Atlantic', 1995, true);

-- Central Division
insert into teams (id, name, abbreviation, city, conference, division, founded_year, is_active) values
  ('00000000-0000-4000-8000-000000000007', 'Chicago Bulls',         'CHI', 'Chicago',      'East', 'Central', 1966, true),
  ('00000000-0000-4000-8000-000000000008', 'Cleveland Cavaliers',   'CLE', 'Cleveland',    'East', 'Central', 1970, true),
  ('00000000-0000-4000-8000-000000000009', 'Detroit Pistons',       'DET', 'Detroit',      'East', 'Central', 1941, true),
  ('00000000-0000-4000-8000-000000000010', 'Indiana Pacers',        'IND', 'Indianapolis', 'East', 'Central', 1967, true),
  ('00000000-0000-4000-8000-000000000011', 'Milwaukee Bucks',       'MIL', 'Milwaukee',    'East', 'Central', 1968, true);

-- Southeast Division
insert into teams (id, name, abbreviation, city, conference, division, founded_year, is_active) values
  ('00000000-0000-4000-8000-000000000012', 'Atlanta Hawks',         'ATL', 'Atlanta',      'East', 'Southeast', 1946, true),
  ('00000000-0000-4000-8000-000000000013', 'Charlotte Hornets',     'CHA', 'Charlotte',    'East', 'Southeast', 1988, true),
  ('00000000-0000-4000-8000-000000000014', 'Miami Heat',            'MIA', 'Miami',        'East', 'Southeast', 1988, true),
  ('00000000-0000-4000-8000-000000000015', 'Orlando Magic',         'ORL', 'Orlando',      'East', 'Southeast', 1989, true),
  ('00000000-0000-4000-8000-000000000016', 'Washington Wizards',    'WAS', 'Washington',   'East', 'Southeast', 1961, true);

-- ==========================================================================
-- Western Conference（15チーム。Golden State Warriorsは投入済みのため除く）
-- ==========================================================================

-- Northwest Division
insert into teams (id, name, abbreviation, city, conference, division, founded_year, is_active) values
  ('00000000-0000-4000-8000-000000000017', 'Denver Nuggets',            'DEN', 'Denver',          'West', 'Northwest', 1967, true),
  ('00000000-0000-4000-8000-000000000018', 'Minnesota Timberwolves',    'MIN', 'Minneapolis',     'West', 'Northwest', 1989, true),
  ('00000000-0000-4000-8000-000000000019', 'Oklahoma City Thunder',     'OKC', 'Oklahoma City',   'West', 'Northwest', 1967, true),
  ('00000000-0000-4000-8000-000000000020', 'Portland Trail Blazers',    'POR', 'Portland',        'West', 'Northwest', 1970, true),
  ('00000000-0000-4000-8000-000000000021', 'Utah Jazz',                 'UTA', 'Salt Lake City',  'West', 'Northwest', 1974, true);

-- Pacific Division（Golden State Warriorsを除く4チーム）
insert into teams (id, name, abbreviation, city, conference, division, founded_year, is_active) values
  ('00000000-0000-4000-8000-000000000022', 'LA Clippers',           'LAC', 'Los Angeles', 'West', 'Pacific', 1970, true),
  ('00000000-0000-4000-8000-000000000023', 'Los Angeles Lakers',    'LAL', 'Los Angeles', 'West', 'Pacific', 1947, true),
  ('00000000-0000-4000-8000-000000000024', 'Phoenix Suns',          'PHX', 'Phoenix',     'West', 'Pacific', 1968, true),
  ('00000000-0000-4000-8000-000000000025', 'Sacramento Kings',      'SAC', 'Sacramento',  'West', 'Pacific', 1945, true);

-- Southwest Division
insert into teams (id, name, abbreviation, city, conference, division, founded_year, is_active) values
  ('00000000-0000-4000-8000-000000000026', 'Dallas Mavericks',      'DAL', 'Dallas',        'West', 'Southwest', 1980, true),
  ('00000000-0000-4000-8000-000000000027', 'Houston Rockets',       'HOU', 'Houston',       'West', 'Southwest', 1967, true),
  ('00000000-0000-4000-8000-000000000028', 'Memphis Grizzlies',     'MEM', 'Memphis',       'West', 'Southwest', 1995, true),
  ('00000000-0000-4000-8000-000000000029', 'New Orleans Pelicans',  'NOP', 'New Orleans',   'West', 'Southwest', 2002, true),
  ('00000000-0000-4000-8000-000000000030', 'San Antonio Spurs',     'SAS', 'San Antonio',   'West', 'Southwest', 1967, true);
