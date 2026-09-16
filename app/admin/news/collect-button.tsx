"use client";

import { useActionState } from "react";
import { triggerCollectAction, type CollectActionState } from "./actions";
import { PRIMARY_BUTTON_CLASS } from "@/app/admin/_components/action-ui";

const initialState: CollectActionState = { status: "idle" };

export function CollectButton() {
  const [state, formAction, isPending] = useActionState(
    triggerCollectAction,
    initialState
  );

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-3">
      <button type="submit" disabled={isPending} className={PRIMARY_BUTTON_CLASS}>
        {isPending ? "収集中…（数十秒かかることがあります）" : "今すぐRSSを収集"}
      </button>
      {!isPending && state.status === "success" && (
        <span role="status" aria-live="polite" className="text-sm font-semibold text-[#218c68]">
          完了しました（取得 {state.totalFound}件 / 新規登録 {state.totalInserted}件）
        </span>
      )}
      {!isPending && state.status === "error" && (
        <span role="alert" aria-live="assertive" className="text-sm font-semibold text-[#cf4a51]">
          失敗しました: {state.message}
        </span>
      )}
    </form>
  );
}
