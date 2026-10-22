"use client";

import { useActionState } from "react";
import { ANNOUNCEMENT_BODY_MAX, ANNOUNCEMENT_TITLE_MAX, type Announcement } from "@/lib/announcements";
import { INITIAL_ACTION_STATE, PRIMARY_BUTTON_CLASS, StatusMessage, type ActionState } from "@/app/admin/_components/action-ui";

const FIELD = "w-full min-w-0 border border-line bg-surface px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue";

// お知らせの作成・編集フォーム(タイトル・本文・投稿日・公開する)。本文は入力したとおり(改行も含めて)表示する。
export function AnnouncementForm({
  action,
  announcement,
  defaultPostedOn,
  submitLabel,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  announcement?: Announcement;
  defaultPostedOn: string;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, INITIAL_ACTION_STATE);

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label htmlFor="announcement-title" className="mb-1 block text-sm font-bold">
          タイトル
        </label>
        <input
          id="announcement-title"
          name="title"
          required
          maxLength={ANNOUNCEMENT_TITLE_MAX}
          defaultValue={announcement?.title ?? ""}
          className={FIELD}
        />
      </div>
      <div>
        <label htmlFor="announcement-posted-on" className="mb-1 block text-sm font-bold">
          投稿日
        </label>
        <input
          id="announcement-posted-on"
          name="posted_on"
          type="date"
          required
          defaultValue={announcement?.posted_on ?? defaultPostedOn}
          className={`${FIELD} sm:w-56`}
        />
        <p className="mt-1 text-xs text-muted">公開ページでは、この日付を新しい順に並べて表示します。</p>
      </div>
      <div>
        <label htmlFor="announcement-body" className="mb-1 block text-sm font-bold">
          本文
        </label>
        <textarea
          id="announcement-body"
          name="body"
          required
          rows={10}
          maxLength={ANNOUNCEMENT_BODY_MAX}
          defaultValue={announcement?.body ?? ""}
          className={`${FIELD} leading-7`}
        />
        <p className="mt-1 text-xs text-muted">入力したとおり（改行を含めて）表示します。トップページには先頭の一部を抜粋して表示します。</p>
      </div>
      <label className="flex items-center gap-2 text-sm font-bold">
        <input type="checkbox" name="is_published" defaultChecked={announcement?.is_published ?? false} className="h-4 w-4" />
        公開する（チェックしない場合は非公開で保存し、公開サイトには表示しません）
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className={`${PRIMARY_BUTTON_CLASS} w-full sm:w-auto`}>
          {pending ? "保存中…" : submitLabel}
        </button>
        <StatusMessage state={state} />
      </div>
    </form>
  );
}
