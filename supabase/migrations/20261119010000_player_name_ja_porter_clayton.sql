-- 日本語名の表記崩れを直す(サイト内の「〇〇Jr.」の多い書き方にそろえる。例: マイケル・ポーターJr.)
-- いまの値と一致するときだけ更新する(二重実行しても変わらない)
begin;

update players
set full_name_ja = 'クレイグ・ポーターJr.'
where id = 'fd1573b2-b739-4a6f-9fee-0003711a9ca7'
  and full_name_ja = 'クレイグ・ポーター・ Jr.';

update players
set full_name_ja = 'ウォルター・クレイトンJr.'
where id = 'd4b9bc16-c76a-4b7f-8096-94e9c12e5a11'
  and full_name_ja = 'ウォルター・クレイトン.jr';

commit;
