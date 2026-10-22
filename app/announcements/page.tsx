import type { Metadata } from "next";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/page-shell";
import { announcementExcerpt, fetchPublishedAnnouncements, formatAnnouncementDate } from "@/lib/announcements";

export const metadata: Metadata = {
  title: "お知らせ | NBA Front Office Japan",
  description: "NBA Front Office Japan からのお知らせ。",
};

// 公開中のお知らせの一覧(新しい順)。管理画面で公開/非公開を切り替えたら、すぐ反映する
export const dynamic = "force-dynamic";

export default async function AnnouncementsPage() {
  const announcements = await fetchPublishedAnnouncements(createServerSupabaseClient());

  return (
    <PageShell>
      <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">Notice</p>
      <h1 className="mb-6 text-[32px] font-semibold tracking-tight sm:text-[36px]">お知らせ</h1>
      {announcements.length === 0 ? (
        <p className="border border-line bg-surface p-6 text-sm text-muted">現在、お知らせはありません。</p>
      ) : (
        <ul className="space-y-3">
          {announcements.map((a) => (
            <li key={a.id} className="border border-line bg-surface p-5 sm:p-6">
              <p className="mb-1 text-xs tabular-nums text-muted">{formatAnnouncementDate(a.posted_on)}</p>
              <h2 className="mb-2 break-words text-lg font-semibold">
                <Link href={`/announcements/${a.id}`} className="hover:underline">
                  {a.title}
                </Link>
              </h2>
              <p className="break-words text-sm leading-7 text-muted">{announcementExcerpt(a.body, 140)}</p>
              <Link href={`/announcements/${a.id}`} className="mt-2 inline-block text-sm font-extrabold text-blue">
                続きを読む →
              </Link>
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}
