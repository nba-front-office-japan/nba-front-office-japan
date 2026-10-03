"use client";

import { useState, useTransition } from "react";
import {
  DANGER_BUTTON_CLASS,
  GHOST_BUTTON_CLASS,
  PRIMARY_BUTTON_CLASS,
} from "@/app/admin/_components/action-ui";
import {
  deleteNewsItemsAction,
  hideNewsItemsAction,
  unhideNewsItemsAction,
  type BulkItemsState,
} from "./actions";

export type BulkTargetItem = { id: string; isHidden: boolean; eventId: string | null };

type Mode = "hide" | "unhide" | "delete";

const MODE_LABEL: Record<Mode, { title: string; run: (n: number) => string }> = {
  hide: { title: "非掲載にする", run: (n) => `${n}件を非掲載にする` },
  unhide: { title: "非掲載を解除する", run: (n) => `${n}件の非掲載を解除する` },
  delete: { title: "完全に削除する", run: (n) => `${n}件を完全に削除する` },
};

// 選択した記事への一括操作。操作前に、実際に対象になる件数と対象外の件数を確認できるようにする。
// (イベントで使われている記事は、公開記事の出典になっている可能性があるため対象外。サーバー側でも同じ判定をする)
export function BulkActions({
  selectedItems,
  onDone,
}: {
  selectedItems: BulkTargetItem[];
  onDone: () => void;
}) {
  const [mode, setMode] = useState<Mode | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [result, setResult] = useState<BulkItemsState>({ status: "idle" });
  const [pending, startTransition] = useTransition();

  const linked = selectedItems.filter((i) => i.eventId !== null);
  const unlinked = selectedItems.filter((i) => i.eventId === null);
  const counts: Record<Mode, { target: number; notes: string[] }> = {
    hide: {
      target: unlinked.filter((i) => !i.isHidden).length,
      notes: [
        ...(unlinked.some((i) => i.isHidden) ? [`すでに非掲載の${unlinked.filter((i) => i.isHidden).length}件はそのままです`] : []),
      ],
    },
    unhide: {
      target: unlinked.filter((i) => i.isHidden).length,
      notes: [
        ...(unlinked.some((i) => !i.isHidden) ? [`非掲載になっていない${unlinked.filter((i) => !i.isHidden).length}件はそのままです`] : []),
      ],
    },
    delete: { target: unlinked.length, notes: [] },
  };

  function open(next: Mode) {
    setMode(next);
    setConfirmDelete(false);
    setResult({ status: "idle" });
  }

  function run() {
    if (!mode) return;
    const formData = new FormData();
    for (const item of selectedItems) formData.append("itemIds", item.id);
    if (mode === "delete" && confirmDelete) formData.set("confirmDelete", "yes");
    const action = mode === "hide" ? hideNewsItemsAction : mode === "unhide" ? unhideNewsItemsAction : deleteNewsItemsAction;
    startTransition(async () => {
      const res = await action({ status: "idle" }, formData);
      setResult(res);
      if (res.status === "success") {
        setMode(null);
        onDone();
      }
    });
  }

  const current = mode ? counts[mode] : null;

  return (
    <div className="mb-3 space-y-2">
      <div className="flex flex-wrap items-center gap-2 border border-line bg-[#f6f9ff] px-3 py-2 dark:bg-white/[.04]">
        <span className="mr-1 text-sm font-bold">選択中 {selectedItems.length}件を：</span>
        <button type="button" className={GHOST_BUTTON_CLASS} disabled={pending || selectedItems.length === 0} onClick={() => open("hide")}>
          非掲載にする
        </button>
        <button type="button" className={GHOST_BUTTON_CLASS} disabled={pending || selectedItems.length === 0} onClick={() => open("unhide")}>
          非掲載を解除
        </button>
        <button type="button" className={GHOST_BUTTON_CLASS} disabled={pending || selectedItems.length === 0} onClick={() => open("delete")}>
          完全に削除…
        </button>
      </div>

      {mode && current && (
        <div
          role="dialog"
          aria-label={`${MODE_LABEL[mode].title}の確認`}
          className={`border-l-4 bg-surface px-4 py-3 text-sm ${mode === "delete" ? "border-[#cf4a51]" : "border-blue"}`}
        >
          <p className="mb-1 font-extrabold">{MODE_LABEL[mode].title}：確認</p>
          <ul className="mb-2 space-y-0.5">
            <li>
              選択中：{selectedItems.length}件 → <b>対象：{current.target}件</b>
            </li>
            {linked.length > 0 && <li>イベントで使われている{linked.length}件は対象外です（公開記事の出典になっている可能性があるため）</li>}
            {current.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
          {mode === "hide" && <p className="mb-2 text-xs text-muted">非掲載にした記事は、この一覧の通常表示とイベント作成の対象から外れます。データは残り、あとで解除できます。</p>}
          {mode === "delete" && (
            <div className="mb-2 space-y-1 text-xs">
              <p className="font-bold text-[#a3383d] dark:text-[#ff8a7a]">完全に削除した記事は元に戻せません。</p>
              <p className="text-muted">
                収集元のRSSにまだ載っている記事は、次の収集で再び登録されることがあります。一覧から外すだけなら「非掲載」をおすすめします。
              </p>
              <label className="flex items-center gap-2 font-bold">
                <input type="checkbox" checked={confirmDelete} onChange={(e) => setConfirmDelete(e.target.checked)} />
                元に戻せないことを確認しました
              </label>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={run}
              disabled={pending || current.target === 0 || (mode === "delete" && !confirmDelete)}
              className={mode === "delete" ? DANGER_BUTTON_CLASS : PRIMARY_BUTTON_CLASS}
            >
              {pending ? "処理中…" : MODE_LABEL[mode].run(current.target)}
            </button>
            <button type="button" onClick={() => setMode(null)} disabled={pending} className={GHOST_BUTTON_CLASS}>
              キャンセル
            </button>
            {current.target === 0 && <span className="text-xs text-muted">対象の記事がありません。</span>}
          </div>
        </div>
      )}

      {result.status === "success" && (
        <p role="status" className="text-sm font-semibold text-[#218c68]">
          {result.message}
        </p>
      )}
      {result.status === "error" && (
        <p role="alert" className="text-sm font-semibold text-[#cf4a51]">
          {result.message}
        </p>
      )}
    </div>
  );
}
