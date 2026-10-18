"use client";

import { useActionState, useState, type MouseEvent, type ReactNode } from "react";
import Link from "next/link";
import { updateDraftAction, rejectDraftAction } from "../actions";
import { ARTICLE_KIND_OPTIONS, ARTICLE_TYPE_OPTIONS, CATEGORY_OPTIONS } from "@/lib/news/constants";
import {
  INITIAL_ACTION_STATE,
  PRIMARY_BUTTON_CLASS,
  GHOST_BUTTON_CLASS,
  StatusMessage,
} from "@/app/admin/_components/action-ui";
import type { ArticleKind, Database } from "@/lib/supabase/types";
import { BodyEditor } from "./body-editor";
import { MAX_RELATED_MEDIA, parseRelatedMediaUrl } from "@/lib/news/related-media";
import { trailingRelatedMedia } from "@/lib/news/body-media";
import { ARTICLE_PAGE_FRAME_CLASS, NewsArticleView, formatArticleDate, type ArticleViewSource } from "@/components/news/article-view";
import { toJstInputValue, validatePublishedAtInput } from "@/lib/news/jst-datetime";

type ArticleDraft = Database["public"]["Tables"]["article_drafts"]["Row"];

// プレビューに使う入力中の値
type PreviewValues = {
  kind: ArticleKind;
  category: string;
  headline: string;
  dek: string;
  body: string;
  media: string[];
  /** 投稿日(日本時間 "YYYY-MM-DDTHH:mm")。未公開の記事は "" */
  publishedAt: string;
};

function sameValues(a: PreviewValues, b: PreviewValues): boolean {
  return (
    a.kind === b.kind &&
    a.category === b.category &&
    a.headline === b.headline &&
    a.dek === b.dek &&
    a.body === b.body &&
    a.media.join("|") === b.media.join("|") &&
    a.publishedAt === b.publishedAt
  );
}

const CATEGORY_LABEL: Record<string, string> = Object.fromEntries(CATEGORY_OPTIONS.map((o) => [o.value, o.label]));


/** プレビューで公開ページと同じに表示するための、入力欄以外の情報(イベントのカテゴリ・確認状況・原典) */
export type DraftPreviewContext = {
  /** イベントありの記事のカテゴリ(独自コラムは入力中のカテゴリを使うため null) */
  eventCategory: string | null;
  lowConfidence: boolean;
  singleSource: boolean;
  sources: ArticleViewSource[];
};

// 入力欄と、公開ページと同じ表示のプレビュー。編集画面全体を公開ページの本文欄と同じ幅の枠(ARTICLE_PAGE_FRAME_CLASS)に置き、
// プレビューは入力欄のすぐ後に、公開ページと同じ部品(components/news/article-view.tsx)で描く。そのため記事枠の幅・
// 文字の大きさ・行間・段落の余白・改行位置・リンク・本文中メディアの表示が、同じ画面幅の公開ページと一致する。
// 本文の入力欄は編集しやすい文字の大きさ(16px。スマホで入力時に画面が拡大されないため)のままで、公開ページとは見た目が異なる。
// formHeader は入力欄の前に、afterForm はプレビューの後に置く。
export function DraftEditForm({
  draft,
  context,
  formHeader,
  afterForm,
}: {
  draft: ArticleDraft;
  context: DraftPreviewContext;
  formHeader?: ReactNode;
  afterForm?: ReactNode;
}) {
  const [state, formAction, isPending] = useActionState(
    updateDraftAction,
    INITIAL_ACTION_STATE
  );
  const savedMedia = draft.related_media_urls ?? [];
  const initial: PreviewValues = {
    kind: draft.article_kind,
    category: draft.category ?? "other",
    headline: draft.headline_ja,
    dek: draft.dek_ja ?? "",
    body: draft.body_markdown,
    media: Array.from({ length: MAX_RELATED_MEDIA }, (_, i) => savedMedia[i] ?? ""),
    publishedAt: draft.published_at ? toJstInputValue(draft.published_at) : "",
  };
  // 投稿日の入力欄で選べる最も新しい日時(現在の日本時間。未来の日時は選べない)
  const [nowJst] = useState(() => toJstInputValue(new Date().toISOString()));
  const [values, setValues] = useState<PreviewValues>(initial);
  // プレビューに表示する投稿日(入力中の値。正しくない日時の間は null)
  const publishedAtCheck = values.publishedAt ? validatePublishedAtInput(values.publishedAt) : { error: "" };
  const previewPublishedIso = "iso" in publishedAtCheck ? publishedAtCheck.iso : null;
  const [submitted, setSubmitted] = useState<PreviewValues | null>(null);
  const set = (patch: Partial<PreviewValues>) => setValues((v) => ({ ...v, ...patch }));
  // 保存済みの内容と比べて変更があるか(保存に成功したら、そのとき送った内容を基準にする)
  const baseline = state.status === "success" && submitted ? submitted : initial;
  const dirty = !sameValues(values, baseline);

  // プレビューの内部リンクで画面を離れる前に、未保存の変更があれば確認する
  function confirmLeave(e: MouseEvent<HTMLAnchorElement>) {
    if (dirty && !window.confirm("保存していない変更があります。このページを離れると変更は失われます。移動しますか？")) e.preventDefault();
  }

  // 関連メディアURLの入力欄のうち、使える URL(正規化したもの)
  const relatedUrls = values.media.flatMap((u) => {
    const m = u.trim() ? parseRelatedMediaUrl(u) : null;
    return m ? [m.url] : [];
  });
  const categoryValue = draft.event_id === null ? values.category : context.eventCategory;

  return (
    <div className={ARTICLE_PAGE_FRAME_CLASS}>
          {formHeader}
      {/* 本文の入力欄は、公開ページの記事枠と同じ幅・余白の枠に置く(BodyEditor)。そのためフォームは枠の余白の外側で包む */}
      <form action={formAction} onSubmit={() => setSubmitted(values)} className="mb-8 grid grid-cols-1 gap-4">
        <input type="hidden" name="draftId" value={draft.id} />
        <fieldset disabled={isPending} className="contents">
          <section className="grid gap-3 border border-line bg-surface p-6">
            <h2 className="text-lg font-semibold">記事の入力</h2>
          <label className="grid gap-1 text-[11px] font-bold text-muted">
            記事種別（COLUMNは公開ページに「COLUMN」ラベルが付きます）
            <select
              name="articleKind"
              defaultValue={draft.article_kind}
              onChange={(e) => set({ kind: e.target.value as ArticleKind })}
              className="max-w-[200px] border border-line bg-surface px-3 py-2 text-sm text-foreground disabled:opacity-60"
            >
              {ARTICLE_KIND_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          {/* 独自コラム(イベントなし)はカテゴリを下書きに持つため、ここで変更できる */}
          {draft.event_id === null && (
            <label className="grid gap-1 text-[11px] font-bold text-muted">
              カテゴリ（独自コラム）
              <select
                name="category"
                defaultValue={draft.category ?? "other"}
                onChange={(e) => set({ category: e.target.value })}
                required
                className="max-w-[200px] border border-line bg-surface px-3 py-2 text-sm text-foreground disabled:opacity-60"
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="grid gap-1 text-[11px] font-bold text-muted">
            記事形式
            <select
              name="articleType"
              defaultValue={draft.article_type}
              className="max-w-[200px] border border-line bg-surface px-3 py-2 text-sm text-foreground disabled:opacity-60"
            >
              {ARTICLE_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-[11px] font-bold text-muted">
            見出し
            <input
              type="text"
              name="headlineJa"
              defaultValue={draft.headline_ja}
              onChange={(e) => set({ headline: e.target.value })}
              required
              className="border border-line bg-surface px-3 py-2 text-sm text-foreground disabled:opacity-60"
            />
          </label>
          <label className="grid gap-1 text-[11px] font-bold text-muted">
            サブ見出し（任意）
            <input
              type="text"
              name="dekJa"
              defaultValue={draft.dek_ja ?? ""}
              onChange={(e) => set({ dek: e.target.value })}
              className="border border-line bg-surface px-3 py-2 text-sm text-foreground disabled:opacity-60"
            />
          </label>
          {/* 投稿日: 公開済みの記事だけ変更できる(日本時間)。変えずに保存すれば、既存の投稿日をそのまま残す */}
          {draft.published_at ? (
            <div className="grid gap-1 text-[11px] font-bold text-muted">
              <label htmlFor="publishedAtJst">投稿日（日本時間）</label>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  id="publishedAtJst"
                  type="datetime-local"
                  name="publishedAtJst"
                  defaultValue={initial.publishedAt}
                  max={nowJst}
                  min="2000-01-01T00:00"
                  step={60}
                  required
                  onChange={(e) => set({ publishedAt: e.target.value })}
                  className="border border-line bg-surface px-3 py-2 text-sm text-foreground disabled:opacity-60"
                />
                {/* 入力中の値を保存前に確かめる(保存時もサーバーで同じ検証をする) */}
                {"error" in publishedAtCheck ? (
                  <span role="alert" className="text-xs font-bold text-[#cf4a51]">
                    {publishedAtCheck.error}
                  </span>
                ) : (
                  <span className="text-xs font-normal">公開ページの表示：{formatArticleDate(publishedAtCheck.iso)}</span>
                )}
              </div>
              <input type="hidden" name="publishedAtJstOriginal" value={draft.published_at ? toJstInputValue(draft.published_at) : ""} />
              <p className="font-normal">
                ニュース一覧の並び順・記事ページの日付・サイトマップは、この投稿日を基準にします。誤字の修正などで保存しても、ここを変えなければ投稿日は変わりません（未来の日時は指定できません）。
              </p>
            </div>
          ) : (
            <p className="text-[11px] font-bold text-muted">
              投稿日：<span className="font-normal">未公開（公開した時点の日時が投稿日になります）</span>
            </p>
          )}
          </section>
          <BodyEditor name="bodyMarkdown" defaultValue={draft.body_markdown} onChange={(body) => set({ body })} />
          <section className="grid gap-3 border border-line bg-surface p-6">
          <fieldset className="grid min-w-0 gap-1.5">
            <legend className="mb-1 text-[11px] font-bold text-muted">関連メディアURL（X・YouTube・Instagram・TikTok／任意）</legend>
            <p className="text-xs text-muted">
              Xの公開ポスト（x.com / twitter.com の …/status/数字）、YouTubeの動画・Shorts、Instagramの公開投稿・リール（instagram.com/p/… ・ /reel/…）、TikTokの公開動画（tiktok.com/@ユーザー名/video/数字。短縮URLは不可）のURLを登録できます。公開ページでは本文の後に表示します（本文中に「メディア挿入」で入れたものと合わせて{MAX_RELATED_MEDIA}件まで。本文中に入れたものは末尾には重ねて表示しません）。空欄は登録しません。
            </p>
            {values.media.map((_, i) => (
              <input
                key={i}
                type="text"
                name="relatedMediaUrl"
                inputMode="url"
                defaultValue={initial.media[i]}
                onChange={(e) => set({ media: values.media.map((v, j) => (j === i ? e.target.value : v)) })}
                placeholder={i === 0 ? "例：https://x.com/NBA/status/1234567890" : i === 1 ? "例：https://www.youtube.com/watch?v=動画ID" : ""}
                aria-label={`関連メディアURL ${i + 1}件目`}
                className="min-w-0 border border-line bg-surface px-3 py-2 text-sm text-foreground disabled:opacity-60"
              />
            ))}
          </fieldset>
          <label className="grid gap-1 text-[11px] font-bold text-muted">
            出典表記（任意の補足。原典リンクは上のセクションで自動表示されます）
            <textarea
              name="sourceAttributionMarkdown"
              defaultValue={draft.source_attribution_markdown}
              rows={4}
              className="border border-line bg-surface px-3 py-2 font-mono text-sm text-foreground disabled:opacity-60"
            />
          </label>
          <label className="grid gap-1 text-[11px] font-bold text-muted">
            編集メモ（内部用・非公開）
            <textarea
              name="editorNotes"
              defaultValue={draft.editor_notes ?? ""}
              rows={2}
              className="border border-line bg-surface px-3 py-2 text-sm text-foreground disabled:opacity-60"
            />
          </label>
          </section>
        </fieldset>
        {/* 保存ボタンとプレビューへの移動は、長い本文を入力中も画面の下に表示しておく */}
        <div className="sticky bottom-0 z-10 flex flex-wrap items-center gap-3 border border-line bg-surface px-6 py-3">
          <button type="submit" disabled={isPending} className={PRIMARY_BUTTON_CLASS}>
            {isPending ? "保存中…" : "保存"}
          </button>
          <a href="#draft-preview" className="text-sm font-bold text-blue underline underline-offset-4 hover:no-underline">
            公開ページと同じ表示で確認 ↓
          </a>
          {!isPending && <StatusMessage state={state} />}
          {dirty && !isPending && <span className="text-xs font-semibold text-[#8a5a00]">未保存の変更があります</span>}
        </div>
      </form>

          {/* 入力中の内容のプレビュー。公開ページと同じ部品・同じ幅で描く(保存するまで公開ページには反映されない) */}
          <section id="draft-preview" aria-labelledby="draft-preview-heading" className="mb-8 scroll-mt-16">
            <div className="mb-3 border-l-4 border-gold bg-surface px-4 py-3">
              <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[1.3px] text-[#8a5a00] dark:text-gold">Preview</p>
              <h2 id="draft-preview-heading" className="text-lg font-semibold">
                プレビュー（公開ページと同じ表示）
              </h2>
              <p className="mt-1 text-xs leading-6 text-muted">
                下の枠は、公開記事ページと同じ部品・同じ幅・同じ文字組みで、入力中の内容を表示しています（同じ画面幅なら改行位置・段落の間隔も公開ページと一致します）。
                上の本文の入力欄は編集用の表示のため、文字の大きさや改行位置が公開ページとは異なります。「保存」を押すまで公開ページには反映されません。
              </p>
              <a href="#bodyMarkdown" className="mt-1 inline-block text-xs font-bold text-blue underline underline-offset-4 hover:no-underline">
                ↑ 本文の入力欄に戻る
              </a>
            </div>
            <NewsArticleView
              articleKind={values.kind}
              categoryLabel={categoryValue ? (CATEGORY_LABEL[categoryValue] ?? categoryValue) : null}
              lowConfidence={context.lowConfidence}
              singleSource={context.singleSource}
              headline={values.headline}
              dek={values.dek.trim() || null}
              dateLabel={previewPublishedIso ? formatArticleDate(previewPublishedIso) : draft.published_at ? "投稿日を正しく入力してください" : "公開日（公開すると表示されます）"}
              bodyMarkdown={values.body}
              trailingMedia={trailingRelatedMedia(values.body, relatedUrls)}
              sources={context.sources}
              onInternalLinkClick={confirmLeave}
              footer={
                <Link href="/news" onClick={confirmLeave} className="mt-6 inline-block text-sm font-extrabold text-blue">
                  ← News一覧に戻る
                </Link>
              }
            />
          </section>

          {afterForm}
    </div>
  );
}

export function RejectButton({ draftId }: { draftId: string }) {
  const [state, formAction, isPending] = useActionState(
    rejectDraftAction,
    INITIAL_ACTION_STATE
  );

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="draftId" value={draftId} />
      <button type="submit" disabled={isPending} className={GHOST_BUTTON_CLASS}>
        {isPending ? "却下中…" : "却下する"}
      </button>
      {!isPending && <StatusMessage state={state} />}
    </form>
  );
}
