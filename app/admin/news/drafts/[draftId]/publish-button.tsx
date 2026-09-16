"use client";

import { useActionState, useState } from "react";
import { publishDraftAction } from "../actions";
import {
  INITIAL_ACTION_STATE,
  GOLD_BUTTON_CLASS,
  GHOST_BUTTON_CLASS,
  DANGER_BUTTON_CLASS,
  StatusMessage,
} from "@/app/admin/_components/action-ui";

export function PublishButton({ draftId }: { draftId: string }) {
  const [armed, setArmed] = useState(false);
  const [state, formAction, isPending] = useActionState(
    publishDraftAction,
    INITIAL_ACTION_STATE
  );

  if (!armed) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setArmed(true)}
          className={GOLD_BUTTON_CLASS}
        >
          公開する
        </button>
        {!isPending && <StatusMessage state={state} />}
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="draftId" value={draftId} />
      {!isPending && (
        <span className="text-sm font-bold text-[#cf4a51]">
          本当に公開しますか？公開後は一般ページに表示されます。
        </span>
      )}
      <button type="submit" disabled={isPending} className={DANGER_BUTTON_CLASS}>
        {isPending ? "公開中…" : "はい、公開する"}
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={() => setArmed(false)}
        className={GHOST_BUTTON_CLASS}
      >
        キャンセル
      </button>
      {!isPending && <StatusMessage state={state} />}
    </form>
  );
}
