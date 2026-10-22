-- サイトのお知らせ(トップページの「お知らせ」・/announcements)。管理画面(/admin/announcements)から作成・編集・公開/非公開・削除する。
-- ・公開中(is_published = true)のお知らせだけを、誰でも読める(RLS)。非公開のお知らせは公開サイトから読めない
-- ・書き込みは service_role のみ(管理画面のサーバー処理から行う)
-- 既存のテーブル(NEWS 記事の article_drafts など)の構造・行は変更しない。新しいテーブルの作成だけ。

begin;

create table announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  -- 投稿日(管理画面で入力する日付。日本時間の日付として表示する)
  posted_on date not null,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint announcements_title_length check (char_length(btrim(title)) between 1 and 200),
  constraint announcements_body_length check (char_length(btrim(body)) between 1 and 20000)
);

create index announcements_published_idx on announcements (is_published, posted_on desc, created_at desc);

create trigger set_updated_at
  before update on announcements
  for each row execute function set_updated_at();

alter table announcements enable row level security;

create policy "announcements_public_read_published" on announcements
  for select
  to anon, authenticated
  using (is_published);

revoke all on table announcements from anon, authenticated;
grant select on table announcements to anon, authenticated;

comment on table announcements is 'サイトのお知らせ。公開中(is_published)のものだけをトップページ・/announcements に表示する。書き込みは管理画面(service_role)のみ。';
comment on column announcements.posted_on is '投稿日(管理画面で入力。日本時間の日付として表示)。';

commit;
