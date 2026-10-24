"use client";

import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from "react";
import { GHOST_BUTTON_CLASS, PRIMARY_BUTTON_CLASS } from "@/app/admin/_components/action-ui";
import { classifyLinkUrl, linkTextProblem, toLinkMarkup } from "@/lib/news/inline-links";
import { MAX_RELATED_MEDIA, SUPPORTED_MEDIA_HINT, mediaLabel, parseRelatedMediaUrl, unsupportedMediaReason } from "@/lib/news/related-media";
import { bodyMediaOf, toMediaMarker } from "@/lib/news/body-media";
import { MAX_VIDEO_BYTES, formatMegabytes, looksLikeMp4, toVideoMarker, videoFileProblem } from "@/lib/news/body-video";
import { createVideoUploadUrlAction } from "../video-upload-action";
import { ARTICLE_BODY_TEXT_CLASS } from "@/lib/news/body-typography";
import { isHeadingLine, stripHeading } from "@/lib/news/inline-format";
import { ARTICLE_FRAME_CLASS } from "@/components/news/article-view";

// 記事本文の入力欄と「リンク」ボタン。
// 本文中の文字を選択 →「リンク」→ URLを貼り付けて「確定」で、選択した文字を [文字](URL) の形にする(生のHTMLは使わない)。
// 公開ページでは選択した文字だけがリンクになる(lib/news/inline-links.ts)。
// 「メディア挿入」は、カーソルの位置に [[media:URL]] の段落(前後を空行で区切る)を入れ、公開ページではその位置に
// Xポスト・YouTube動画を埋め込む(lib/news/body-media.ts)。URL は対応する形かを確かめ、正規化してから入れる。
// 「メディア挿入」では MP4 動画のアップロードもできる。ブラウザから Supabase Storage(news-media バケット)へ直接送り、
// カーソルの位置に [[video:公開URL]] の段落を入れる(lib/news/body-video.ts)。MP4・50MB までだけを受け付ける。

// 本文の入力欄は、公開ページの記事枠(components/news/article-view.tsx の article)と同じ枠線・余白の枠の中に、
// 余白・枠線なしで置き、公開ページの本文と同じ文字組み(ARTICLE_BODY_TEXT_CLASS)にする。
// そのため同じ画面幅なら、入力欄の文字の横幅・大きさ・行の高さ・改行・空行(段落の間隔)・折り返し位置が公開ページと一致する。
// (違いが出るのは、入力欄では [文字](URL) や [[media:URL]] の書式がそのまま見える行だけ)

type Selection = { start: number; end: number };

/**
 * 発行されたアップロード用URLへ、MP4 をブラウザから直接送る(進み具合を onProgress に 0〜100 で伝える)。
 * 送り方は supabase-js の uploadToSignedUrl と同じ(PUT・multipart)。種類は video/mp4 として送る
 */
function putVideo(signedUrl: string, file: File, onProgress: (percent: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("cacheControl", "3600");
    form.append("", new Blob([file], { type: "video/mp4" }));
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", signedUrl);
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
    xhr.setRequestHeader("apikey", anonKey);
    xhr.setRequestHeader("authorization", `Bearer ${anonKey}`);
    xhr.setRequestHeader("x-upsert", "false");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.min(100, Math.round((e.loaded / e.total) * 100)));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) return resolve();
      // Storage のエラー(JSON の message)を、分かる範囲で日本語にする
      let detail = "";
      try {
        detail = String(JSON.parse(xhr.responseText)?.message ?? "");
      } catch {
        detail = xhr.responseText.slice(0, 200);
      }
      if (xhr.status === 413 || /size|large/i.test(detail)) return reject(new Error(`動画は1ファイル${formatMegabytes(MAX_VIDEO_BYTES)}までです。`));
      if (xhr.status === 415 || /mime|type/i.test(detail)) return reject(new Error("MP4ファイル（video/mp4）だけアップロードできます。"));
      reject(new Error(`アップロードに失敗しました（${xhr.status}${detail ? `：${detail}` : ""}）。`));
    };
    xhr.onerror = () => reject(new Error("通信に失敗しました。ネットワークを確認して、もう一度お試しください。"));
    xhr.send(form);
  });
}

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
  // MP4 動画のアップロード中のファイル名と進み具合(%)
  const [upload, setUpload] = useState<{ name: string; percent: number } | null>(null);
  const fail = (text: string) => setMessage({ text, error: true });

  // 入力欄はスクロールバーを出さず、内容に合わせて高さを伸ばす(スクロールバーの分だけ幅が狭くなり、
  // 入力中に折り返し位置が変わるのを防ぐ)。高さを測り直す間にページが縮んで画面の位置が動かないよう、スクロール位置を戻す
  function autosize() {
    const el = ref.current;
    if (!el) return;
    const y = window.scrollY;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`; // 入力欄自体には余白・枠線がない
    if (window.scrollY !== y) window.scrollTo(window.scrollX, y);
  }

  // 「リンク」「メディア挿入」「見出し」「太字」の操作の前後で、本文の入力欄の画面上の位置を変えない。
  // 上のボタン列(URLの入力欄・メッセージ)の高さが変わってもページが動かないよう、描画後に差の分だけスクロールし直す
  const viewAnchor = useRef<number | null>(null);
  function keepView() {
    if (ref.current) viewAnchor.current = ref.current.getBoundingClientRect().top;
  }
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || viewAnchor.current === null) return;
    const diff = el.getBoundingClientRect().top - viewAnchor.current;
    viewAnchor.current = null;
    if (Math.abs(diff) >= 1) window.scrollBy(0, diff);
  });

  /** 入力欄の内容を書き換え、指定した範囲を選択した状態にする(画面の位置はそのまま) */
  function replaceBody(next: string, select: Selection) {
    const el = ref.current;
    if (!el) return;
    keepView();
    el.value = next;
    onChange(next);
    autosize();
    el.focus({ preventScroll: true });
    el.setSelectionRange(select.start, select.end);
    lastSelection.current = select;
  }

  /** 書式ボタンを押した時点の本文の選択範囲(入力欄にフォーカスがなければ、最後に選んでいた範囲)。選択がなければ null */
  function currentSelection(): Selection | null {
    const el = ref.current;
    if (!el) return null;
    const range = document.activeElement === el ? { start: el.selectionStart, end: el.selectionEnd } : lastSelection.current;
    return range.start !== range.end ? range : null;
  }

  // 見出し: 選択範囲を含む行の先頭に「## 」を付ける(すべて見出しなら外す)。空行と [[media:URL]] の行には付けない
  function toggleHeading() {
    const el = ref.current;
    const sel = currentSelection();
    keepView();
    if (!el || !sel) {
      fail("本文内で見出しにしたい行（文字）を選択してください。");
      return;
    }
    const v = el.value;
    const lineStart = v.lastIndexOf("\n", sel.start - 1) + 1;
    const endAt = sel.end > sel.start && v[sel.end - 1] === "\n" ? sel.end - 1 : sel.end;
    const nl = v.indexOf("\n", endAt);
    const lineEnd = nl === -1 ? v.length : nl;
    const lines = v.slice(lineStart, lineEnd).split("\n");
    const target = (l: string) => l.trim() !== "" && !/^\[\[(?:media|video):/.test(l.trim());
    const targets = lines.filter(target);
    const allHeading = targets.length > 0 && targets.every(isHeadingLine);
    const next = lines.map((l) => (!target(l) ? l : allHeading ? stripHeading(l) : isHeadingLine(l) ? l : `## ${l}`)).join("\n");
    setPending(null);
    setMediaAt(null);
    replaceBody(v.slice(0, lineStart) + next + v.slice(lineEnd), { start: lineStart, end: lineStart + next.length });
    setMessage({
      text: allHeading ? "見出しを解除しました。" : "見出しにしました（行の先頭に「## 」が付きます）。下のプレビューで確認し、「保存」を押してください。",
      error: false,
    });
  }

  // 太字: 選択した文字を **文字** で囲む(すでに太字なら外す)。1行の中の文字だけ
  function toggleBold() {
    const el = ref.current;
    const sel = currentSelection();
    keepView();
    if (!el || !sel) {
      fail("本文内で太字にしたい文字を選択してください。");
      return;
    }
    const v = el.value;
    const text = v.slice(sel.start, sel.end);
    if (/\n/.test(text)) {
      fail("太字は1行の中の文字だけを選択してください。");
      return;
    }
    setPending(null);
    setMediaAt(null);
    // 選択した文字が ** で囲まれている(選択に ** を含む、または選択のすぐ外側が **)場合は外す
    if (text.length > 4 && text.startsWith("**") && text.endsWith("**")) {
      const inner = text.slice(2, -2);
      replaceBody(v.slice(0, sel.start) + inner + v.slice(sel.end), { start: sel.start, end: sel.start + inner.length });
      setMessage({ text: "太字を解除しました。", error: false });
      return;
    }
    if (v.slice(sel.start - 2, sel.start) === "**" && v.slice(sel.end, sel.end + 2) === "**") {
      replaceBody(v.slice(0, sel.start - 2) + text + v.slice(sel.end + 2), { start: sel.start - 2, end: sel.end - 2 });
      setMessage({ text: "太字を解除しました。", error: false });
      return;
    }
    if (text.includes("*")) {
      fail("選択した文字に「*」が含まれています。太字にする文字だけを選択してください。");
      return;
    }
    // 前後の空白は太字の外に出す
    const lead = text.length - text.trimStart().length;
    const trail = text.length - text.trimEnd().length;
    const core = text.trim();
    if (!core) {
      fail("本文内で太字にしたい文字を選択してください。");
      return;
    }
    const start = sel.start + lead;
    const end = sel.end - trail;
    replaceBody(v.slice(0, start) + `**${core}**` + v.slice(end), { start: start + 2, end: start + 2 + core.length });
    setMessage({ text: "太字にしました（** で囲まれます）。下のプレビューで確認し、「保存」を押してください。", error: false });
  }
  useLayoutEffect(autosize, []);
  useEffect(() => {
    window.addEventListener("resize", autosize);
    return () => window.removeEventListener("resize", autosize);
  }, []);

  // 本文の入力欄での選択範囲(カーソル位置を含む)を、入力欄にフォーカスがある間だけ覚えておく。
  // スマホでボタンを押して入力欄からフォーカスが外れ、選択が解除されても、直前に選んでいた範囲を使えるようにする
  function rememberSelection() {
    const el = ref.current;
    if (el && document.activeElement === el) lastSelection.current = { start: el.selectionStart, end: el.selectionEnd };
  }
  // キーボード・マウス・タッチ以外(選択範囲のつまみの操作など)で変わった選択範囲も覚える
  useEffect(() => {
    document.addEventListener("selectionchange", rememberSelection);
    return () => document.removeEventListener("selectionchange", rememberSelection);
  }, []);

  // 「リンク」「メディア挿入」のボタンを押しても入力欄からフォーカス(と選択範囲)が外れないようにする(クリックは通常どおり動く)
  function keepEditorFocus(e: MouseEvent<HTMLButtonElement>) {
    if (document.activeElement === ref.current) e.preventDefault();
  }

  function startLink() {
    const el = ref.current;
    if (!el) return;
    keepView();
    // 「リンク」を押した時点の本文の選択範囲を使う。入力欄にフォーカスがあればその選択範囲、
    // フォーカスが外れていれば(スマホなど)入力欄で最後に選んでいた範囲。末尾に追加することはしない
    const focused = document.activeElement === el;
    const range = focused ? { start: el.selectionStart, end: el.selectionEnd } : lastSelection.current;
    const sel = range.start !== range.end ? range : null;
    if (!sel) {
      // 公開ページと同じ見た目のプレビュー側で文字を選んでいる場合は、そのことを伝える
      const outside = window.getSelection();
      const inPreview = Boolean(outside && !outside.isCollapsed && outside.anchorNode && document.getElementById("draft-preview")?.contains(outside.anchorNode));
      fail(inPreview ? "プレビューではなく、上の本文の入力欄でリンクにしたい文字を選択してください。" : "本文内でリンクにしたい文字を選択してください。");
      setPending(null);
      return;
    }
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
    requestAnimationFrame(() => urlRef.current?.focus({ preventScroll: true }));
  }

  function confirmLink() {
    const el = ref.current;
    if (!el || !pending) return;
    keepView();
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
    // 選んでいた位置をリンクにし、画面の位置とカーソル(リンクの部分を選択した状態)を保つ
    replaceBody(el.value.slice(0, pending.start) + markup + el.value.slice(pending.end), {
      start: pending.start,
      end: pending.start + markup.length,
    });
    setPending(null);
    setMessage({
      text: `「${pending.text}」を${link.external ? "外部リンク（別タブで開く）" : "サイト内リンク（同じタブで開く）"}にしました。下のプレビューで確認し、「保存」を押してください。`,
      error: false,
    });
  }

  function startMedia() {
    const el = ref.current;
    if (!el) return;
    keepView();
    // カーソルの位置(文字を選択している場合はその末尾)の後ろに入れる
    const at = el.selectionStart !== el.selectionEnd || document.activeElement === el ? el.selectionEnd : lastSelection.current.end;
    setPending(null);
    setMessage(null);
    setMediaUrl("");
    setMediaAt(at);
    requestAnimationFrame(() => mediaUrlRef.current?.focus({ preventScroll: true }));
  }

  function confirmMedia() {
    const el = ref.current;
    if (!el || mediaAt === null) return;
    keepView();
    const media = parseRelatedMediaUrl(mediaUrl);
    if (!media) {
      fail(unsupportedMediaReason(mediaUrl) ?? SUPPORTED_MEDIA_HINT);
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
    insertBlockAt(toMediaMarker(media.url), mediaAt);
    setMediaAt(null);
    setMessage({
      text: `${mediaLabel(media)}を本文中に入れました。公開ページではこの位置に表示されます。「保存」を押してください。`,
      error: false,
    });
  }

  /** 前後を空行で区切り、marker([[media:URL]] / [[video:URL]])だけの段落にして at の位置に入れる(文章の途中に入った場合も段落を分ける) */
  function insertBlockAt(marker: string, position: number) {
    const el = ref.current;
    if (!el) return;
    const at = Math.min(position, el.value.length);
    const before = el.value.slice(0, at).replace(/[ \t]+$/, "");
    const after = el.value.slice(at).replace(/^[ \t]+/, "");
    const lead = before === "" ? "" : before.endsWith("\n\n") ? "" : before.endsWith("\n") ? "\n" : "\n\n";
    const trail = after === "" ? "\n" : after.startsWith("\n\n") ? "" : after.startsWith("\n") ? "\n" : "\n\n";
    const start = before.length + lead.length;
    replaceBody(before + lead + marker + trail + after, { start, end: start + marker.length });
  }

  // MP4 動画: ファイルを確かめ(MP4・50MBまで・中身がMP4の形)、アップロード用URLを発行してもらって直接送り、
  // 送り終わったら「メディア挿入」を押した位置に [[video:公開URL]] の段落を入れる
  async function uploadVideo(file: File) {
    if (mediaAt === null || upload) return;
    keepView();
    const problem = videoFileProblem(file);
    if (problem) {
      fail(problem);
      return;
    }
    const head = new Uint8Array(await file.slice(0, 12).arrayBuffer());
    if (!looksLikeMp4(head)) {
      fail(`「${file.name}」はMP4の形式ではありません（拡張子だけが .mp4 の別の形式の可能性があります）。MP4に変換してからアップロードしてください。`);
      return;
    }
    setMessage(null);
    setUpload({ name: file.name, percent: 0 });
    try {
      const ticket = await createVideoUploadUrlAction({ name: file.name, type: file.type, size: file.size });
      if (!ticket.ok) throw new Error(ticket.message);
      await putVideo(ticket.signedUrl, file, (percent) => setUpload({ name: file.name, percent }));
      insertBlockAt(toVideoMarker(ticket.publicUrl), mediaAt);
      setMediaAt(null);
      setMessage({
        text: `動画「${file.name}」（${formatMegabytes(file.size)}）をアップロードし、本文中に入れました。公開ページではこの位置に表示されます。「保存」を押してください。`,
        error: false,
      });
    } catch (e) {
      fail(e instanceof Error ? e.message : "アップロードに失敗しました。もう一度お試しください。");
    } finally {
      setUpload(null);
    }
  }

  return (
    <div className="grid gap-2">
      {/* ボタン・説明・URL入力は、長い本文を入力中も上に表示しておく */}
      {/* 管理画面の上部ナビ(高さ top-12)の下に固定する */}
      <div className="sticky top-12 z-10 grid gap-1 border border-line bg-surface p-4 text-[11px] font-bold text-muted sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <label htmlFor="bodyMarkdown">本文（公開ページと同じ幅・文字組みで表示。RSS原文の転載はしないでください）</label>
          <div className="flex flex-wrap gap-2">
            <button type="button" onMouseDown={keepEditorFocus} onClick={toggleHeading} className={`${GHOST_BUTTON_CLASS}`} aria-controls="bodyMarkdown" title="選択した行を見出しにする（もう一度押すと解除）">
              見出し
            </button>
            <button type="button" onMouseDown={keepEditorFocus} onClick={toggleBold} className={`${GHOST_BUTTON_CLASS}`} aria-controls="bodyMarkdown" title="選択した文字を太字にする（もう一度押すと解除）">
              <b>太字</b>
            </button>
            <button type="button" onMouseDown={keepEditorFocus} onClick={startLink} className={`${GHOST_BUTTON_CLASS}`} aria-controls="bodyMarkdown">
              🔗 リンク
            </button>
            <button type="button" onMouseDown={keepEditorFocus} onClick={startMedia} className={`${GHOST_BUTTON_CLASS}`} aria-controls="bodyMarkdown">
              ▶ メディア挿入
            </button>
          </div>
        </div>
        <details id="body-editor-help" className="font-normal">
          <summary className="cursor-pointer font-bold">使い方（見出し・太字・リンク・メディア挿入）</summary>
          <p className="font-normal">
            見出しにしたい行（または行の中の文字）を選択して「見出し」を押すと、行の先頭に <code>## </code> が付き、公開ページでは見出しとして表示されます。太字にしたい文字を選択して「太字」を押すと <code>**文字**</code> の形になり、公開ページでは太字になります。どちらももう一度押すと解除できます。
          </p>
          <p className="font-normal">
            リンクにしたい文字を選択して「リンク」を押し、URLを貼り付けて確定します。本文には <code>[文字](URL)</code> の形で入り、公開ページでは選択した文字だけがリンクになります。
          </p>
          <p className="font-normal">
            Xポスト・YouTube動画・Instagram投稿／リール・TikTok動画を本文の途中に入れるときは、入れたい位置にカーソルを置いて「メディア挿入」を押し、URLを貼り付けて確定します。本文には{" "}
            <code>[[media:URL]]</code> だけの段落として入り、公開ページではその位置に表示されます（本文中と関連メディアURLを合わせて{MAX_RELATED_MEDIA}件まで）。URLをそのまま書いた行は埋め込みにならず、文字のまま表示されます。
          </p>
          <p className="font-normal">
            MP4動画は「メディア挿入」の「またはMP4動画をアップロード」でファイルを選ぶと、アップロードして入れたい位置に{" "}
            <code>[[video:URL]]</code> だけの段落として入ります（.mp4のみ・1ファイル{formatMegabytes(MAX_VIDEO_BYTES).replace(".0", "")}まで。埋め込みの件数には数えません）。公開ページでは再生・音量・全画面の操作ができる動画として表示されます。
          </p>
        </details>

        {mediaAt !== null && (
          <div className="mt-1 grid gap-2 border border-blue/40 bg-[#f6f9ff] p-3 font-normal text-foreground dark:bg-white/[.04]">
            <label className="grid gap-1 text-[11px] font-bold text-muted">
              本文中に入れるメディアのURL（Xの公開ポスト、YouTubeの動画・Shorts、Instagramの公開投稿・リール、TikTokの公開動画）
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
                placeholder="x.com/…/status/… ・ youtube.com/… ・ instagram.com/p/… ・ tiktok.com/@…/video/…"
                className="min-w-0 border border-line bg-surface px-3 py-2 text-sm font-normal text-foreground"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={confirmMedia} disabled={upload !== null} className={`${PRIMARY_BUTTON_CLASS}`}>
                確定
              </button>
              <button type="button" onClick={() => setMediaAt(null)} disabled={upload !== null} className={`${GHOST_BUTTON_CLASS}`}>
                キャンセル
              </button>
            </div>
            {/* MP4 動画のアップロード(選ぶとすぐにアップロードし、終わったら「メディア挿入」を押した位置に入れる) */}
            <div className="grid gap-1 border-t border-line pt-2">
              <label htmlFor="body-video-file" className="text-[11px] font-bold text-muted">
                またはMP4動画をアップロード（.mp4のみ・1ファイル{formatMegabytes(MAX_VIDEO_BYTES).replace(".0", "")}まで）
              </label>
              <input
                id="body-video-file"
                type="file"
                accept="video/mp4,.mp4"
                disabled={upload !== null}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  // 同じファイルを選び直しても反応するよう、選択はすぐに空に戻す
                  e.target.value = "";
                  if (file) void uploadVideo(file);
                }}
                className="min-w-0 text-xs text-foreground file:mr-3 file:min-h-9 file:cursor-pointer file:border file:border-line file:bg-surface file:px-3 file:text-xs file:font-bold file:text-blue disabled:opacity-60"
              />
              {upload && (
                <div role="status" aria-live="polite" className="grid gap-1">
                  <p className="text-xs font-semibold text-foreground">
                    アップロード中：{upload.name}（{upload.percent}%）
                  </p>
                  <div className="h-1.5 w-full bg-line">
                    <div className="h-full bg-blue transition-[width]" style={{ width: `${upload.percent}%` }} />
                  </div>
                </div>
              )}
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
      {/* 公開ページの記事枠と同じ枠・余白(フォーカス中は枠の外側に線を表示。線は幅に影響しない) */}
      <div className={`${ARTICLE_FRAME_CLASS} focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-blue`}>
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
          aria-describedby="body-editor-help"
          className={`${ARTICLE_BODY_TEXT_CLASS} box-border block min-h-[12rem] w-full scroll-mt-44 resize-none overflow-hidden border-0 bg-transparent p-0 text-foreground/90 outline-none disabled:opacity-60`}
        />
      </div>
    </div>
  );
}
