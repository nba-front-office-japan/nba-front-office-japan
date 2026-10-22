import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { todayJst } from "@/lib/games/date";
import { AnnouncementForm } from "../announcement-form";
import { updateAnnouncementAction } from "../actions";
import { AnnouncementRowActions } from "../row-actions";

export const dynamic = "force-dynamic";

// 管理画面「お知らせ」の編集(タイトル・本文・投稿日・公開/非公開)。削除もこの画面からできる。
export default async function EditAnnouncementPage({ params }: PageProps<"/admin/announcements/[id]">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { data: announcement } = await createAdminSupabaseClient().from("announcements").select("*").eq("id", id).maybeSingle();
  if (!announcement) notFound();

  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8 sm:px-8">
      <p className="text-xs">
        <Link href="/admin/announcements" className="font-bold text-blue underline underline-offset-2">
          ← お知らせ一覧
        </Link>
      </p>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">お知らせの編集</h1>
        <span className={`px-2 py-0.5 text-xs font-extrabold ${announcement.is_published ? "bg-[#e6f4ee] text-[#17694e]" : "bg-background text-muted"}`}>
          {announcement.is_published ? "公開中" : "非公開"}
        </span>
      </div>
      <section className="border border-line bg-surface p-5 sm:p-6">
        <AnnouncementForm
          action={updateAnnouncementAction.bind(null, announcement.id)}
          announcement={announcement}
          defaultPostedOn={todayJst()}
          submitLabel="保存する"
        />
      </section>
      <section className="border border-line bg-surface p-5 sm:p-6">
        <h2 className="mb-2 text-base font-bold">公開状態の切り替え・削除</h2>
        <AnnouncementRowActions id={announcement.id} title={announcement.title} published={announcement.is_published} />
      </section>
    </main>
  );
}
