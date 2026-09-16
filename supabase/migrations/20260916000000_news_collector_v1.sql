-- News Collector v1: 収集ソース・取得物・事象・記事ドラフトのスキーマ。
-- Stats Collector（teams/players/player_stats等）とは完全に独立したテーブル群。
--
-- RLS方針はPhase1の「SELECT公開」方針とは意図的に異なる：
--   news_* / article_drafts はいずれもRLSを有効化するが、anon/authenticatedへの
--   SELECTポリシーは一切作らない（=デフォルト拒否）。service_roleはBYPASSRLSで
--   常にアクセスできるため、
--     - 管理画面(/admin/news)はSupabase Auth+ADMIN_EMAIL_ALLOWLISTで保護した上で
--       service_roleクライアントから読み書きする
--     - 公開ページ(/news, /news/[slug])もService Componentからservice_role
--       クライアントで読み、アプリケーション側で status = 'published' 等を
--       明示的に絞り込む
--   という一本の信頼境界に統一する。rumor/pending_reviewの行がanonキー経由で
--   直接読めてしまう複雑なRLSポリシーを書くより安全でシンプルなため。

create table news_sources (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  kind text not null check (kind in ('rss', 'x', 'manual_official')),
  feed_url text,
  x_username text,
  reliability_level smallint not null check (reliability_level between 1 and 100),
  is_active boolean not null default true,
  poll_interval_minutes integer,
  last_polled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index news_sources_kind_idx on news_sources (kind);
create index news_sources_is_active_idx on news_sources (is_active);

create trigger set_updated_at
  before update on news_sources
  for each row execute function set_updated_at();

alter table news_sources enable row level security;

-- ==========================================================================
-- reporters
-- ==========================================================================

create table reporters (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  outlet text,
  x_username text unique,
  covered_team_codes text[] not null default '{}',
  specialties text[] not null default '{}',
  reliability_level smallint not null check (reliability_level between 1 and 100),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index reporters_is_active_idx on reporters (is_active);

create trigger set_updated_at
  before update on reporters
  for each row execute function set_updated_at();

alter table reporters enable row level security;

-- ==========================================================================
-- news_items（1つの取得物。URL単位で一意）
-- ==========================================================================

create table news_items (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references news_sources (id) on delete restrict,
  external_id text,
  canonical_url text not null unique,
  title text not null,
  summary text,
  author_name text,
  published_at timestamptz,
  raw_published_at text,
  content_type text not null check (content_type in ('article', 'x_post', 'official_statement')),
  status text not null default 'new' check (status in ('new', 'processed', 'ignored', 'error')),
  metadata jsonb not null default '{}'::jsonb,
  content_hash text not null,
  fetched_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index news_items_source_id_idx on news_items (source_id);
create index news_items_status_idx on news_items (status);
create index news_items_published_at_idx on news_items (published_at);
create index news_items_content_hash_idx on news_items (content_hash);

alter table news_items enable row level security;

-- ==========================================================================
-- news_events（同一事象の親レコード）
-- ==========================================================================

create table news_events (
  id uuid primary key default gen_random_uuid(),
  event_key text unique not null,
  headline_en text not null,
  category text not null check (
    category in (
      'breaking', 'trade', 'free_agency', 'contract', 'injury',
      'rumor', 'interview', 'transaction', 'analysis', 'other'
    )
  ),
  verification_status text not null check (
    verification_status in (
      'official', 'confirmed_by_multiple_sources', 'single_source', 'rumor', 'unverified'
    )
  ),
  reliability_score smallint not null check (reliability_score between 0 and 100),
  importance_score smallint not null check (importance_score between 0 and 100),
  entity_tags jsonb not null default '{"players": [], "teams": []}'::jsonb,
  editorial_status text not null default 'review_needed' check (
    editorial_status in (
      'review_needed', 'approved_for_draft', 'drafted', 'published', 'rejected'
    )
  ),
  ai_rationale jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index news_events_category_idx on news_events (category);
create index news_events_verification_status_idx on news_events (verification_status);
create index news_events_editorial_status_idx on news_events (editorial_status);
create index news_events_importance_score_idx on news_events (importance_score);

create trigger set_updated_at
  before update on news_events
  for each row execute function set_updated_at();

alter table news_events enable row level security;

-- ==========================================================================
-- news_event_sources
-- ==========================================================================

create table news_event_sources (
  event_id uuid not null references news_events (id) on delete cascade,
  news_item_id uuid not null references news_items (id) on delete cascade,
  relation text not null check (relation in ('primary', 'confirmation', 'context', 'conflict')),
  created_at timestamptz not null default now(),
  primary key (event_id, news_item_id)
);

create index news_event_sources_news_item_id_idx on news_event_sources (news_item_id);

alter table news_event_sources enable row level security;

-- ==========================================================================
-- article_drafts
-- ==========================================================================

create table article_drafts (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null unique references news_events (id) on delete cascade,
  article_type text not null check (article_type in ('breaking', 'standard', 'deep_dive')),
  headline_ja text not null,
  dek_ja text,
  body_markdown text not null,
  source_attribution_markdown text not null,
  fact_check_json jsonb not null default '[]'::jsonb,
  editor_notes text,
  status text not null default 'pending_review' check (
    status in ('pending_review', 'approved', 'published', 'rejected')
  ),
  published_at timestamptz,
  reviewed_by uuid references auth.users (id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index article_drafts_status_idx on article_drafts (status);

create trigger set_updated_at
  before update on article_drafts
  for each row execute function set_updated_at();

alter table article_drafts enable row level security;
