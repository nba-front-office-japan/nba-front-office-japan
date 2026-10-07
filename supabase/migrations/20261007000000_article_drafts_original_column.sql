-- 独自コラム(取得ニュース・イベントを使わずに、管理画面から直接作る記事下書き)に対応する。
--
-- 1) article_drafts.event_id を任意(NULL可)にする
--    ・既存の行はすべてイベントありのまま変わらない
--    ・event_id の unique 制約は NULL を重複扱いしないため、独自コラムは何本でも作れる
--    ・外部キー(news_events への参照、イベント削除時に下書きも削除)はそのまま
-- 2) 独自コラム用のカテゴリ列 category を追加する
--    ・値の種類は news_events.category と同じ
--    ・イベントありの記事は従来どおりイベントのカテゴリを使い、この列は NULL のまま(既存の行は変更しない)
-- 3) イベントもカテゴリもない下書きを作れないようにする(どちらか一方は必ずある)
--
-- 既存の行の変更・削除はしない。読み取り・書き込みの権限(RLS)も変更しない。
--
-- ロールバック(独自コラムを1本も作っていない場合のみ。作成済みなら先にその行の扱いを決めること):
--   alter table article_drafts drop constraint if exists article_drafts_event_or_category;
--   alter table article_drafts drop column if exists category;
--   alter table article_drafts alter column event_id set not null;

begin;

alter table article_drafts
  alter column event_id drop not null;

alter table article_drafts
  add column if not exists category text
  check (
    category in (
      'breaking', 'trade', 'free_agency', 'contract', 'injury',
      'rumor', 'interview', 'transaction', 'analysis', 'other'
    )
  );

alter table article_drafts
  add constraint article_drafts_event_or_category
  check (event_id is not null or category is not null);

comment on column article_drafts.category is
  '独自コラム(event_id が NULL)のカテゴリ。イベントありの記事はイベントのカテゴリを使うため NULL。';

commit;
