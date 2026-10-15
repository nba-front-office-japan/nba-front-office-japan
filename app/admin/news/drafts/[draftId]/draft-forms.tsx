"use client";

import { useActionState, useState, type MouseEvent, type ReactNode } from "react";
import Link from "next/link";
import { updateDraftAction, rejectDraftAction } from "../actions";
import { ARTICLE_KIND_OPTIONS, ARTICLE_TYPE_OPTIONS, CATEGORY_OPTIONS } from "@/lib/news/constants";
import {
  INITIAL_ACTION_STATE,
  PRIMARY_BUTTON_CLASS,
  GHOST_BUTTON_CLASS,
  StatusMessage,
} from "@/app/admin/_components/action-ui";
import type { ArticleKind, Database } from "@/lib/supabase/types";
import { BodyEditor } from "./body-editor";
import { MAX_RELATED_MEDIA, parseRelatedMediaUrl } from "@/lib/news/related-media";
import { trailingRelatedMedia } from "@/lib/news/body-media";
import { ARTICLE_PAGE_FRAME_CLASS, NewsArticleView, formatArticleDate, type ArticleViewSource } from "@/components/news/article-view";

type ArticleDraft = Database["public"]["Tables"]["article_drafts"]["Row"];

// プレビューに使う入力中の値
type PreviewValues = { kind: ArticleKind; category: string; headline: string; dek: string; body: string; media: string[] };

function sameValues(a: PreviewValues, b: PreviewValues): boolean {
  return (
    a.kind === b.kind &&
    a.category === b.category &&
    a.headline === b.headline &&
    a.dek === b.dek &&
    a.body === b.body &&
    a.media.join("|") === b.media.join("|")
  );
}

const CATEGORY_LABEL: Record<string, string> = Object.fromEntries(CATEGORY_OPTIONS.map((o) => [o.value, o.label]));

/** 編集画面の入力欄などを置く列(管理画面の幅) */
export const ADMIN_COLUMN_CLASS = "mx-auto max-w-4xl";

/** プレビューで公開ページと同じに表示するための、入力欄以外の情報(イベントのカテゴリ・確認状況・原典) */
export type DraftPreviewContext = {
  /** イベントありの記事のカテゴリ(独自コラムは入力中のカテゴリを使うため null) */
  eventCategory: string | null;
  lowConfidence: boolean;
  singleSource: boolean;
  sources: ArticleViewSource[];
};

// 入力欄(管理画面の列の中)と、公開ページと同じ表示のプレビュー(公開ページの本文欄と同じ幅の枠)。
// プレビューは公開ページと同じ部品(components/news/article-view.tsx)で描くため、文字組み・1行の文字数・段落の余白・
// リンク・本文中メディアの表示が公開ページと一致する(同じ画面幅の場合)。
// formHeader は入力欄の前に、afterForm は入力欄とプレビューの間に置く(管理画面の列の中)。
export function DraftEditForm({
  draft,
  context,
  formHeader,
  afterForm,
}: {
  draft: ArticleDraft;
  context: DraftPreviewContext;
  formHeader?: ReactNode;
  afterForm?: ReactNode;
}) {
  const [state, formAction, isPending] = useActionState(
    updateDraftAction,
    INITIAL_ACTION_STATE
  );
  const savedMedia = draft.related_media_urls ?? [];
  const initial: PreviewValues = {
    kind: draft.article_kind,
    category: draft.category ?? "other",
    headline: draft.headline_ja,
    dek: draft.dek_ja ?? "",
    body: draft.body_markdown,
    media: Array.from({ length: MAX_RELATED_MEDIA }, (_, i) => savedMedia[i] ?? ""),
  };
  const [values, setValues] = useState<PreviewValues>(initial);
  const [submitted, setSubmitted] = useState<PreviewValues | null>(null);
  const set = (patch: Partial<PreviewValues>) => setValues((v) => ({ ...v, ...patch }));
  // 保存済みの内容と比べて変更があるか(保存に成功したら、そのとき送った内容を基準にする)
  const baseline = state.status === "success" && submitted ? submitted : initial;
  const dirty = !sameValues(values, baseline);

  // プレビューの内部リンクで画面を離れる前に、未保存の変更があれば確認する
  function confirmLeave(e: MouseEvent<HTMLAnchorElement>) {
    if (dirty && !window.confirm("保存していない変更があります。このページを離れると変更は失われます。移動しますか？")) e.preventDefault();
  }

  // 関連メディアURLの入力欄のうち、使える URL(正規化したもの)
  const relatedUrls = values.media.flatMap((u) => {
    const m = u.trim() ? parseRelatedMediaUrl(u) : null;
    return m ? [m.url] : [];
  });
  const categoryValue = draft.event_id === null ? values.category : context.eventCategory;

  return (
    <>
      <div className="px-4 sm:px-8">
        <div className={ADMIN_COLUMN_CLASS}>
          {formHeader}
          <section className="mb-8 border border-line bg-surface p-6">
            <h2 className="mb-4 text-lg font-semibold">本文</h2>
      <form action={formAction} onSubmit={() => setSubmitted(values)} className="grid grid-cols-1 gap-3">
        <input type="hidden" name="draftId" value={draft.id} />
        <fieldset disabled={isPending} className="contents">
          <label className="grid gap-1 text-[11px] font-bold text-muted">
            記事種別（COLUMNは公開ページに「COLUMN」ラベルが付きます）
            <select
              name="articleKind"
              defaultValue={draft.article_kind}
              onChange={(e) => set({ kind: e.target.value as ArticleKind })}
              className="max-w-[200px] border border-line bg-surface px-3 py-2 text-sm text-foreground disabled:opacity-60"
            >
              {ARTICLE_KIND_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          {/* 独自コラム(イベントなし)はカテゴリを下書きに持つため、ここで変更できる */}
          {draft.event_id === null && (
            <label className="grid gap-1 text-[11px] font-bold text-muted">
              カテゴリ（独自コラム）
              <select
                name="category"
                defaultValue={draft.category ?? "other"}
                onChange={(e) => set({ category: e.target.value })}
                required
                className="max-w-[200px] border border-line bg-surface px-3 py-2 text-sm text-foreground disabled:opacity-60"
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="grid gap-1 text-[11px] font-bold text-muted">
            記事形式
            <select
              name="articleType"
              defaultValue={draft.article_type}
              className="max-w-[200px] border border-line bg-surface px-3 py-2 text-sm text-foreground disabled:opacity-60"
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
              onChange={(e) => set({ headline: e.target.value })}
              required
              className="border border-line bg-surface px-3 py-2 text-sm text-foreground disabled:opacity-60"
            />
          </label>
          <label className="grid gap-1 text-[11px] font-bold text-muted">
            サブ見出し（任意）
            <input
              type="text"
              name="dekJa"
              defaultValue={draft.dek_ja ?? ""}
              onChange={(e) => set({ dek: e.target.value })}
              className="border border-line bg-surface px-3 py-2 text-sm text-foreground disabled:opacity-60"
            />
          </label>
          <BodyEditor name="bodyMarkdown" defaultValue={draft.body_markdown} onChange={(body) => set({ body })} />
          <fieldset className="grid min-w-0 gap-1.5">
            <legend className="mb-1 text-[11px] font-bold text-muted">関連メディアURL（X・YouTube／任意）</legend>
            <p className="text-xs text-muted">
              Xの公開ポスト（x.com / twitter.com の …/status/数字）と、YouTubeの動画・Shorts のURLを登録できます。公開ページでは本文の後に表示します（本文中に「メディア挿入」で入れたものと合わせて{MAX_RELATED_MEDIA}件まで。本文中に入れたものは末尾には重ねて表示しません）。空欄は登録しません。
            </p>
            {values.media.map((_, i) => (
              <input
                key={i}
                type="text"
                name="relatedMediaUrl"
                inputMode="url"
                defaultValue={initial.media[i]}
                onChange={(e) => set({ media: values.media.map((v, j) => (j === i ? e.target.value : v)) })}
                placeholder={i === 0 ? "例：https://x.com/NBA/status/1234567890" : i === 1 ? "例：https://www.youtube.com/watch?v=動画ID" : ""}
                aria-label={`関連メディアURL ${i + 1}件目`}
                className="min-w-0 border border-line bg-surface px-3 py-2 text-sm text-foreground disabled:opacity-60"
              />
            ))}
          </fieldset>
          <label className="grid gap-1 text-[11px] font-bold text-muted">
            出典表記（任意の補足。原典リンクは上のセクションで自動表示されます）
            <textarea
              name="sourceAttributionMarkdown"
              defaultValue={draft.source_attribution_markdown}
              rows={4}
              className="border border-line bg-surface px-3 py-2 font-mono text-sm text-foreground disabled:opacity-60"
            />
          </label>
          <label className="grid gap-1 text-[11px] font-bold text-muted">
            編集メモ（内部用・非公開）
            <textarea
              name="editorNotes"
              defaultValue={draft.editor_notes ?? ""}
              rows={2}
              className="border border-line bg-surface px-3 py-2 text-sm text-foreground disabled:opacity-60"
            />
          </label>
        </fieldset>
        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={isPending} className={PRIMARY_BUTTON_CLASS}>
            {isPending ? "保存中…" : "保存"}
          </button>
          {!isPending && <StatusMessage state={state} />}
          {dirty && !isPending && <span className="text-xs font-semibold text-[#8a5a00]">未保存の変更があります</span>}
        </div>
      </form>

          </section>
          {afterForm}
        </div>
      </div>

      {/* 入力中の内容のプレビュー。公開ページと同じ部品・同じ幅の枠で描く(保存するまで公開ページには反映されない) */}
      <section aria-labelledby="draft-preview-heading" className="mt-8 border-t-4 border-gold pb-10 pt-6">
        <div className="px-4 sm:px-8">
          <div className={`${ADMIN_COLUMN_CLASS} mb-4`}>
            <h2 id="draft-preview-heading" className="mb-1 text-lg font-semibold">
              プレビュー（入力中の内容）
            </h2>
            <p className="text-xs leading-6 text-muted">
              公開記事ページと同じ部品・同じ幅で表示します。同じ画面幅なら、改行の位置・段落の間隔・本文中メディアの位置が公開ページと一致します。
              「保存」を押すまで公開ページには反映されません。
            </p>
          </div>
        </div>
        <div className={ARTICLE_PAGE_FRAME_CLASS}>
          <NewsArticleView
            articleKind={values.kind}
            categoryLabel={categoryValue ? (CATEGORY_LABEL[categoryValue] ?? categoryValue) : null}
            lowConfidence={context.lowConfidence}
            singleSource={context.singleSource}
            headline={values.headline}
            dek={values.dek.trim() || null}
            dateLabel={draft.published_at ? formatArticleDate(draft.published_at) : "公開日（公開すると表示されます）"}
            bodyMarkdown={values.body}
            trailingMedia={trailingRelatedMedia(values.body, relatedUrls)}
            sources={context.sources}
            onInternalLinkClick={confirmLeave}
            footer={
              <Link href="/news" onClick={confirmLeave} className="mt-6 inline-block text-sm font-extrabold text-blue">
                ← News一覧に戻る
              </Link>
            }
          />
        </div>
      </section>
    </>
  );
}

export function RejectButton({ draftId }: { draftId: string }) {
  const [state, formAction, isPending] = useActionState(
    rejectDraftAction,
    INITIAL_ACTION_STATE
  );

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="draftId" value={draftId} />
      <button type="submit" disabled={isPending} className={GHOST_BUTTON_CLASS}>
        {isPending ? "却下中…" : "却下する"}
      </button>
      {!isPending && <StatusMessage state={state} />}
    </form>
  );
}
