"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { GHOST_BUTTON_CLASS, PRIMARY_BUTTON_CLASS } from "@/app/admin/_components/action-ui";
import { classifyLinkUrl, linkTextProblem, toLinkMarkup } from "@/lib/news/inline-links";
import { MAX_RELATED_MEDIA, parseRelatedMediaUrl } from "@/lib/news/related-media";
import { bodyMediaOf, toMediaMarker } from "@/lib/news/body-media";

// 記事本文の入力欄と「リンク」ボタン。
// 本文中の文字を選択 →「リンク」→ URLを貼り付けて「確定」で、選択した文字を [文字](URL) の形にする(生のHTMLは使わない)。
// 公開ページでは選択した文字だけがリンクになる(lib/news/inline-links.ts)。
// 「メディア挿入」は、カーソルの位置に [[media:URL]] の段落(前後を空行で区切る)を入れ、公開ページではその位置に
// Xポスト・YouTube動画を埋め込む(lib/news/body-media.ts)。URL は対応する形かを確かめ、正規化してから入れる。

// 本文入力欄の文字組み(スクロールバーで幅が変わらないよう、内容に合わせて高さを伸ばす)
const BODY_TEXT_CLASS =
  "box-border block w-full border border-line px-3 py-2 text-base font-normal not-italic leading-8 tracking-normal whitespace-pre-wrap break-words [tab-size:4] [word-break:normal] [line-break:auto]";

type Selection = { start: number; end: number };

export function BodyEditor({ name, defaultValue, onChange }: { name: string; defaultValue: string; onChange: (value: string) => void }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const urlRef = useRef<HTMLInputElement>(null);
  // スマホではボタンを押すと選択範囲が外れることがあるため、最後に選択した範囲を覚えておく
  const lastSelection = useRef<Selection>({ start: 0, end: 0 });
  const [pending, setPending] = useState<(Selection & { text: string }) | null>(null);
  const [url, setUrl] = useState("");
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);
  // メディア挿入(入れる位置と、入力中の URL)
  const [mediaAt, setMediaAt] = useState<number | null>(null);
  const [mediaUrl, setMediaUrl] = useState("");
  const mediaUrlRef = useRef<HTMLInputElement>(null);
  const fail = (text: string) => setMessage({ text, error: true });

  // 入力欄はスクロールバーを出さず、内容に合わせて高さを伸ばす(スクロールバーの分だけ幅が狭くなり、
  // 入力中に折り返し位置が変わるのを防ぐ)
  function autosize() {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight + 2}px`; // 上下の枠線(1px×2)の分を足す
  }
  useLayoutEffect(autosize, []);
  useEffect(() => {
    window.addEventListener("resize", autosize);
    return () => window.removeEventListener("resize", autosize);
  }, []);

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
    autosize();
    setPending(null);
    setMessage({
      text: `「${pending.text}」を${link.external ? "外部リンク（別タブで開く）" : "サイト内リンク（同じタブで開く）"}にしました。下のプレビューで確認し、「保存」を押してください。`,
      error: false,
    });
    el.focus();
    el.setSelectionRange(pending.start, pending.start + markup.length);
  }

  function startMedia() {
    const el = ref.current;
    if (!el) return;
    // カーソルの位置(文字を選択している場合はその末尾)の後ろに入れる
    const at = el.selectionStart !== el.selectionEnd || document.activeElement === el ? el.selectionEnd : lastSelection.current.end;
    setPending(null);
    setMessage(null);
    setMediaUrl("");
    setMediaAt(at);
    requestAnimationFrame(() => mediaUrlRef.current?.focus());
  }

  function confirmMedia() {
    const el = ref.current;
    if (!el || mediaAt === null) return;
    const media = parseRelatedMediaUrl(mediaUrl);
    if (!media) {
      fail("Xの公開ポスト（https://x.com/ユーザー名/status/数字）か、YouTubeの動画・Shorts のURLを入力してください。");
      return;
    }
    const existing = bodyMediaOf(el.value);
    if (existing.some((m) => m.url === media.url)) {
      fail("このメディアはすでに本文中に入っています。");
      return;
    }
    if (existing.length >= MAX_RELATED_MEDIA) {
      fail(`本文中のメディアは、関連メディアURLと合わせて${MAX_RELATED_MEDIA}件までです。`);
      return;
    }
    // 前後を空行で区切り、[[media:URL]] だけの段落にする(前後の文章の途中に入った場合も段落を分ける)
    const at = Math.min(mediaAt, el.value.length);
    const before = el.value.slice(0, at).replace(/[ \t]+$/, "");
    const after = el.value.slice(at).replace(/^[ \t]+/, "");
    const lead = before === "" ? "" : before.endsWith("\n\n") ? "" : before.endsWith("\n") ? "\n" : "\n\n";
    const trail = after === "" ? "\n" : after.startsWith("\n\n") ? "" : after.startsWith("\n") ? "\n" : "\n\n";
    const marker = toMediaMarker(media.url);
    el.value = before + lead + marker + trail + after;
    onChange(el.value);
    autosize();
    setMediaAt(null);
    const start = before.length + lead.length;
    setMessage({
      text: `${media.kind === "x" ? "Xポスト" : media.shorts ? "YouTube Shorts" : "YouTube動画"}を本文中に入れました。公開ページではこの位置に表示されます。「保存」を押してください。`,
      error: false,
    });
    el.focus();
    el.setSelectionRange(start, start + marker.length);
  }

  return (
    <div className="grid gap-1 text-[11px] font-bold text-muted">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <label htmlFor="bodyMarkdown">本文（RSS原文の転載はしないでください）</label>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={startLink} className={`${GHOST_BUTTON_CLASS}`} aria-controls="bodyMarkdown">
            🔗 リンク
          </button>
          <button type="button" onClick={startMedia} className={`${GHOST_BUTTON_CLASS}`} aria-controls="bodyMarkdown">
            ▶ メディア挿入
          </button>
        </div>
      </div>
      <textarea
        ref={ref}
        id="bodyMarkdown"
        name={name}
        defaultValue={defaultValue}
        rows={12}
        required
        onChange={(e) => {
          onChange(e.target.value);
          autosize();
        }}
        onSelect={rememberSelection}
        onKeyUp={rememberSelection}
        onMouseUp={rememberSelection}
        onTouchEnd={rememberSelection}
        className={`${BODY_TEXT_CLASS} min-h-[12rem] resize-none overflow-hidden bg-surface text-foreground disabled:opacity-60`}
      />
      <p className="font-normal">
        リンクにしたい文字を選択して「リンク」を押し、URLを貼り付けて確定します。本文には <code>[文字](URL)</code> の形で入り、公開ページでは選択した文字だけがリンクになります。
      </p>
      <p className="font-normal">
        Xポスト・YouTube動画を本文の途中に入れるときは、入れたい位置にカーソルを置いて「メディア挿入」を押し、URLを貼り付けて確定します。本文には{" "}
        <code>[[media:URL]]</code> だけの段落として入り、公開ページではその位置に表示されます（本文中と関連メディアURLを合わせて{MAX_RELATED_MEDIA}件まで）。URLをそのまま書いた行は埋め込みにならず、文字のまま表示されます。
      </p>

      {mediaAt !== null && (
        <div className="mt-1 grid gap-2 border border-blue/40 bg-[#f6f9ff] p-3 font-normal text-foreground dark:bg-white/[.04]">
          <label className="grid gap-1 text-[11px] font-bold text-muted">
            本文中に入れるメディアのURL（Xの公開ポスト、YouTubeの動画・Shorts）
            <input
              ref={mediaUrlRef}
              type="text"
              inputMode="url"
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              onKeyDown={(e) => {
                // 本文フォームの送信(保存)にならないよう、Enterは確定として扱う
                if (e.key === "Enter") {
                  e.preventDefault();
                  confirmMedia();
                }
                if (e.key === "Escape") setMediaAt(null);
              }}
              placeholder="https://x.com/…/status/… または https://www.youtube.com/watch?v=…"
              className="min-w-0 border border-line bg-surface px-3 py-2 text-sm font-normal text-foreground"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={confirmMedia} className={`${PRIMARY_BUTTON_CLASS}`}>
              確定
            </button>
            <button type="button" onClick={() => setMediaAt(null)} className={`${GHOST_BUTTON_CLASS}`}>
              キャンセル
            </button>
          </div>
        </div>
      )}

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
