"use client";

import { useActionState } from "react";
import type { CsvIssue } from "@/lib/games/box-score-csv";
import type { CheckReport } from "@/lib/games/box-score-import";
import { GHOST_BUTTON_CLASS, GOLD_BUTTON_CLASS, PRIMARY_BUTTON_CLASS } from "@/app/admin/_components/action-ui";
import { checkBoxScoreCsvAction, importBoxScoreCsvAction, type CheckState, type ImportState } from "./actions";

function IssueList({ title, issues, tone }: { title: string; issues: CsvIssue[]; tone: "error" | "warning" }) {
  if (issues.length === 0) return null;
  const color = tone === "error" ? "border-[#cf4a51] text-[#a3383d] dark:text-[#ff8a7a]" : "border-gold text-[#7a5200] dark:text-[#ffd27a]";
  return (
    <div className={`border-l-4 bg-surface px-4 py-3 ${color}`} role={tone === "error" ? "alert" : "status"}>
      <p className="mb-1 text-sm font-extrabold">
        {title}（{issues.length}件）
      </p>
      <ul className="max-h-72 space-y-1 overflow-y-auto text-sm">
        {issues.map((i, idx) => (
          <li key={idx}>
            {i.line !== null && <span className="mr-1 font-bold">{i.line}行目：</span>}
            {i.message}
          </li>
        ))}
      </ul>
    </div>
  );
}

// エラーを行ごとにまとめた表(同じ行の複数のエラーは1行にまとめる。行番号のないものはファイル全体のエラー)
function ErrorTable({ errors }: { errors: CsvIssue[] }) {
  const byLine = new Map<number | null, string[]>();
  for (const e of errors) byLine.set(e.line, [...(byLine.get(e.line) ?? []), e.message]);
  return (
    <div role="alert" className="border-l-4 border-[#cf4a51] bg-surface">
      <p className="px-4 pt-3 text-sm font-extrabold text-[#a3383d] dark:text-[#ff8a7a]">
        エラーが {errors.length}件あります。CSVを修正して、もう一度検査してください（このCSVは取り込めません）。
      </p>
      <div className="max-h-96 overflow-auto px-4 pb-3 pt-2">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-muted">
              <th className="w-20 py-1.5 pr-3">行</th>
              <th className="py-1.5">内容</th>
            </tr>
          </thead>
          <tbody>
            {[...byLine.entries()].map(([line, messages]) => (
              <tr key={String(line)} className="border-b border-line align-top last:border-b-0">
                <td className="whitespace-nowrap py-1.5 pr-3 font-bold tabular-nums">{line === null ? "ファイル全体" : `${line}行目`}</td>
                <td className="py-1.5">
                  <ul className="space-y-0.5">
                    {messages.map((m, i) => (
                      <li key={i}>{m}</li>
                    ))}
                  </ul>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// エラーがある場合はエラーだけを表示し、試合ごとの「注意」や概要は表示しない
function ReportView({ report }: { report: CheckReport }) {
  if (report.errors.length > 0) return <ErrorTable errors={report.errors} />;
  return (
    <div className="space-y-3">
      <IssueList title="注意" issues={report.warnings} tone="warning" />
      {report.games.length > 0 && (
        <div className="overflow-x-auto border border-line bg-surface">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-muted">
                <th className="px-3 py-2">試合（米国日付 アウェー @ ホーム）</th>
                <th className="px-3 py-2 text-right">選手数（アウェー／ホーム）</th>
                <th className="px-3 py-2 text-right">登録済み</th>
                <th className="px-3 py-2 text-right">照合できない選手</th>
              </tr>
            </thead>
            <tbody>
              {report.games.map((g) => (
                <tr key={g.key} className="border-b border-line last:border-b-0">
                  <td className="px-3 py-2 font-bold">{g.label}</td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {g.rowCount}（{g.awayCount}／{g.homeCount}）
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{g.existingCount > 0 ? `${g.existingCount}人（置き換え）` : "なし"}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{g.unmatchedPlayers.length}人</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// 手順: ① CSVを選んで「検査する」 → ② 結果を確認して「この内容で取り込む」
// 取り込み時にもサーバー側でもう一度すべて検査し、エラーがあれば書き込まない。
export function BoxScoreImportForm() {
  const [checkState, checkAction, checking] = useActionState<CheckState, FormData>(checkBoxScoreCsvAction, { status: "idle" });
  const [importState, importAction, importing] = useActionState<ImportState, FormData>(importBoxScoreCsvAction, { status: "idle" });

  const checked = checkState.status === "checked" ? checkState : null;
  const canImport = checked !== null && checked.report.errors.length === 0 && checked.report.games.length > 0;

  return (
    <div className="space-y-4">
      <form action={checkAction} className="flex flex-wrap items-center gap-3">
        <input
          type="file"
          name="csv"
          accept=".csv,text/csv"
          required
          className="w-full max-w-full text-sm sm:w-auto file:mr-3 file:border file:border-line file:bg-surface file:px-3 file:py-2 file:text-sm file:font-bold"
        />
        <button type="submit" disabled={checking || importing} className={PRIMARY_BUTTON_CLASS}>
          {checking ? "検査中…" : "① 検査する"}
        </button>
      </form>

      {checkState.status === "error" && (
        <p role="alert" className="text-sm font-semibold text-[#cf4a51]">
          {checkState.message}
        </p>
      )}

      {checked && (
        <div className="space-y-3">
          <p className="text-sm">
            <b>{checked.fileName}</b>：{checked.report.totalRows}行を検査しました
            {checked.report.errors.length === 0 ? `（${checked.report.games.length}試合、エラーなし）。` : "。"}
          </p>
          <ReportView report={checked.report} />
          {canImport ? (
            <form action={importAction} className="flex flex-wrap items-center gap-3">
              <input type="hidden" name="csvText" value={checked.csvText} />
              <button type="submit" disabled={importing} className={GOLD_BUTTON_CLASS}>
                {importing ? "取込中…" : "② この内容で取り込む"}
              </button>
              <span className="text-xs text-muted">試合ごとに、その試合の選手スタッツをCSVの内容にすべて置き換えます。</span>
            </form>
          ) : null}
        </div>
      )}

      {importState.status === "error" && (
        <div className="space-y-3">
          <p role="alert" className="text-sm font-semibold text-[#cf4a51]">
            {importState.message}
          </p>
          {importState.report && <ReportView report={importState.report} />}
        </div>
      )}
      {importState.status === "done" && (
        <div role="status" className="border-l-4 border-[#218c68] bg-surface px-4 py-3 text-sm">
          <p className="mb-1 font-extrabold text-[#218c68]">取込が完了しました</p>
          <ul className="space-y-1">
            {importState.results.map((r) => (
              <li key={r.label} className={r.ok ? "" : "font-semibold text-[#cf4a51]"}>
                {r.label}：{r.ok ? `${r.count}人分を登録しました` : `失敗しました（この試合は以前のデータのままです）：${r.message}`}
              </li>
            ))}
          </ul>
          <a href="/admin/games" className={`${GHOST_BUTTON_CLASS} mt-3 inline-block`}>
            画面を更新する
          </a>
        </div>
      )}
    </div>
  );
}
