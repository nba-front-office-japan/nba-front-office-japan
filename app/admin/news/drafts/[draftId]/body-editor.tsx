"use client";

import { useRef, useState } from "react";
import { GHOST_BUTTON_CLASS, PRIMARY_BUTTON_CLASS } from "@/app/admin/_components/action-ui";
import { classifyLinkUrl, linkTextProblem, toLinkMarkup } from "@/lib/news/inline-links";

// 記事本文の入力欄と「リンク」ボタン。
// 本文中の文字を選択 →「リンク」→ URLを貼り付けて「確定」で、選択した文字を [文字](URL) の形にする(生のHTMLは使わない)。
// 公開ページでは選択した文字だけがリンクになる(lib/news/inline-links.ts)。

type Selection = { start: number; end: number };

export function BodyEditor({ name, defaultValue, onChange }: { name: string; defaultValue: string; onChange: (value: string) => void }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const urlRef = useRef<HTMLInputElement>(null);
  // スマホではボタンを押すと選択範囲が外れることがあるため、最後に選択した範囲を覚えておく
  const lastSelection = useRef<Selection>({ start: 0, end: 0 });
  const [pending, setPending] = useState<(Selection & { text: string }) | null>(null);
  const [url, setUrl] = useState("");
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);
  const fail = (text: string) => setMessage({ text, error: true });

  function rememberSelection() {
    const el = ref.current;
    if (el) lastSelection.current = { start: el.selectionStart, end: el.selectionEnd };
  }

  function startLink() {
    const el = ref.current;
    if (!el) return;
    const sel = el.selectionStart !== el.selectionEnd ? { start: el.selectionStart, end: el.selectionEnd } : lastSelection.current;
    const text = el.value.slice(sel.start, sel.end);
    const problem = linkTextProblem(text);
    if (problem) {
      fail(problem);
      setPending(null);
      return;
    }
    setMessage(null);
    setUrl("");
    setPending({ ...sel, text });
    requestAnimationFrame(() => urlRef.current?.focus());
  }

  function confirmLink() {
    const el = ref.current;
    if (!el || !pending) return;
    const link = classifyLinkUrl(url);
    if (!link) {
      fail("URLは「/」で始まるサイト内のパス（例: /guide/salary-cap）か、https:// で始まるURLを入力してください。");
      return;
    }
    // 確定までに本文が変わっていないか確認する
    if (el.value.slice(pending.start, pending.end) !== pending.text) {
      fail("選択した後に本文が変わったため、もう一度文字を選択してから「リンク」を押してください。");
      setPending(null);
      return;
    }
    const markup = toLinkMarkup(pending.text, url.trim());
    el.value = el.value.slice(0, pending.start) + markup + el.value.slice(pending.end);
    onChange(el.value);
    setPending(null);
    setMessage({
      text: `「${pending.text}」を${link.external ? "外部リンク（別タブで開く）" : "サイト内リンク（同じタブで開く）"}にしました。下のプレビューで確認し、「保存」を押してください。`,
      error: false,
    });
    el.focus();
    el.setSelectionRange(pending.start, pending.start + markup.length);
  }

  return (
    <div className="grid gap-1 text-[11px] font-bold text-muted">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <label htmlFor="bodyMarkdown">本文（RSS原文の転載はしないでください）</label>
        <button type="button" onClick={startLink} className={`${GHOST_BUTTON_CLASS}`} aria-controls="bodyMarkdown">
          🔗 リンク
        </button>
      </div>
      <textarea
        ref={ref}
        id="bodyMarkdown"
        name={name}
        defaultValue={defaultValue}
        rows={12}
        required
        onChange={(e) => onChange(e.target.value)}
        onSelect={rememberSelection}
        onKeyUp={rememberSelection}
        onMouseUp={rememberSelection}
        onTouchEnd={rememberSelection}
        className="border border-line bg-surface px-3 py-2 font-mono text-sm font-normal text-foreground disabled:opacity-60"
      />
      <p className="font-normal">
        リンクにしたい文字を選択して「リンク」を押し、URLを貼り付けて確定します。本文には <code>[文字](URL)</code> の形で入り、公開ページでは選択した文字だけがリンクになります。
      </p>

      {pending && (
        <div className="mt-1 grid gap-2 border border-blue/40 bg-[#f6f9ff] p-3 font-normal text-foreground dark:bg-white/[.04]">
          <p className="text-xs">
            リンクにする文字：<b className="break-all">{pending.text}</b>
          </p>
          <label className="grid gap-1 text-[11px] font-bold text-muted">
            URL（サイト内は /guide/… のようなパス、外部は https://…）
            <input
              ref={urlRef}
              type="text"
              inputMode="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                // 本文フォームの送信(保存)にならないよう、Enterは確定として扱う
                if (e.key === "Enter") {
                  e.preventDefault();
                  confirmLink();
                }
                if (e.key === "Escape") setPending(null);
              }}
              placeholder="https://… または /guide/…"
              className="border border-line bg-surface px-3 py-2 text-sm font-normal text-foreground"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={confirmLink} className={`${PRIMARY_BUTTON_CLASS}`}>
              確定
            </button>
            <button type="button" onClick={() => setPending(null)} className={`${GHOST_BUTTON_CLASS}`}>
              キャンセル
            </button>
          </div>
        </div>
      )}
      {message && (
        <p role={message.error ? "alert" : "status"} aria-live="polite" className={`text-xs font-semibold ${message.error ? "text-[#cf4a51]" : "text-[#218c68]"}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
