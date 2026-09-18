-- 2026-27ロスター(NBA_2026_2027ロスター.xlsx)のPosを、選手ポジションの唯一の基準として
-- 取り込むための土台。player_season_rostersにシーズン単位のposition列を追加する
-- （既存のplayers.positionは旧分類(G/F/C/G-F/F-C等)のまま残し、表示・絞り込みには
-- 使わない方針。将来的な非推奨化は別途検討）。
--
-- あわせて、選手名の表記統一（愛称→現行ロスター表記への変更等）を行った際に、
-- 旧表記を内部の照合用エイリアスとして保持するテーブルを追加する。

BEGIN;

alter table player_season_rosters add column position text check (
  position is null or position in ('PG', 'SG', 'SF', 'PF', 'C', 'G', 'F', 'GF', 'FC')
);

create table player_name_aliases (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players (id) on delete cascade,
  alias_full_name text not null,
  created_at timestamptz not null default now(),
  constraint player_name_aliases_unique unique (player_id, alias_full_name)
);

create index player_name_aliases_player_idx on player_name_aliases (player_id);

alter table player_name_aliases enable row level security;

COMMIT;
