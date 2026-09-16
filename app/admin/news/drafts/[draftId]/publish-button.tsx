"use client";

import { useState } from "react";
import { publishDraftAction } from "../actions";

export function PublishButton({ draftId }: { draftId: string }) {
  const [armed, setArmed] = useState(false);

  if (!armed) {
    return (
      <button
        type="button"
        onClick={() => setArmed(true)}
        className="bg-gold px-4 py-2 text-sm font-extrabold text-[#182238]"
      >
        公開する
      </button>
    );
  }

  return (
    <form action={publishDraftAction} className="flex items-center gap-3">
      <input type="hidden" name="draftId" value={draftId} />
      <span className="text-sm font-bold text-[#cf4a51]">
        本当に公開しますか？公開後は一般ページに表示されます。
      </span>
      <button
        type="submit"
        className="bg-[#cf4a51] px-4 py-2 text-sm font-extrabold text-white"
      >
        はい、公開する
      </button>
      <button
        type="button"
        onClick={() => setArmed(false)}
        className="border border-line px-4 py-2 text-sm font-bold"
      >
        キャンセル
      </button>
    </form>
  );
}
