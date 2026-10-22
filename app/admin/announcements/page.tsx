import Link from "next/link";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { announcementExcerpt, isMissingTableError } from "@/lib/announcements";
import { LINK_CLASS, PRIMARY_BUTTON_CLASS } from "@/app/admin/_components/action-ui";
import { AnnouncementRowActions } from "./row-actions";

// 管理画面「お知らせ」の一覧(公開中・非公開のすべて)。作成・編集・公開/非公開・削除ができる。
export const dynamic = "force-dynamic";

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo", dateStyle: "short", timeStyle: "short" });
}

export default async function AdminAnnouncementsPage({ searchParams }: PageProps<"/admin/announcements">) {
  const { saved } = await searchParams;
  const { data, error } = await createAdminSupabaseClient()
    .from("announcements")
    .select("*")
    .order("posted_on", { ascending: false })
    .order("created_at", { ascending: false });
  const missing = isMissingTableError(error);
  const items = data ?? [];

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">お知らせ</h1>
          <p className="mt-1 text-sm text-muted">公開中のお知らせは、トップページ（新しい順に最大3件）と「お知らせ」ページに表示します。非公開のものは公開サイトに出ません。</p>
        </div>
        {!missing && (
          <Link href="/admin/announcements/new" className={PRIMARY_BUTTON_CLASS}>
            ＋ 新しいお知らせ
          </Link>
        )}
      </div>

      {saved === "created" && (
        <p role="status" className="border-l-4 border-[#218c68] bg-surface px-4 py-3 text-sm font-semibold text-[#218c68]">
          お知らせを作成しました。
        </p>
      )}

      {missing ? (
        <p role="alert" className="border-l-4 border-[#cf4a51] bg-surface px-4 py-3 text-sm font-semibold text-[#a3383d] dark:text-[#ff8a7a]">
          お知らせのテーブルがまだありません。<code className="break-all">supabase/migrations/20261023000000_announcements.sql</code> を Supabase で実行してから使ってください。
        </p>
      ) : error ? (
        <p role="alert" className="text-sm font-semibold text-[#cf4a51]">
          お知らせの取得に失敗しました：{error.message}
        </p>
      ) : items.length === 0 ? (
        <p className="border border-line bg-surface px-5 py-8 text-center text-sm text-muted">まだお知らせはありません。「＋ 新しいお知らせ」から作成できます。</p>
      ) : (
        <ul className="space-y-3">
          {items.map((a) => (
            <li key={a.id} className="border border-line bg-surface p-4 sm:p-5">
              <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
                <span
                  className={`inline-block px-1.5 py-0.5 font-extrabold ${a.is_published ? "bg-[#e6f4ee] text-[#17694e] dark:bg-[#123b2e] dark:text-[#7fd6b3]" : "bg-background text-muted"}`}
                >
                  {a.is_published ? "公開中" : "非公開"}
                </span>
                <span className="tabular-nums text-muted">投稿日 {a.posted_on}</span>
                <span className="text-muted">更新 {formatDateTime(a.updated_at)}</span>
              </div>
              <h2 className="mb-1 break-words text-base font-bold">
                <Link href={`/admin/announcements/${a.id}`} className={LINK_CLASS}>
                  {a.title}
                </Link>
              </h2>
              <p className="mb-3 break-words text-sm text-muted">{announcementExcerpt(a.body, 100)}</p>
              <div className="flex flex-wrap items-center gap-3">
                <Link href={`/admin/announcements/${a.id}`} className="text-xs font-bold text-blue underline underline-offset-2">
                  編集
                </Link>
                {a.is_published && (
                  <Link href={`/announcements/${a.id}`} target="_blank" className="text-xs font-bold text-blue underline underline-offset-2">
                    公開ページを見る
                  </Link>
                )}
                <AnnouncementRowActions id={a.id} title={a.title} published={a.is_published} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
