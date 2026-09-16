"use client";

import { useActionState } from "react";
import { updateDraftAction, rejectDraftAction } from "../actions";
import { ARTICLE_TYPE_OPTIONS } from "@/lib/news/constants";
import {
  INITIAL_ACTION_STATE,
  PRIMARY_BUTTON_CLASS,
  GHOST_BUTTON_CLASS,
  StatusMessage,
} from "@/app/admin/_components/action-ui";
import type { Database } from "@/lib/supabase/types";

type ArticleDraft = Database["public"]["Tables"]["article_drafts"]["Row"];

export function DraftEditForm({ draft }: { draft: ArticleDraft }) {
  const [state, formAction, isPending] = useActionState(
    updateDraftAction,
    INITIAL_ACTION_STATE
  );

  return (
    <form action={formAction} className="grid grid-cols-1 gap-3">
      <input type="hidden" name="draftId" value={draft.id} />
      <fieldset disabled={isPending} className="contents">
        <label className="grid gap-1 text-[11px] font-bold text-muted">
          記事種別
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
            className="border border-line bg-surface px-3 py-2 text-sm text-foreground disabled:opacity-60"
          />
        </label>
        <label className="grid gap-1 text-[11px] font-bold text-muted">
          本文（Markdown。RSS原文の転載はしないでください）
          <textarea
            name="bodyMarkdown"
            defaultValue={draft.body_markdown}
            rows={12}
            required
            className="border border-line bg-surface px-3 py-2 font-mono text-sm text-foreground disabled:opacity-60"
          />
        </label>
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
      </div>
    </form>
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
