-- ==========================================================================
-- 記事に任意項目「試合区分」(game_kind)を追加する(NEWS 一覧の「試合結果」「プレビュー」タブの振り分けに使う)
--
--   game_kind : 'result'  = 試合結果(その試合の結果・活躍を伝える記事。「○○が43得点」なども含む)
--               'preview' = プレビュー
--               NULL      = 指定なし(既存の記事はすべて NULL のまま。データの書き換えはしない)
--   ※ プレビューの判定は、game_kind = 'preview' のほか、対象試合(target_game_date など)が設定された記事も含む
--     (アプリ側で判定する。既存の公開済みプレビューはこの列を触らなくてもプレビュータブに出る)
--   ※ game_kind = 'result' が指定された記事は、対象試合があっても「試合結果」として扱う
--
-- 元に戻す場合:
--   alter table article_drafts drop column if exists game_kind;
-- ==========================================================================

begin;

alter table article_drafts
  add column if not exists game_kind text
  check (game_kind in ('result', 'preview'));

comment on column article_drafts.game_kind is
  '試合区分: result=試合結果 / preview=プレビュー / NULL=指定なし。NEWS 一覧の「試合結果」「プレビュー」タブに使う(対象試合ありの記事もプレビュー扱い)';

commit;

-- 実行後の確認用: 列が追加され、既存の記事はすべて未設定(0件)になっていること
-- select column_name, data_type from information_schema.columns
--   where table_name = 'article_drafts' and column_name = 'game_kind';
-- select count(*) from article_drafts where game_kind is not null;
