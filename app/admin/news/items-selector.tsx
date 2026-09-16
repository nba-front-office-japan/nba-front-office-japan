"use client";

import { useActionState, useMemo, useState } from "react";
import { createEventFromItemsAction } from "./actions";
import {
  CATEGORY_OPTIONS,
  VERIFICATION_STATUS_OPTIONS,
} from "@/lib/news/constants";
import {
  INITIAL_ACTION_STATE,
  PRIMARY_BUTTON_CLASS,
  StatusMessage,
} from "@/app/admin/_components/action-ui";

export interface SelectableNewsItem {
  id: string;
  title: string;
  canonicalUrl: string;
  authorName: string | null;
  publishedAtLabel: string;
  fetchedAtLabel: string;
  sourceName: string;
  sourceReliability: number;
  status: string;
}

const STATUS_LABEL: Record<string, string> = {
  new: "未処理",
  processed: "イベント化済み",
  ignored: "無視",
  error: "エラー",
};

export function ItemsSelector({ items }: { items: SelectableNewsItem[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [state, formAction, isPending] = useActionState(
    createEventFromItemsAction,
    INITIAL_ACTION_STATE
  );

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const selectedItems = useMemo(
    () => items.filter((item) => selected.has(item.id)),
    [items, selected]
  );

  const defaultHeadline = selectedItems[0]?.title ?? "";
  const defaultReliability = selectedItems.length
    ? Math.round(
        selectedItems.reduce((sum, item) => sum + item.sourceReliability, 0) /
          selectedItems.length
      )
    : 50;

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-line text-left text-[11px] font-bold text-muted">
              <th className="px-3 py-2"></th>
              <th className="px-3 py-2">タイトル</th>
              <th className="px-3 py-2">ソース</th>
              <th className="px-3 py-2">著者</th>
              <th className="px-3 py-2">公開日時</th>
              <th className="px-3 py-2">状態</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-muted">
                  まだ取得したニュースがありません。
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="border-b border-line/60">
                  <td className="px-3 py-2.5">
                    <input
                      type="checkbox"
                      checked={selected.has(item.id)}
                      onChange={() => toggle(item.id)}
                      disabled={isPending}
                      aria-label={`${item.title}を選択`}
                    />
                  </td>
                  <td className="max-w-[320px] px-3 py-2.5">
                    <a
                      href={item.canonicalUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="font-semibold text-blue hover:underline"
                    >
                      {item.title}
                    </a>
                  </td>
                  <td className="px-3 py-2.5 text-muted">{item.sourceName}</td>
                  <td className="px-3 py-2.5 text-muted">{item.authorName ?? "-"}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-muted">
                    {item.publishedAtLabel}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-muted">
                    {STATUS_LABEL[item.status] ?? item.status}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedItems.length > 0 && (
        <form
          action={formAction}
          className="mt-4 grid grid-cols-1 gap-3 border border-line bg-[#eaf1ff] p-4 dark:bg-white/[.06] sm:grid-cols-2"
        >
          {selectedItems.map((item) => (
            <input key={item.id} type="hidden" name="itemIds" value={item.id} />
          ))}
          <fieldset disabled={isPending} className="contents">
            <p className="text-sm font-bold sm:col-span-2">
              {selectedItems.length}件の記事からイベントを作成
            </p>
            <label className="grid gap-1 text-[11px] font-bold text-muted sm:col-span-2">
              内部見出し（英語・管理用、必須）
              <input
                type="text"
                name="headlineEn"
                required
                defaultValue={defaultHeadline}
                key={defaultHeadline}
                className="border border-line bg-surface px-3 py-2 text-sm text-foreground disabled:opacity-60"
              />
            </label>
            <label className="grid gap-1 text-[11px] font-bold text-muted">
              カテゴリ
              <select
                name="category"
                defaultValue="other"
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
                defaultValue="single_source"
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
                defaultValue={50}
                className="border border-line bg-surface px-3 py-2 text-sm text-foreground disabled:opacity-60"
              />
            </label>
            <label className="grid gap-1 text-[11px] font-bold text-muted">
              信頼度（0-100・目安：選択ソースの平均）
              <input
                type="number"
                name="reliabilityScore"
                min={0}
                max={100}
                defaultValue={defaultReliability}
                key={defaultReliability}
                className="border border-line bg-surface px-3 py-2 text-sm text-foreground disabled:opacity-60"
              />
            </label>
          </fieldset>
          <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
            <button type="submit" disabled={isPending} className={PRIMARY_BUTTON_CLASS}>
              {isPending ? "イベントを作成中…" : "選択した記事からイベントを作成"}
            </button>
            {!isPending && <StatusMessage state={state} />}
          </div>
        </form>
      )}
    </div>
  );
}
