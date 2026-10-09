-- 年度別アワード(/awards)のマスターデータ。管理画面から取り込む Excel「NBA_Awards_Master_…xlsx」の
-- Awards Data シートと All-Star シートを保存する。現役・引退を問わず、NBA全体の年度ごとの受賞者・選出者。
-- 選手プロフィール用の表彰履歴(player_award_records)や、使っていない season_player_awards とは別のテーブル。
--
-- ・nba_season_awards : 1行 = 年度 × 賞 × 区分(1st/2nd/3rd・East/West) × 選手
-- ・apply_nba_season_award_import() : 取り込み1回分(追加・更新する行と、削除する行)を1つの処理で反映する関数。
--                                      途中で失敗した場合は全体が取り消され、以前のデータが残る。
--
-- 既存テーブル・データへの変更はない。行の投入はこのファイルでは行わない。
-- 読み取りは anon / authenticated に公開(/awards で表示するため)。書き込みは service_role のみ。
--
-- ロールバック:
--   drop function if exists apply_nba_season_award_import(jsonb, uuid[]);
--   drop table if exists nba_season_awards;

BEGIN;

create table nba_season_awards (
  id uuid primary key default gen_random_uuid(),
  -- シーズン(開始年。例: 2023 = 2023-24)
  season smallint not null,
  award_key text not null,
  -- 区分: All-NBA などの '1st' / '2nd' / '3rd'、Conference Finals MVP の 'East' / 'West'。それ以外は ''(空文字)
  detail text not null default '',
  -- Excel の選手名(英語表記)。引退選手などサイトに未登録の選手もそのまま表示する
  player_name text not null,
  -- サイトの選手データと1人に照合できた場合だけ(プロフィールへのリンク用)。照合できない選手は NULL
  player_id uuid references players (id) on delete set null,
  -- 受賞時の所属チームの略称(Excel の Team。空欄は NULL)
  team text,
  source text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint nba_season_awards_award_key_check check (
    award_key in (
      'mvp', 'rookie_of_the_year', 'defensive_player_of_the_year', 'most_improved_player', 'sixth_man_of_the_year',
      'finals_mvp', 'conference_finals_mvp', 'clutch_player_of_the_year', 'all_star_mvp',
      'all_nba', 'all_defensive', 'all_rookie', 'all_star'
    )
  ),
  constraint nba_season_awards_detail_check check (detail in ('', '1st', '2nd', '3rd', 'East', 'West')),
  constraint nba_season_awards_season_range check (season between 1946 and 2100),
  constraint nba_season_awards_name_not_blank check (btrim(player_name) <> ''),
  -- 同じ年度・賞・区分に同じ選手は1行だけ
  constraint nba_season_awards_key unique (season, award_key, detail, player_name)
);

create index nba_season_awards_season_idx on nba_season_awards (season);
create index nba_season_awards_player_idx on nba_season_awards (player_id);

create trigger set_updated_at
  before update on nba_season_awards
  for each row execute function set_updated_at();

alter table nba_season_awards enable row level security;

create policy "nba_season_awards_public_read" on nba_season_awards
  for select to anon, authenticated using (true);

revoke all on table nba_season_awards from anon, authenticated;
grant select on table nba_season_awards to anon, authenticated;

comment on table nba_season_awards is
  '年度別アワード(/awards)のマスターデータ(管理画面のExcelから取り込み)。NBA全体の受賞者・選出者で、引退選手も含む。';

-- ==========================================================================
-- apply_nba_season_award_import: 取り込み1回分を1つの処理で反映する
-- ==========================================================================
-- p_rows       : [{season, award_key, detail, player_name, player_id, team, source}]
--                同じ年度・賞・区分・選手名の行があれば更新、なければ追加する
-- p_delete_ids : 削除する既存の行の id(今回のExcelに含まれない記録)
-- 戻り値は {"inserted": 追加数, "updated": 更新数, "deleted": 削除数}

create function apply_nba_season_award_import(p_rows jsonb, p_delete_ids uuid[])
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  r record;
  was_inserted boolean;
  inserted_count integer := 0;
  updated_count integer := 0;
  deleted_count integer := 0;
begin
  delete from nba_season_awards where id = any (coalesce(p_delete_ids, '{}'::uuid[]));
  get diagnostics deleted_count = row_count;

  for r in
    select * from jsonb_to_recordset(p_rows) as x(
      season smallint, award_key text, detail text, player_name text, player_id uuid, team text, source text
    )
  loop
    insert into nba_season_awards (season, award_key, detail, player_name, player_id, team, source)
    values (r.season, r.award_key, coalesce(r.detail, ''), r.player_name, r.player_id, r.team, r.source)
    on conflict (season, award_key, detail, player_name) do update set
      player_id = excluded.player_id,
      team = excluded.team,
      source = excluded.source
    returning (xmax = 0) into was_inserted;

    if was_inserted then
      inserted_count := inserted_count + 1;
    else
      updated_count := updated_count + 1;
    end if;
  end loop;

  return jsonb_build_object('inserted', inserted_count, 'updated', updated_count, 'deleted', deleted_count);
end;
$$;

revoke all on function apply_nba_season_award_import(jsonb, uuid[]) from public, anon, authenticated;
grant execute on function apply_nba_season_award_import(jsonb, uuid[]) to service_role;

comment on function apply_nba_season_award_import(jsonb, uuid[]) is
  '年度別アワードのマスターデータの取り込み1回分(追加・更新・削除)を1つのトランザクションで反映する。service_roleのみ実行可。';

COMMIT;
