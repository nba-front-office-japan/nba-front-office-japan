@AGENTS.md

# NBA Front Office Japan — 開発ルール

## 基本方針
- 既存CRM（Vifleur等）とは完全に別プロジェクト
- 一度に大規模実装しない。Phaseごとに確認を取りながら進める
- SQLはMigration実行前に必ず内容を提示して確認を取る
- AI記事は自動公開しない。人間が最終確認する

## 技術スタック
- Next.js 16 / App Router / TypeScript / Tailwind CSS
- Supabase（PostgreSQL / Auth / Storage / RLS）
- GitHub / Vercel

## DB設計ルール
- PK：UUID（gen_random_uuid()）
- season：smallint（開始年。例：2023 = 2023-24シーズン）
- スタッツは合計値で保持。平均はクエリ時計算
- 移籍対応：player_statsはチーム別行＋TOT行（team_id=NULL）方式
- RLS：全テーブルで有効。SELECT は公開、書き込みはservice_roleのみ

## 進行ルール
- Phase 1完了後にPhase 2へ進む
- 各Phase完了時にGitHubへcommit・push
- 不明点は実装前に質問する
