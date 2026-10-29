import type { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { fetchPublishedArticles } from "@/lib/news/public-articles";
import { PageShell } from "@/components/page-shell";
import { fetchPublishedAnnouncements, formatAnnouncementDate } from "@/lib/announcements";
import { HomeArena } from "@/components/home-arena";

export const metadata: Metadata = {
  title: "NBA Front Office Japan｜NBAの試合結果・スタッツ・年俸・移籍ニュース",
  description:
    "NBAの試合結果・ボックススコア、選手スタッツ、年俸、トレード・移籍ニュースを日本語で。勝敗の裏側にあるフロントオフィスの意思決定を読むNBAファンサイトです。",
  alternates: { canonical: "/" },
};

export default async function Home() {
  const supabase = createServerSupabaseClient();

  const [articles, announcements] = await Promise.all([
    fetchPublishedArticles(createAdminSupabaseClient()),
    fetchPublishedAnnouncements(supabase, 1),
  ]);

  const article = articles[0] ?? null;
  const announcement = announcements[0] ?? null;

  return (
    <PageShell>
      <HomeArena
        featured={article ? { href: `/news/${article.id}`, headline: article.headlineJa, summary: article.dekJa } : null}
        announcement={announcement ? { href: `/announcements/${announcement.id}`, title: announcement.title, date: formatAnnouncementDate(announcement.posted_on) } : null}
      />
    </PageShell>
  );
}
