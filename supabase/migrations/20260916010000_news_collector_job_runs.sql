-- News Collector v1 Phase B: 収集ジョブの実行ログ。
-- ソースごとに「いつ・成功したか・何件取得/登録したか・失敗理由」を1行ずつ記録する。
-- 直近3件が連続失敗の場合、管理画面でそのソースを「degraded」として表示する
-- （degradedは列として保持せず、この履歴から都度判定する）。
--
-- news_collector_job_runsもnews_*と同じ信頼境界（RLS有効・anonへのSELECTポリシー
-- なし・service_roleのみ読み書き）に揃える。

create table news_collector_job_runs (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references news_sources (id) on delete cascade,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  http_status integer,
  items_found integer,
  items_inserted integer,
  is_success boolean not null,
  error_message text,
  created_at timestamptz not null default now()
);

create index news_collector_job_runs_source_id_idx on news_collector_job_runs (source_id);
create index news_collector_job_runs_started_at_idx on news_collector_job_runs (started_at);

alter table news_collector_job_runs enable row level security;
