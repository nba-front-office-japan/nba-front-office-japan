"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DANGER_BUTTON_CLASS, GHOST_BUTTON_CLASS, StatusMessage, type ActionState } from "@/app/admin/_components/action-ui";
import { deleteAnnouncementAction, setAnnouncementPublishedAction } from "./actions";

const SMALL = "px-3 py-1.5 text-xs";

// お知らせ一覧の1行の操作(公開/非公開の切り替え・削除)。削除は確認してから行う(元に戻せない)。
export function AnnouncementRowActions({ id, title, published }: { id: string; title: string; published: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<ActionState>({ status: "idle" });

  // afterSuccess: 成功したあとに移る URL(削除したときは一覧へ)。なければ今の画面を読み込み直す
  function run(task: () => Promise<ActionState>, afterSuccess?: string) {
    startTransition(async () => {
      const result = await task();
      setState(result);
      if (result.status !== "success") return;
      if (afterSuccess) router.push(afterSuccess);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => run(() => setAnnouncementPublishedAction(id, !published))}
        className={`${GHOST_BUTTON_CLASS} ${SMALL}`}
      >
        {published ? "非公開にする" : "公開する"}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (window.confirm(`お知らせ「${title}」を削除します。元に戻せません。よろしいですか？`)) run(() => deleteAnnouncementAction(id), "/admin/announcements");
        }}
        className={`${DANGER_BUTTON_CLASS} ${SMALL}`}
      >
        削除
      </button>
      <StatusMessage state={state} />
    </div>
  );
}
