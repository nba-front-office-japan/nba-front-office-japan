"use client";

import { useActionState, useState, type MouseEvent } from "react";
import { updateDraftAction, rejectDraftAction } from "../actions";
import { ARTICLE_KIND_OPTIONS, ARTICLE_TYPE_OPTIONS, CATEGORY_OPTIONS } from "@/lib/news/constants";
import {
  INITIAL_ACTION_STATE,
  PRIMARY_BUTTON_CLASS,
  GHOST_BUTTON_CLASS,
  StatusMessage,
} from "@/app/admin/_components/action-ui";
import type { ArticleKind, Database } from "@/lib/supabase/types";
import { COLUMN_BADGE_CLASS } from "@/lib/news/constants";
import { BodyEditor } from "./body-editor";
import { BodyPreview, endsWithCredit } from "./body-preview";
import { ARTICLE_CREDIT, showsArticleCredit } from "@/lib/news/credit";

type ArticleDraft = Database["public"]["Tables"]["article_drafts"]["Row"];

// プレビューに使う入力中の値
type PreviewValues = { kind: ArticleKind; headline: string; dek: string; body: string };

function sameValues(a: PreviewValues, b: PreviewValues): boolean {
  return a.kind === b.kind && a.headline === b.headline && a.dek === b.dek && a.body === b.body;
}

export function DraftEditForm({ draft }: { draft: ArticleDraft }) {
  const [state, formAction, isPending] = useActionState(
    updateDraftAction,
    INITIAL_ACTION_STATE
  );
  const initial: PreviewValues = { kind: draft.article_kind, headline: draft.headline_ja, dek: draft.dek_ja ?? "", body: draft.body_markdown };
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

  return (
    <>
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

      {/* 入力中の内容をそのまま映すプレビュー。本文は入力欄と同じ文字組み(BODY_TEXT_CLASS)で、改行・折り返しの位置を揃える */}
      <div className="mt-6 border-t border-line pt-5">
        <h3 className="mb-1 text-base font-semibold">プレビュー（入力中の内容）</h3>
        <p className="mb-3 text-xs text-muted">
          本文は入力欄と同じ幅・文字組みで表示するため、改行と折り返しの位置が入力欄と一致します（リンクを含む行は、入力欄の URL の分だけ折り返しが変わります）。
          リンクは公開ページと同じく、サイト内リンクは同じタブ、外部リンクは別タブで開きます。「保存」を押すまで公開ページには反映されません。
        </p>
        {values.kind === "column" && <span className={`mb-3 ${COLUMN_BADGE_CLASS}`}>COLUMN</span>}
        <h4 className="mb-2 text-[24px] font-semibold leading-tight">{values.headline}</h4>
        {values.dek && <p className="mb-4 text-sm text-muted">{values.dek}</p>}
        <BodyPreview body={values.body} onInternalLinkClick={confirmLeave} />
        {/* 本文末尾のクレジット(公開ページと同じく自動で付く。本文に手入力済みなら、公開ページでは1回だけ表示される) */}
        {showsArticleCredit(values.kind) && !endsWithCredit(values.body) && (
          <p className="mt-3 text-right text-sm font-semibold text-foreground/80">{ARTICLE_CREDIT}</p>
        )}
      </div>
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
