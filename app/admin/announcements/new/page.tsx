import Link from "next/link";
import { todayJst } from "@/lib/games/date";
import { AnnouncementForm } from "../announcement-form";
import { createAnnouncementAction } from "../actions";

export const dynamic = "force-dynamic";

// 管理画面「お知らせ」の新規作成。投稿日の初期値は今日(日本時間)
export default function NewAnnouncementPage() {
  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8 sm:px-8">
      <p className="text-xs">
        <Link href="/admin/announcements" className="font-bold text-blue underline underline-offset-2">
          ← お知らせ一覧
        </Link>
      </p>
      <h1 className="text-2xl font-bold">新しいお知らせ</h1>
      <section className="border border-line bg-surface p-5 sm:p-6">
        <AnnouncementForm action={createAnnouncementAction} defaultPostedOn={todayJst()} submitLabel="作成する" />
      </section>
    </main>
  );
}
