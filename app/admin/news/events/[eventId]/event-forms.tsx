"use client";

import { useActionState } from "react";
import {
  updateEventAction,
  updateSourceItemAction,
  createDraftFromEventAction,
} from "../actions";
import {
  CATEGORY_OPTIONS,
  VERIFICATION_STATUS_OPTIONS,
  VERIFIED_FACTS_NOTES_MAX_LENGTH,
} from "@/lib/news/constants";
import {
  INITIAL_ACTION_STATE,
  PRIMARY_BUTTON_CLASS,
  GHOST_BUTTON_CLASS,
  StatusMessage,
} from "@/app/admin/_components/action-ui";
import type { Database } from "@/lib/supabase/types";

type NewsEvent = Database["public"]["Tables"]["news_events"]["Row"];
type NewsItem = Database["public"]["Tables"]["news_items"]["Row"];

export function EventInfoForm({ event }: { event: NewsEvent }) {
  const [state, formAction, isPending] = useActionState(
    updateEventAction,
    INITIAL_ACTION_STATE
  );

  return (
    <form action={formAction} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <input type="hidden" name="eventId" value={event.id} />
      <fieldset disabled={isPending} className="contents">
        <label className="grid gap-1 text-[11px] font-bold text-muted sm:col-span-2">
          内部見出し（英語）
          <input
            type="text"
            name="headlineEn"
            defaultValue={event.headline_en}
            required
            className="border border-line bg-surface px-3 py-2 text-sm text-foreground disabled:opacity-60"
          />
        </label>
        <label className="grid gap-1 text-[11px] font-bold text-muted">
          カテゴリ
          <select
            name="category"
            defaultValue={event.category}
            className="border border-line bg-surface px-3 py-2 text-sm text-foreground disabled:opacity-60"
          >
            {CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-[11px] font-bold text-muted">
          検証状態
          <select
            name="verificationStatus"
            defaultValue={event.verification_status}
            className="border border-line bg-surface px-3 py-2 text-sm text-foreground disabled:opacity-60"
          >
            {VERIFICATION_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-[11px] font-bold text-muted">
          重要度（0-100）
          <input
            type="number"
            name="importanceScore"
            min={0}
            max={100}
            defaultValue={event.importance_score}
            className="border border-line bg-surface px-3 py-2 text-sm text-foreground disabled:opacity-60"
          />
        </label>
        <label className="grid gap-1 text-[11px] font-bold text-muted">
          信頼度（0-100）
          <input
            type="number"
            name="reliabilityScore"
            min={0}
            max={100}
            defaultValue={event.reliability_score}
            className="border border-line bg-surface px-3 py-2 text-sm text-foreground disabled:opacity-60"
          />
        </label>
        <label className="grid gap-1 text-[11px] font-bold text-muted sm:col-span-2">
          確認済み事実メモ（非公開・管理画面専用）
          <span className="text-[11px] font-normal normal-case text-muted">
            原典の文章を貼らず、確認できた事実を箇条書きで書いてください。
          </span>
          <textarea
            name="verifiedFactsNotes"
            defaultValue={event.verified_facts_notes ?? ""}
            maxLength={VERIFIED_FACTS_NOTES_MAX_LENGTH}
            rows={6}
            placeholder={
              "例：\n- ○○選手が××チームと契約に合意（原典: ESPN）\n- 契約年数・金額は原典に記載なし"
            }
            className="border border-line bg-surface px-3 py-2 text-sm text-foreground disabled:opacity-60"
          />
        </label>
      </fieldset>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <button type="submit" disabled={isPending} className={PRIMARY_BUTTON_CLASS}>
          {isPending ? "保存中…" : "保存"}
        </button>
        {!isPending && <StatusMessage state={state} />}
      </div>
    </form>
  );
}

export function SourceItemForm({
  item,
  eventId,
  relationLabel,
  defaultAuthorName,
}: {
  item: NewsItem;
  eventId: string;
  relationLabel: string;
  defaultAuthorName: string;
}) {
  const [state, formAction, isPending] = useActionState(
    updateSourceItemAction,
    INITIAL_ACTION_STATE
  );

  return (
    <form
      action={formAction}
      className="grid grid-cols-1 gap-2 border border-line p-4 sm:grid-cols-2"
    >
      <input type="hidden" name="itemId" value={item.id} />
      <input type="hidden" name="eventId" value={eventId} />
      <p className="text-[11px] font-bold text-muted sm:col-span-2">{relationLabel}</p>
      <fieldset disabled={isPending} className="contents">
        <label className="grid gap-1 text-[11px] font-bold text-muted sm:col-span-2">
          タイトル
          <input
            type="text"
            name="title"
            defaultValue={item.title}
            required
            className="border border-line bg-surface px-3 py-2 text-sm text-foreground disabled:opacity-60"
          />
        </label>
        <label className="grid gap-1 text-[11px] font-bold text-muted sm:col-span-2">
          原典URL
          <input
            type="url"
            name="url"
            defaultValue={item.canonical_url}
            required
            className="border border-line bg-surface px-3 py-2 text-sm text-foreground disabled:opacity-60"
          />
        </label>
        <label className="grid gap-1 text-[11px] font-bold text-muted">
          媒体名・発表元
          <input
            type="text"
            name="authorName"
            defaultValue={defaultAuthorName}
            className="border border-line bg-surface px-3 py-2 text-sm text-foreground disabled:opacity-60"
          />
        </label>
      </fieldset>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={isPending} className={GHOST_BUTTON_CLASS}>
          {isPending ? "保存中…" : "このソースを保存"}
        </button>
        {!isPending && <StatusMessage state={state} />}
      </div>
    </form>
  );
}

export function CreateDraftButton({ eventId }: { eventId: string }) {
  const [state, formAction, isPending] = useActionState(
    createDraftFromEventAction,
    INITIAL_ACTION_STATE
  );

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="eventId" value={eventId} />
      <button type="submit" disabled={isPending} className={PRIMARY_BUTTON_CLASS}>
        {isPending ? "下書きを作成中…" : "下書きを作成する"}
      </button>
      {!isPending && <StatusMessage state={state} />}
    </form>
  );
}
