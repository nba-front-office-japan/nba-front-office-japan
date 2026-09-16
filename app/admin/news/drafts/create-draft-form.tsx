"use client";

import { useActionState } from "react";
import { createDraftAction } from "./actions";
import {
  INITIAL_ACTION_STATE,
  PRIMARY_BUTTON_CLASS,
  StatusMessage,
} from "@/app/admin/_components/action-ui";

export function CreateDraftForm({
  events,
}: {
  events: { id: string; headline_en: string }[];
}) {
  const [state, formAction, isPending] = useActionState(
    createDraftAction,
    INITIAL_ACTION_STATE
  );

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <label className="grid gap-1 text-[11px] font-bold text-muted">
        イベント
        <select
          name="eventId"
          required
          disabled={isPending}
          className="min-w-[280px] border border-line bg-surface px-3 py-2 text-sm text-foreground disabled:opacity-60"
        >
          {events.map((e) => (
            <option key={e.id} value={e.id}>
              {e.headline_en}
            </option>
          ))}
        </select>
      </label>
      <button type="submit" disabled={isPending} className={PRIMARY_BUTTON_CLASS}>
        {isPending ? "下書きを作成中…" : "下書きを作成"}
      </button>
      {!isPending && <StatusMessage state={state} />}
    </form>
  );
}
