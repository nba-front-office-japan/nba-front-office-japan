-- ドラフト外(undrafted)を「情報不足」ではなく正式なプロフィール情報として保持するための列。
-- 既存の draft_year / draft_round / draft_pick は変更しない(通常の指名情報はそのまま)。
--   draft_status = 'undrafted' : ドラフト外(年度が分かる場合は draft_year にドラフト年を入れる)
--   draft_status = 'drafted'   : 通常の指名(将来用。現時点では null のままでも従来どおり表示される)
--   draft_status is null       : 未設定(従来どおり draft_year 等から表示)

alter table players add column if not exists draft_status text;

alter table players drop constraint if exists players_draft_status_check;
alter table players add constraint players_draft_status_check
  check (draft_status is null or draft_status in ('drafted', 'undrafted'));

comment on column players.draft_status is
  'ドラフト区分。undrafted=ドラフト外(draft_yearにドラフト年)。null=未設定。通常の指名は draft_year/round/pick で保持する。';
