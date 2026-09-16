import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import {
  ARTICLE_TYPE_OPTIONS,
  ARTICLE_DRAFT_STATUS_LABEL,
  isLowConfidence,
} from "@/lib/news/constants";
import { updateDraftAction, rejectDraftAction } from "../actions";
import { PublishButton } from "./publish-button";

export const dynamic = "force-dynamic";

export default async function AdminNewsDraftDetailPage({
  params,
}: PageProps<"/admin/news/drafts/[draftId]">) {
  const { draftId } = await params;
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
        <Link href="/admin/news/drafts" className="mb-4 inline-block text-sm text-blue">
          ← 下書き一覧に戻る
        </Link>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold">記事下書きの編集</h1>
          <span className="border border-line px-3 py-1 text-sm font-bold">
            {ARTICLE_DRAFT_STATUS_LABEL[draft.status]}
          </span>
        </div>

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
                    className="font-semibold text-blue hover:underline"
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
          <form action={updateDraftAction} className="grid grid-cols-1 gap-3">
            <input type="hidden" name="draftId" value={draft.id} />
            <label className="grid gap-1 text-[11px] font-bold text-muted">
              記事種別
              <select
                name="articleType"
                defaultValue={draft.article_type}
                className="max-w-[200px] border border-line bg-surface px-3 py-2 text-sm text-foreground"
              >
                {ARTICLE_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-[11px] font-bold text-muted">
              見出し
              <input
                type="text"
                name="headlineJa"
                defaultValue={draft.headline_ja}
                required
                className="border border-line bg-surface px-3 py-2 text-sm text-foreground"
              />
            </label>
            <label className="grid gap-1 text-[11px] font-bold text-muted">
              サブ見出し（任意）
              <input
                type="text"
                name="dekJa"
                defaultValue={draft.dek_ja ?? ""}
                className="border border-line bg-surface px-3 py-2 text-sm text-foreground"
              />
            </label>
            <label className="grid gap-1 text-[11px] font-bold text-muted">
              本文（Markdown。RSS原文の転載はしないでください）
              <textarea
                name="bodyMarkdown"
                defaultValue={draft.body_markdown}
                rows={12}
                required
                className="border border-line bg-surface px-3 py-2 font-mono text-sm text-foreground"
              />
            </label>
            <label className="grid gap-1 text-[11px] font-bold text-muted">
              出典表記（任意の補足。原典リンクは上のセクションで自動表示されます）
              <textarea
                name="sourceAttributionMarkdown"
                defaultValue={draft.source_attribution_markdown}
                rows={4}
                className="border border-line bg-surface px-3 py-2 font-mono text-sm text-foreground"
              />
            </label>
            <label className="grid gap-1 text-[11px] font-bold text-muted">
              編集メモ（内部用・非公開）
              <textarea
                name="editorNotes"
                defaultValue={draft.editor_notes ?? ""}
                rows={2}
                className="border border-line bg-surface px-3 py-2 text-sm text-foreground"
              />
            </label>
            <div>
              <button
                type="submit"
                className="bg-blue px-4 py-2 text-sm font-bold text-white"
              >
                保存
              </button>
            </div>
          </form>
        </section>

        <section className="flex flex-wrap items-center gap-4 border border-line bg-surface p-6">
          <PublishButton draftId={draft.id} />
          <form action={rejectDraftAction}>
            <input type="hidden" name="draftId" value={draft.id} />
            <button
              type="submit"
              className="border border-line px-4 py-2 text-sm font-bold text-muted hover:text-foreground"
            >
              却下する
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
