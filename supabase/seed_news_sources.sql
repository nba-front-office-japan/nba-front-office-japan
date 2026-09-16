-- News Collector v1: 初期ソース登録（ESPN RSS / RealGM RSS / 手動公式URL登録の受け皿）。

insert into news_sources (slug, name, kind, feed_url, reliability_level, is_active, poll_interval_minutes)
values
  ('espn_nba_rss', 'ESPN NBA', 'rss', 'https://www.espn.com/espn/rss/nba/news', 85, true, 30),
  ('realgm_basketball_rss', 'RealGM Basketball', 'rss', 'https://basketball.realgm.com/rss/wiretap/0/0.xml', 75, true, 30),
  ('official_manual', 'NBA公式・チーム公式（手動登録）', 'manual_official', null, 100, true, null);
