import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/page-shell";
import { fetchPublishedAnnouncement, formatAnnouncementDate } from "@/lib/announcements";

// お知らせの詳細。公開中のものだけ表示し、非公開・削除済みは 404。本文は入力したとおり(改行を含めて)表示する
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/announcements/[id]">): Promise<Metadata> {
  const { id } = await params;
  const a = await fetchPublishedAnnouncement(createServerSupabaseClient(), id);
  return { title: a ? `${a.title} | お知らせ | NBA Front Office Japan` : "お知らせ | NBA Front Office Japan" };
}

export default async function AnnouncementDetailPage({ params }: PageProps<"/announcements/[id]">) {
  const { id } = await params;
  const announcement = await fetchPublishedAnnouncement(createServerSupabaseClient(), id);
  if (!announcement) notFound();

  return (
    <PageShell>
      <nav aria-label="パンくずリスト" className="mb-4 text-xs text-muted">
        <Link href="/announcements" className="font-semibold text-blue hover:underline">
          お知らせ
        </Link>
        <span aria-hidden className="mx-1.5">›</span>
        <span aria-current="page">詳細</span>
      </nav>
      <article className="border border-line bg-surface p-5 sm:p-8">
        <p className="mb-2 text-xs tabular-nums text-muted">{formatAnnouncementDate(announcement.posted_on)}</p>
        <h1 className="mb-5 break-words text-[24px] font-semibold leading-snug tracking-tight sm:text-[28px]">{announcement.title}</h1>
        <div className="whitespace-pre-wrap break-words text-[15px] leading-8">{announcement.body}</div>
      </article>
      <Link href="/announcements" className="mt-6 inline-block text-sm font-extrabold text-blue">
        ← お知らせ一覧
      </Link>
    </PageShell>
  );
}
