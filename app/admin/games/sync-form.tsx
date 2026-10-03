"use client";

import { useActionState } from "react";
import { PRIMARY_BUTTON_CLASS } from "@/app/admin/_components/action-ui";
import { syncGamesAction, type SyncState } from "./actions";

// 試合日程・クオータースコアを balldontlie(無料プラン)から取り込むフォーム。日付は米国の日付。
export function SyncForm({ defaultFrom, defaultTo, maxDays }: { defaultFrom: string; defaultTo: string; maxDays: number }) {
  const [state, action, pending] = useActionState<SyncState, FormData>(syncGamesAction, { status: "idle" });

  return (
    <div className="space-y-3">
      <form action={action} className="flex flex-wrap items-end gap-3">
        <label className="text-sm">
          <span className="mb-1 block text-xs font-bold text-muted">開始日（米国日付）</span>
          <input type="date" name="from" defaultValue={defaultFrom} required className="border border-line bg-surface px-2 py-1.5" />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs font-bold text-muted">終了日（米国日付）</span>
          <input type="date" name="to" defaultValue={defaultTo} required className="border border-line bg-surface px-2 py-1.5" />
        </label>
        <button type="submit" disabled={pending} className={PRIMARY_BUTTON_CLASS}>
          {pending ? "取り込み中…" : "日程・スコアを取り込む"}
        </button>
      </form>
      <p className="text-xs text-muted">一度に{maxDays}日分まで。無料プランの制限（1分あたり5回）があるため、続けて何度も押さないでください。</p>
      {state.status === "error" && (
        <p role="alert" className="text-sm font-semibold text-[#cf4a51]">
          {state.message}
        </p>
      )}
      {state.status === "done" && (
        <div role="status" className="text-sm">
          <p className="font-semibold text-[#218c68]">
            完了しました（{state.result.dates[0]}〜{state.result.dates[state.result.dates.length - 1]}：取得 {state.result.fetched}試合／登録・更新 {state.result.upserted}試合）
          </p>
          {state.result.skipped.length > 0 && (
            <ul className="mt-1 list-disc pl-5 text-[#7a5200] dark:text-[#ffd27a]">
              {state.result.skipped.map((s) => (
                <li key={s.gameId}>{s.reason}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
