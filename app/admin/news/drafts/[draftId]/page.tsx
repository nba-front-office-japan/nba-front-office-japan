import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { ARTICLE_DRAFT_STATUS_LABEL, isLowConfidence, isRumorOrUnverified, isSingleSource } from "@/lib/news/constants";
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

  // 独自コラム(イベントなし)には、イベント・原典がない
  const isOriginal = draft.event_id === null;
  const { data: event } = draft.event_id
    ? await supabase.from("news_events").select("*").eq("id", draft.event_id).single()
    : { data: null };

  const { data: eventSources } = draft.event_id
    ? await supabase.from("news_event_sources").select("news_item_id").eq("event_id", draft.event_id)
    : { data: [] };

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

  // プレビュー(公開ページと同じ表示)に使う、イベントのカテゴリ・確認状況・原典(公開ページと同じ判定)
  const previewContext = {
    eventCategory: event?.category ?? null,
    lowConfidence: event ? isRumorOrUnverified(event.verification_status) : false,
    singleSource: event ? isSingleSource(event.verification_status) : false,
    sources: (items ?? []).map((item) => ({
      title: item.title,
      url: item.canonical_url,
      mediaName: item.author_name ?? sourceNameById.get(item.source_id) ?? "不明",
    })),
  };

  // 編集画面全体を公開ページの本文欄と同じ幅で表示し、入力欄のすぐ後に公開ページと同じ表示のプレビューを置く(DraftEditForm)
  return (
    <div className="py-8">
      <DraftEditForm
        draft={draft}
        context={previewContext}
        formHeader={
          // サーバーからクライアントの部品へ渡す要素には key を付ける(付けないと開発時に key の警告が出る)
          <div key="form-header">
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
              {isOriginal ? (
                <p className="text-sm text-muted">
                  独自コラム（イベント・取得ニュースなし）のため、原典はありません。公開ページには「情報源」欄を表示しません。
                </p>
              ) : (items ?? []).length === 0 ? (
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
          </div>
        }
        afterForm={
          <section key="publish" className="flex flex-wrap items-center gap-4 border border-line bg-surface p-6">
            <PublishButton draftId={draft.id} />
            <RejectButton draftId={draft.id} />
          </section>
        }
      />
    </div>
  );
}
