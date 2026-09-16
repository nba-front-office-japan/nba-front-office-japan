"use client";

import { useActionState } from "react";
import { triggerCollectAction, type CollectActionState } from "./actions";

const initialState: CollectActionState = { status: "idle" };

export function CollectButton() {
  const [state, formAction, isPending] = useActionState(
    triggerCollectAction,
    initialState
  );

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-3">
      <button
        type="submit"
        disabled={isPending}
        className="bg-blue px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "収集中…（数十秒かかることがあります）" : "今すぐRSSを収集"}
      </button>
      {!isPending && state.status === "success" && (
        <span className="text-sm font-semibold text-[#218c68]">
          完了しました（取得 {state.totalFound}件 / 新規登録 {state.totalInserted}件）
        </span>
      )}
      {!isPending && state.status === "error" && (
        <span className="text-sm font-semibold text-[#cf4a51]">
          失敗しました: {state.message}
        </span>
      )}
    </form>
  );
}
