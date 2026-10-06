import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { ARTICLE_DRAFT_STATUS_LABEL, isLowConfidence } from "@/lib/news/constants";
import { LINK_CLASS } from "@/app/admin/_components/action-ui";
import { DraftEditForm, RejectButton } from "./draft-forms";
import { PublishButton } from "./publish-button";

export const dynamic = "force-dynamic";

export default async function AdminNewsDraftDetailPage({
  params,
  searchParams,
}: PageProps<"/admin/news/drafts/[draftId]">) {
  const { draftId } = await params;
  const { created } = await searchParams;
  const supabase = createAdminSupabaseClient();

  const { data: draft, error } = await supabase
    .from("article_drafts")
    .select("*")
    .eq("id", draftId)
    .single();

  if (error || !draft) {
    notFound();
  }

  const { data: event } = await supabase
    .from("news_events")
    .select("*")
    .eq("id", draft.event_id)
    .single();

  const { data: eventSources } = await supabase
    .from("news_event_sources")
    .select("news_item_id")
    .eq("event_id", draft.event_id);

  const itemIds = (eventSources ?? []).map((s) => s.news_item_id);
  const { data: items } =
    itemIds.length > 0
      ? await supabase.from("news_items").select("*").in("id", itemIds)
      : { data: [] };

  const sourceIds = [...new Set((items ?? []).map((i) => i.source_id))];
  const { data: sources } =
    sourceIds.length > 0
      ? await supabase.from("news_sources").select("id, name").in("id", sourceIds)
      : { data: [] };
  const sourceNameById = new Map((sources ?? []).map((s) => [s.id, s.name]));

  return (
    <div className="px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <Link href="/admin/news/drafts" className={`mb-4 inline-block text-sm ${LINK_CLASS}`}>
          ← 下書き一覧に戻る
        </Link>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold">記事下書きの編集</h1>
          <span className="border border-line px-3 py-1 text-sm font-bold">
            {ARTICLE_DRAFT_STATUS_LABEL[draft.status]}
          </span>
        </div>

        {created === "1" && (
          <p
            role="status"
            aria-live="polite"
            className="mb-4 border border-[#218c68] bg-[#e9f7f1] px-4 py-3 text-sm font-bold text-[#186b4f] dark:bg-white/[.06]"
          >
            下書きを作成しました
          </p>
        )}

        {event && isLowConfidence(event.verification_status, event.reliability_score) && (
          <p className="mb-4 border border-[#f3b83f] bg-[#fff8e8] px-4 py-3 text-sm font-bold text-[#8a5a00] dark:bg-white/[.06]">
            未確定情報（rumor/unverified、または信頼度70未満）です。公開前に必ず事実確認してください。
          </p>
        )}

        <section className="mb-8 border border-line bg-surface p-6">
          <h2 className="mb-4 text-lg font-semibold">原典（公開ページに必ず表示されます）</h2>
          {(items ?? []).length === 0 ? (
            <p className="text-sm text-muted">原典が見つかりません。</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {(items ?? []).map((item) => (
                <li key={item.id}>
                  <a
                    href={item.canonical_url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className={LINK_CLASS}
                  >
                    {item.title}
                  </a>
                  <span className="text-muted">
                    {" "}
                    ・ {item.author_name ?? sourceNameById.get(item.source_id) ?? "不明"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mb-8 border border-line bg-surface p-6">
          <h2 className="mb-4 text-lg font-semibold">本文</h2>
          <DraftEditForm draft={draft} />
        </section>

        <section className="flex flex-wrap items-center gap-4 border border-line bg-surface p-6">
          <PublishButton draftId={draft.id} />
          <RejectButton draftId={draft.id} />
        </section>
      </div>
    </div>
  );
}
