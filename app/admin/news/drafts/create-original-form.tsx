"use client";

import { useActionState, useState } from "react";
import { createOriginalDraftAction } from "./actions";
import { ARTICLE_KIND_OPTIONS, CATEGORY_OPTIONS } from "@/lib/news/constants";
import { GHOST_BUTTON_CLASS, INITIAL_ACTION_STATE, PRIMARY_BUTTON_CLASS, StatusMessage } from "@/app/admin/_components/action-ui";

// 独自コラムの作成(取得ニュース・イベント・外部媒体を使わない)。
// 入力は日本語タイトル・カテゴリ(必須)と記事種別(初期値はコラム)。本文は作成後の編集画面で入力する。
export function CreateOriginalForm() {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(createOriginalDraftAction, INITIAL_ACTION_STATE);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={PRIMARY_BUTTON_CLASS}>
        独自コラムを作成
      </button>
    );
  }

  return (
    <form action={formAction} className="grid grid-cols-1 gap-3 border border-line p-4 sm:grid-cols-2">
      <fieldset disabled={isPending} className="contents">
        <label className="grid gap-1 text-[11px] font-bold text-muted sm:col-span-2">
          日本語タイトル（必須）
          <input
            type="text"
            name="headlineJa"
            required
            maxLength={200}
            className="border border-line bg-surface px-3 py-2 text-sm font-normal text-foreground disabled:opacity-60"
          />
        </label>
        <label className="grid gap-1 text-[11px] font-bold text-muted">
          カテゴリ（必須）
          <select
            name="category"
            required
            defaultValue=""
            className="border border-line bg-surface px-3 py-2 text-sm text-foreground disabled:opacity-60"
          >
            <option value="" disabled>
              選んでください
            </option>
            {CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-[11px] font-bold text-muted">
          記事種別
          <select
            name="articleKind"
            defaultValue="column"
            className="border border-line bg-surface px-3 py-2 text-sm text-foreground disabled:opacity-60"
          >
            {ARTICLE_KIND_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      </fieldset>
      <p className="text-xs text-muted sm:col-span-2">
        外部媒体・取得ニュース・イベント・情報源は不要です。本文は作成後の編集画面で入力します（公開ページに「情報源」欄は表示されません）。
      </p>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <button type="submit" disabled={isPending} className={PRIMARY_BUTTON_CLASS}>
          {isPending ? "作成中…" : "作成して編集画面へ"}
        </button>
        <button type="button" disabled={isPending} onClick={() => setOpen(false)} className={GHOST_BUTTON_CLASS}>
          キャンセル
        </button>
        {!isPending && <StatusMessage state={state} />}
      </div>
    </form>
  );
}
