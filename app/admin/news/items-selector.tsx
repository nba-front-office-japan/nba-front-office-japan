"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { createEventFromItemsAction } from "./actions";
import { BulkActions } from "./bulk-actions";
import {
  CATEGORY_OPTIONS,
  VERIFICATION_STATUS_OPTIONS,
} from "@/lib/news/constants";
import {
  PROCESSING_STAGE_LABEL,
  PROCESSING_STAGE_BADGE_CLASS,
  type ProcessingStage,
} from "@/lib/news/processing-stage";
import {
  INITIAL_ACTION_STATE,
  PRIMARY_BUTTON_CLASS,
  LINK_CLASS,
  StatusMessage,
} from "@/app/admin/_components/action-ui";

export interface SelectableNewsItem {
  id: string;
  title: string;
  canonicalUrl: string;
  authorName: string | null;
  publishedAtLabel: string;
  fetchedAtLabel: string;
  fetchedAt: string | null;
  sourceName: string;
  sourceReliability: number;
  status: string;
  stage: ProcessingStage;
  eventId: string | null;
  eventHeadline: string | null;
}

type DateFilter = "all" | "today" | "7days" | "30days" | "custom";
type StageFilter = "all" | ProcessingStage;
type VisibilityFilter = "visible" | "hidden" | "all";

const DATE_FILTER_OPTIONS: { value: DateFilter; label: string }[] = [
  { value: "all", label: "すべて" },
  { value: "today", label: "今日" },
  { value: "7days", label: "過去7日" },
  { value: "30days", label: "過去30日" },
  { value: "custom", label: "期間を指定" },
];

const VISIBILITY_OPTIONS: { value: VisibilityFilter; label: string }[] = [
  { value: "visible", label: "通常（非掲載を除く）" },
  { value: "hidden", label: "非掲載のみ" },
  { value: "all", label: "すべて" },
];

/** 取得日時の日本時間の日付(YYYY-MM-DD) */
function jstDate(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));
}

function isHidden(item: SelectableNewsItem): boolean {
  return item.status === "ignored";
}

const STAGE_FILTER_OPTIONS: { value: StageFilter; label: string }[] = [
  { value: "unprocessed", label: "未処理" },
  { value: "all", label: "すべて" },
  { value: "event_created", label: "イベント作成済み" },
  { value: "draft_created", label: "下書き作成済み" },
  { value: "published", label: "公開済み" },
];

function isWithinDateFilter(fetchedAt: string | null, filter: DateFilter, from: string, to: string): boolean {
  if (filter === "all" || !fetchedAt) return filter === "all";
  if (filter === "custom") {
    const d = jstDate(fetchedAt);
    return (from === "" || d >= from) && (to === "" || d <= to);
  }
  const diffDays = (Date.now() - new Date(fetchedAt).getTime()) / (1000 * 60 * 60 * 24);
  if (filter === "today") return diffDays <= 1;
  if (filter === "7days") return diffDays <= 7;
  return diffDays <= 30;
}

export function ItemsSelector({ items }: { items: SelectableNewsItem[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [stageFilter, setStageFilter] = useState<StageFilter>("unprocessed");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [visibility, setVisibility] = useState<VisibilityFilter>("visible");
  const [keyword, setKeyword] = useState("");

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

  const sourceNames = useMemo(
    () => [...new Set(items.map((item) => item.sourceName))].sort(),
    [items]
  );

  const filteredItems = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return items.filter((item) => {
      if (visibility === "visible" && isHidden(item)) return false;
      if (visibility === "hidden" && !isHidden(item)) return false;
      if (stageFilter !== "all" && item.stage !== stageFilter) return false;
      if (sourceFilter !== "all" && item.sourceName !== sourceFilter) return false;
      if (!isWithinDateFilter(item.fetchedAt, dateFilter, dateFrom, dateTo)) return false;
      if (kw && !`${item.title} ${item.authorName ?? ""}`.toLowerCase().includes(kw)) return false;
      return true;
    });
  }, [items, visibility, stageFilter, sourceFilter, dateFilter, dateFrom, dateTo, keyword]);

  const allFilteredSelected = filteredItems.length > 0 && filteredItems.every((item) => selected.has(item.id));
  function toggleAllFiltered() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) for (const item of filteredItems) next.delete(item.id);
      else for (const item of filteredItems) next.add(item.id);
      return next;
    });
  }

  // 選択状態は絞り込み前の全件(items)から算出する。フィルター操作で表示が
  // 変わっても、既に選択した記事が失われないようにするため。
  const selectedItems = useMemo(
    () => items.filter((item) => selected.has(item.id)),
    [items, selected]
  );

  const selectedHiddenCount = selectedItems.filter(isHidden).length;
  const defaultHeadline = selectedItems[0]?.title ?? "";
  const defaultReliability = selectedItems.length
    ? Math.round(
        selectedItems.reduce((sum, item) => sum + item.sourceReliability, 0) /
          selectedItems.length
      )
    : 50;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end gap-3 border border-line bg-surface p-4">
        <label className="grid gap-1 text-[11px] font-bold text-muted">
          表示
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as VisibilityFilter)}
            className="min-w-[160px] border border-line bg-surface px-3 py-2 text-sm text-foreground"
          >
            {VISIBILITY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-[11px] font-bold text-muted">
          処理状況
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value as StageFilter)}
            className="min-w-[140px] border border-line bg-surface px-3 py-2 text-sm text-foreground"
          >
            {STAGE_FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-[11px] font-bold text-muted">
          媒体
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="min-w-[140px] border border-line bg-surface px-3 py-2 text-sm text-foreground"
          >
            <option value="all">すべて</option>
            {sourceNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-[11px] font-bold text-muted">
          取得日
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as DateFilter)}
            className="min-w-[120px] border border-line bg-surface px-3 py-2 text-sm text-foreground"
          >
            {DATE_FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        {dateFilter === "custom" && (
          <>
            <label className="grid gap-1 text-[11px] font-bold text-muted">
              開始日（日本時間）
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="border border-line bg-surface px-3 py-2 text-sm text-foreground"
              />
            </label>
            <label className="grid gap-1 text-[11px] font-bold text-muted">
              終了日（日本時間）
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="border border-line bg-surface px-3 py-2 text-sm text-foreground"
              />
            </label>
          </>
        )}
        <label className="grid min-w-[160px] flex-1 gap-1 text-[11px] font-bold text-muted">
          キーワード
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="タイトル・著者で検索"
            className="border border-line bg-surface px-3 py-2 text-sm text-foreground"
          />
        </label>
      </div>

      <p className="mb-2 text-xs text-muted">
        {filteredItems.length}件表示中（全{items.length}件、うち非掲載 {items.filter(isHidden).length}件） ・ 選択中 {selectedItems.length}件
        {selectedItems.length > 0 && (
          <button type="button" onClick={() => setSelected(new Set())} className={`ml-2 ${LINK_CLASS}`}>
            選択を解除
          </button>
        )}
      </p>

      {selectedItems.length > 0 && (
        <BulkActions
          selectedItems={selectedItems.map((item) => ({ id: item.id, isHidden: isHidden(item), eventId: item.eventId }))}
          onDone={() => setSelected(new Set())}
        />
      )}
      <p className="mb-2 text-xs text-muted sm:hidden">→ 横にスクロールできます</p>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-line text-left text-[11px] font-bold text-muted">
              <th className="px-3 py-2">
                <input
                  type="checkbox"
                  checked={allFilteredSelected}
                  onChange={toggleAllFiltered}
                  disabled={isPending || filteredItems.length === 0}
                  aria-label="表示中の記事をすべて選択"
                  title="表示中の記事をすべて選択"
                />
              </th>
              <th className="px-3 py-2">タイトル</th>
              <th className="px-3 py-2">媒体</th>
              <th className="px-3 py-2">著者</th>
              <th className="px-3 py-2">取得日時</th>
              <th className="px-3 py-2">処理状況</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-muted">
                  {items.length === 0
                    ? "まだ取得したニュースがありません。"
                    : "条件に一致する記事がありません。"}
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => (
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
                  <td className="max-w-[280px] px-3 py-2.5">
                    <a
                      href={item.canonicalUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className={LINK_CLASS}
                    >
                      {item.title}
                    </a>
                  </td>
                  <td className="px-3 py-2.5 text-muted">{item.sourceName}</td>
                  <td className="px-3 py-2.5 text-muted">{item.authorName ?? "-"}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-muted">
                    {item.fetchedAtLabel}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5">
                    {isHidden(item) ? (
                      <span className="inline-block border border-line px-2 py-1 text-[11px] font-bold text-muted">非掲載</span>
                    ) : (
                      <span
                        className={`inline-block px-2 py-1 text-[11px] font-bold ${PROCESSING_STAGE_BADGE_CLASS[item.stage]}`}
                      >
                        {PROCESSING_STAGE_LABEL[item.stage]}
                      </span>
                    )}
                    {item.eventId && item.eventHeadline && (
                      <Link
                        href={`/admin/news/events/${item.eventId}`}
                        className={`mt-1 block max-w-[200px] truncate text-[11px] ${LINK_CLASS}`}
                        title={item.eventHeadline}
                      >
                        → {item.eventHeadline}
                      </Link>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedItems.length > 0 && selectedHiddenCount > 0 && (
        <p className="mt-4 border border-line bg-surface px-4 py-3 text-sm text-muted">
          非掲載の記事が{selectedHiddenCount}件選択されているため、イベントは作成できません。非掲載を解除するか、選択から外してください。
        </p>
      )}

      {selectedItems.length > 0 && selectedHiddenCount === 0 && (
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
