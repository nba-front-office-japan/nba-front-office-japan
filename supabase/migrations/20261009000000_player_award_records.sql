-- 選手プロフィールの「個人賞・表彰」(管理画面から取り込む Excel「NBA_Awards_…xlsx」の Awards シート)。
-- 既存の season_player_awards(/awards ページ用)とは別のテーブルにし、既存のページ・データには触れない。
--
-- ・player_award_records : 1行 = 選手 × 賞 × シーズン。All-NBA などの 1st / 2nd / 3rd は selection_team で区別する
-- ・apply_player_award_import() : 取り込み1回分(追加・更新する行と、削除する行)を1つの処理で反映する関数。
--                                  途中で失敗した場合は全体が取り消され、以前のデータが残る。
--
-- 既存テーブル・データへの変更はない。行の投入はこのファイルでは行わない。
-- 読み取りは anon / authenticated に公開(選手プロフィールで表示するため)。書き込みは service_role のみ。
--
-- ロールバック:
--   drop function if exists apply_player_award_import(jsonb, uuid[]);
--   drop table if exists player_award_records;

BEGIN;

create table player_award_records (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players (id) on delete cascade,
  -- シーズン(開始年。例: 2023 = 2023-24)
  season smallint not null,
  award_key text not null,
  -- All-NBA / All-Defensive / All-Rookie の 1st=1, 2nd=2, 3rd=3。それ以外の賞は NULL
  selection_team smallint,
  -- Excel の Award Team(受賞当時の所属)・Source。プロフィールには表示しない(管理・確認用)
  award_team text,
  source text,
  -- Excel の Player の表記(照合の確認用)
  source_player_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint player_award_records_award_key_check check (
    award_key in (
      'mvp', 'finals_mvp', 'defensive_player_of_the_year', 'rookie_of_the_year', 'most_improved_player',
      'sixth_man_of_the_year', 'all_star_mvp', 'all_star', 'all_nba', 'all_defensive', 'all_rookie'
    )
  ),
  constraint player_award_records_selection_team_check check (
    (award_key = 'all_nba' and selection_team in (1, 2, 3))
    or (award_key in ('all_defensive', 'all_rookie') and selection_team in (1, 2))
    or (award_key not in ('all_nba', 'all_defensive', 'all_rookie') and selection_team is null)
  ),
  constraint player_award_records_season_range check (season between 1946 and 2100),
  -- 同じ選手・賞・シーズンは1行だけ(同じシーズンに 1st と 2nd の両方に入ることはない)
  constraint player_award_records_key unique (player_id, award_key, season)
);

create index player_award_records_player_idx on player_award_records (player_id);

create trigger set_updated_at
  before update on player_award_records
  for each row execute function set_updated_at();

alter table player_award_records enable row level security;

create policy "player_award_records_public_read" on player_award_records
  for select to anon, authenticated using (true);

revoke all on table player_award_records from anon, authenticated;
grant select on table player_award_records to anon, authenticated;

comment on table player_award_records is
  '選手プロフィールの個人賞・表彰(管理画面のExcelから取り込み)。/awards ページ用の season_player_awards とは別。';

-- ==========================================================================
-- apply_player_award_import: 取り込み1回分を1つの処理で反映する
-- ==========================================================================
-- p_rows       : [{player_id, season, award_key, selection_team, award_team, source, source_player_name}]
--                同じ選手・賞・シーズンの行があれば更新、なければ追加する
-- p_delete_ids : 削除する既存の行の id(今回のExcelに含まれない記録)
-- 戻り値は {"inserted": 追加数, "updated": 更新数, "deleted": 削除数}

create function apply_player_award_import(p_rows jsonb, p_delete_ids uuid[])
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
  delete from player_award_records where id = any (coalesce(p_delete_ids, '{}'::uuid[]));
  get diagnostics deleted_count = row_count;

  for r in
    select * from jsonb_to_recordset(p_rows) as x(
      player_id uuid, season smallint, award_key text, selection_team smallint,
      award_team text, source text, source_player_name text
    )
  loop
    insert into player_award_records (player_id, season, award_key, selection_team, award_team, source, source_player_name)
    values (r.player_id, r.season, r.award_key, r.selection_team, r.award_team, r.source, r.source_player_name)
    on conflict (player_id, award_key, season) do update set
      selection_team = excluded.selection_team,
      award_team = excluded.award_team,
      source = excluded.source,
      source_player_name = excluded.source_player_name
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

revoke all on function apply_player_award_import(jsonb, uuid[]) from public, anon, authenticated;
grant execute on function apply_player_award_import(jsonb, uuid[]) to service_role;

comment on function apply_player_award_import(jsonb, uuid[]) is
  '選手の表彰データの取り込み1回分(追加・更新・削除)を1つのトランザクションで反映する。service_roleのみ実行可。';

COMMIT;
