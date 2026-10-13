"use client";

import { useState } from "react";
import Link from "next/link";
import { LINK_CLASS } from "@/app/admin/_components/action-ui";

// 却下した下書きを確認・選択するための一覧。削除などの操作は一切しない。
// 選んだ下書きの見出し・ID を一覧にしてコピーできるようにする(削除する対象を指定するときに使う)。

export type RejectedDraftRow = { id: string; headline: string; createdAtLabel: string; source: string };

export function RejectedDraftsSelector({ drafts }: { drafts: RejectedDraftRow[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);
  const allSelected = drafts.length > 0 && selected.size === drafts.length;
  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const picked = drafts.filter((d) => selected.has(d.id));
  const summary = picked.map((d) => `${d.headline}（作成 ${d.createdAtLabel}）ID: ${d.id}`).join("\n");

  async function copy() {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  if (drafts.length === 0) {
    return <p className="text-sm text-muted">却下した下書きはありません。</p>;
  }

  return (
    <div>
      <p className="mb-3 text-xs leading-6 text-muted">
        却下した下書きを確認・選択するための一覧です。この画面から削除はできません。削除したい下書きは、選んで「選択した下書きの一覧」をコピーし、対象として伝えてください。
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-line text-left text-[11px] font-bold text-muted">
              <th className="w-10 px-3 py-2">
                <input
                  type="checkbox"
                  aria-label="すべて選択"
                  checked={allSelected}
                  onChange={() => setSelected(allSelected ? new Set() : new Set(drafts.map((d) => d.id)))}
                />
              </th>
              <th className="px-3 py-2">見出し</th>
              <th className="px-3 py-2">種別</th>
              <th className="px-3 py-2">作成日時</th>
              <th className="px-3 py-2">ID</th>
            </tr>
          </thead>
          <tbody>
            {drafts.map((d) => (
              <tr key={d.id} className={`border-b border-line/60 ${selected.has(d.id) ? "bg-[#eaf1ff] dark:bg-white/[.06]" : ""}`}>
                <td className="px-3 py-2.5">
                  <input type="checkbox" aria-label={`${d.headline} を選択`} checked={selected.has(d.id)} onChange={() => toggle(d.id)} />
                </td>
                <td className="max-w-[240px] px-3 py-2.5">
                  <Link href={`/admin/news/drafts/${d.id}`} className={LINK_CLASS}>
                    {d.headline}
                  </Link>
                </td>
                <td className="px-3 py-2.5 text-muted">{d.source}</td>
                <td className="whitespace-nowrap px-3 py-2.5 text-muted">{d.createdAtLabel}</td>
                <td className="px-3 py-2.5 font-mono text-xs text-muted [word-break:break-all]">{d.id}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 border border-line p-4">
        <p className="mb-2 text-sm font-bold">選択した下書きの一覧（{picked.length}件）</p>
        {picked.length === 0 ? (
          <p className="text-xs text-muted">チェックを入れると、ここに見出し・作成日時・ID が表示されます。</p>
        ) : (
          <>
            <textarea
              readOnly
              value={summary}
              rows={Math.min(6, picked.length + 1)}
              aria-label="選択した下書きの一覧"
              className="w-full min-w-0 border border-line bg-surface px-3 py-2 font-mono text-xs text-foreground"
            />
            <button type="button" onClick={copy} className="mt-2 border border-line px-3 py-1.5 text-sm font-bold hover:border-blue">
              {copied ? "コピーしました" : "一覧をコピー"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
