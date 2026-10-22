"use client";

import { useActionState } from "react";
import type { ImportIssue } from "@/lib/games/box-score-excel";
import { PRIMARY_BUTTON_CLASS } from "@/app/admin/_components/action-ui";
import { importBoxScoreWorkbookAction, type BoxScoreWorkbookState } from "./actions";

function IssueTable({ title, issues, tone }: { title: string; issues: ImportIssue[]; tone: "error" | "warning" }) {
  if (issues.length === 0) return null;
  const color = tone === "error" ? "border-[#cf4a51] text-[#a3383d] dark:text-[#ff8a7a]" : "border-gold text-[#7a5200] dark:text-[#ffd27a]";
  return (
    <div className={`border-l-4 bg-surface px-4 py-3 ${color}`} role={tone === "error" ? "alert" : "status"}>
      <p className="mb-1 text-sm font-extrabold">
        {title}（{issues.length}件）
      </p>
      <ul className="max-h-72 space-y-1 overflow-y-auto text-sm">
        {issues.map((i, idx) => (
          <li key={idx} className="break-words">
            <span className="mr-1 font-bold">
              {i.sheet}
              {i.row !== null ? ` ${i.row}行目` : ""}：
            </span>
            {i.message}
          </li>
        ))}
      </ul>
    </div>
  );
}

// 試合のボックススコア Excel(新書式)。ファイルを選んで「取り込む」を押すと、両チームの検査が通った試合を取り込み、結果を表示する。
export function BoxScoreWorkbookForm() {
  const [state, action, pending] = useActionState<BoxScoreWorkbookState, FormData>(importBoxScoreWorkbookAction, { status: "idle" });

  return (
    <div className="space-y-4">
      <form action={action} className="flex flex-wrap items-center gap-3">
        <input
          type="file"
          name="xlsx"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          required
          className="w-full max-w-full text-sm sm:w-auto file:mr-3 file:border file:border-line file:bg-surface file:px-3 file:py-2 file:text-sm file:font-bold"
        />
        <button type="submit" disabled={pending} className={PRIMARY_BUTTON_CLASS}>
          {pending ? "取り込み中…" : "ボックススコアを取り込む"}
        </button>
      </form>

      {state.status === "error" && (
        <p role="alert" className="text-sm font-semibold text-[#cf4a51]">
          {state.message}
        </p>
      )}

      {state.status === "done" && (
        <div className="space-y-3">
          <p className="break-all text-sm">
            <b>{state.fileName}</b> を取り込みました{state.result.schema ? `（Schema ${state.result.schema}）` : ""}。
          </p>
          <dl className="grid grid-cols-3 gap-2 text-sm">
            <div className="border border-line px-3 py-2">
              <dt className="text-[11px] font-bold text-muted">追加</dt>
              <dd className="text-lg font-extrabold tabular-nums text-[#218c68]">{state.result.inserted}試合</dd>
            </div>
            <div className="border border-line px-3 py-2">
              <dt className="text-[11px] font-bold text-muted">更新</dt>
              <dd className="text-lg font-extrabold tabular-nums">{state.result.updated}試合</dd>
            </div>
            <div className="border border-line px-3 py-2">
              <dt className="text-[11px] font-bold text-muted">エラー</dt>
              <dd className={`text-lg font-extrabold tabular-nums ${state.result.errorCount > 0 ? "text-[#cf4a51]" : ""}`}>{state.result.errorCount}件</dd>
            </div>
          </dl>
          {state.result.importedGames.length > 0 && (
            <ul className="space-y-0.5 text-xs">
              {state.result.importedGames.map((g) => (
                <li key={g.id} className="tabular-nums">
                  {g.date}（米国の日付）・{g.id}・{g.label}
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-muted">
            個人成績 {state.result.importedPlayers}行を反映しました。
            {state.result.unmatchedPlayers.length > 0 &&
              `選手データと照合できなかった選手（名前だけで表示、選手ページへのリンクなし）：${state.result.unmatchedPlayers.join("、")}。`}
            {state.result.skippedGameIds.length > 0 && `エラーのため取り込まなかった試合：${state.result.skippedGameIds.join("、")}（以前のデータのままです）。`}
          </p>
          <IssueTable title="エラー（この試合は取り込んでいません）" issues={state.result.errors} tone="error" />
          <IssueTable title="注意（取り込み済み。出典の内容を確認してください）" issues={state.result.warnings} tone="warning" />
          {state.result.coverage.length > 0 && (
            <div className="border border-line px-4 py-3 text-xs">
              <p className="mb-1 font-bold">Metadata の取得状況（Coverage・米国の日付）</p>
              <ul className="space-y-0.5 break-words text-muted">
                {state.result.coverage.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
          )}
          {state.result.sourceErrors.length > 0 && (
            <div className="border border-line px-4 py-3 text-xs">
              <p className="mb-1 font-bold">Errors シート（取得時のエラーの履歴。取り込みには使いません）</p>
              <ul className="space-y-0.5 break-words text-muted">
                {state.result.sourceErrors.map((e, i) => (
                  <li key={i}>
                    {e.date ?? "—"}・{e.gameId ?? e.stage ?? "—"}：{e.error}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
