"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MAX_CSV_BYTES, type CsvIssue } from "@/lib/games/box-score-csv";
import type { CheckReport, TeamSide } from "@/lib/games/box-score-import";
import { GOLD_BUTTON_CLASS } from "@/app/admin/_components/action-ui";
import { checkTeamBoxScoreAction, saveTeamBoxScoreAction, type SaveResult } from "../actions";

// エラーを行ごとにまとめた表(同じ行の複数のエラーは1行にまとめる。行番号のないものはファイル全体のエラー)
function ErrorTable({ errors }: { errors: CsvIssue[] }) {
  const byLine = new Map<number | null, string[]>();
  for (const e of errors) byLine.set(e.line, [...(byLine.get(e.line) ?? []), e.message]);
  return (
    <div role="alert" className="border-l-4 border-[#cf4a51] bg-surface">
      <p className="px-4 pt-3 text-sm font-extrabold text-[#a3383d] dark:text-[#ff8a7a]">
        エラーが {errors.length}件あります。CSVを修正して、もう一度選んでください（このままでは登録できません）。
      </p>
      <div className="max-h-96 overflow-auto px-4 pb-3 pt-2">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-muted">
              <th className="w-24 py-1.5 pr-3">行</th>
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

function Warnings({ warnings }: { warnings: CsvIssue[] }) {
  if (warnings.length === 0) return null;
  return (
    <div role="status" className="border-l-4 border-gold bg-surface px-4 py-3 text-[#7a5200] dark:text-[#ffd27a]">
      <p className="mb-1 text-sm font-extrabold">注意（登録はできます）</p>
      <ul className="space-y-1 text-sm">
        {warnings.map((w, i) => (
          <li key={i}>
            {w.line !== null && <span className="mr-1 font-bold">{w.line}行目：</span>}
            {w.message}
          </li>
        ))}
      </ul>
    </div>
  );
}

const PREVIEW_COLUMNS = [
  { key: "min", label: "MIN" },
  { key: "pts", label: "PTS" },
  { key: "reb", label: "REB" },
  { key: "ast", label: "AST" },
  { key: "stl", label: "STL" },
  { key: "blk", label: "BLK" },
] as const;

function Preview({ report }: { report: CheckReport }) {
  const { target, totals } = report;
  return (
    <div className="space-y-2">
      <dl className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
        <div className="border border-line px-3 py-2">
          <dt className="text-[11px] font-bold text-muted">選手数</dt>
          <dd className="text-lg font-extrabold tabular-nums">{report.playerCount}人</dd>
        </div>
        <div className="border border-line px-3 py-2">
          <dt className="text-[11px] font-bold text-muted">得点合計</dt>
          <dd className="text-lg font-extrabold tabular-nums">{totals ? totals.pts : "—"}</dd>
        </div>
        <div className="border border-line px-3 py-2">
          <dt className="text-[11px] font-bold text-muted">試合管理のスコア（{target.teamAbbr}）</dt>
          <dd
            className={`text-lg font-extrabold tabular-nums ${
              totals && target.teamScore !== null && totals.pts !== target.teamScore ? "text-[#b0392f]" : ""
            }`}
          >
            {target.teamScore ?? "未確定"}
          </dd>
        </div>
        <div className="border border-line px-3 py-2">
          <dt className="text-[11px] font-bold text-muted">登録済み（置き換え対象）</dt>
          <dd className="text-lg font-extrabold tabular-nums">{report.existingCount > 0 ? `${report.existingCount}人` : "なし"}</dd>
        </div>
      </dl>

      <p className="text-xs text-muted sm:hidden">→ 表は横にスクロールできます</p>
      <div className="overflow-x-auto border border-line bg-surface">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-foreground text-[11px] font-extrabold text-muted">
              <th className="px-2 py-2 text-right">行</th>
              <th className="sticky left-0 bg-surface px-3 py-2 text-left">選手名</th>
              <th className="px-2 py-2 text-left">照合</th>
              {PREVIEW_COLUMNS.map((c) => (
                <th key={c.key} className="px-2 py-2 text-right">
                  {c.label}
                </th>
              ))}
              <th className="whitespace-nowrap px-2 py-2 text-right">FGM/FGA</th>
              <th className="whitespace-nowrap px-2 py-2 text-right">3PM/3PA</th>
              <th className="whitespace-nowrap px-2 py-2 text-right">FTM/FTA</th>
              <th className="px-2 py-2 text-right">+/-</th>
            </tr>
          </thead>
          <tbody>
            {report.preview.map((r) => {
              const v = r.values;
              const cell = (s: string) => (s === "" ? "–" : s);
              return (
                <tr key={r.line} className={`border-b border-line last:border-b-0 ${r.hasError ? "bg-[#fdecec] dark:bg-red-950/40" : ""}`}>
                  <td className="px-2 py-1.5 text-right text-xs tabular-nums text-muted">{r.line}</td>
                  <th scope="row" className={`sticky left-0 whitespace-nowrap px-3 py-1.5 text-left font-bold ${r.hasError ? "bg-[#fdecec] dark:bg-[#3a1d1d]" : "bg-surface"}`}>
                    {cell(v.player)}
                  </th>
                  <td className="whitespace-nowrap px-2 py-1.5 text-xs">
                    {r.hasError ? (
                      <span className="font-bold text-[#b0392f]">エラー</span>
                    ) : r.matched ? (
                      <span className="text-[#218c68]">一致</span>
                    ) : (
                      <span className="text-[#7a5200] dark:text-[#ffd27a]">名前のみ</span>
                    )}
                  </td>
                  {PREVIEW_COLUMNS.map((c) => (
                    <td key={c.key} className={`px-2 py-1.5 text-right tabular-nums ${c.key === "pts" ? "font-bold" : ""}`}>
                      {cell(v[c.key])}
                    </td>
                  ))}
                  <td className="whitespace-nowrap px-2 py-1.5 text-right tabular-nums">
                    {cell(v.fgm)}/{cell(v.fga)}
                  </td>
                  <td className="whitespace-nowrap px-2 py-1.5 text-right tabular-nums">
                    {cell(v.fg3m)}/{cell(v.fg3a)}
                  </td>
                  <td className="whitespace-nowrap px-2 py-1.5 text-right tabular-nums">
                    {cell(v.ftm)}/{cell(v.fta)}
                  </td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{cell(v.plus_minus)}</td>
                </tr>
              );
            })}
          </tbody>
          {totals && (
            <tfoot>
              <tr className="border-t-2 border-foreground font-bold">
                <td />
                <th scope="row" className="sticky left-0 bg-surface px-3 py-2 text-left">
                  合計
                </th>
                <td />
                <td />
                <td className="px-2 py-2 text-right tabular-nums">{totals.pts}</td>
                <td className="px-2 py-2 text-right tabular-nums">{totals.reb}</td>
                <td className="px-2 py-2 text-right tabular-nums">{totals.ast}</td>
                <td />
                <td />
                <td className="whitespace-nowrap px-2 py-2 text-right tabular-nums">
                  {totals.fgm}/{totals.fga}
                </td>
                <td className="whitespace-nowrap px-2 py-2 text-right tabular-nums">
                  {totals.fg3m}/{totals.fg3a}
                </td>
                <td className="whitespace-nowrap px-2 py-2 text-right tabular-nums">
                  {totals.ftm}/{totals.fta}
                </td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

type FileState = { name: string; text: string };

// CSVを選ぶとすぐにサーバーで検査してプレビューを表示し、「このチームの成績を登録」を押したときだけ保存する。
// 保存の直前にもサーバー側でもう一度すべて検査し、エラーがあれば書き込まない。
export function TeamBoxScoreForm({ gameId, side, teamAbbr, existingCount }: { gameId: string; side: TeamSide; teamAbbr: string; existingCount: number }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<FileState | null>(null);
  const [report, setReport] = useState<CheckReport | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [saveResult, setSaveResult] = useState<SaveResult | null>(null);
  const [checking, startCheck] = useTransition();
  const [saving, startSave] = useTransition();

  function reset() {
    setFile(null);
    setReport(null);
    setMessage(null);
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    reset();
    setSaveResult(null);
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (!/\.csv$/i.test(selected.name)) {
      setMessage("拡張子が .csv のファイルを選んでください。");
      return;
    }
    if (selected.size > MAX_CSV_BYTES) {
      setMessage(`ファイルが大きすぎます（上限 ${Math.round(MAX_CSV_BYTES / 1000)}KB）。1試合・1チーム分だけを入れてください。`);
      return;
    }
    const text = await selected.text();
    setFile({ name: selected.name, text });
    startCheck(async () => {
      const result = await checkTeamBoxScoreAction(gameId, side, text);
      if (result.ok) setReport(result.report);
      else setMessage(result.message);
    });
  }

  function onSave() {
    if (!file || !report) return;
    if (existingCount > 0 && !window.confirm(`${teamAbbr} の登録済みの${existingCount}人分を、このCSVの${report.playerCount}人分に置き換えます。よろしいですか？`)) return;
    startSave(async () => {
      const result = await saveTeamBoxScoreAction(gameId, side, file.text);
      setSaveResult(result);
      if (result.ok) {
        reset();
        if (inputRef.current) inputRef.current.value = "";
        router.refresh();
      } else if (result.report) {
        setReport(result.report);
      }
    });
  }

  const canSave = report !== null && report.errors.length === 0 && report.playerCount > 0 && !checking && !saving;

  return (
    <div className="space-y-4">
      <label className="block">
        <span className="mb-1 block text-xs font-bold text-muted">{teamAbbr} の成績のCSVファイル</span>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={onFileChange}
          disabled={saving}
          className="w-full max-w-full text-sm file:mr-3 file:border file:border-line file:bg-surface file:px-3 file:py-2 file:text-sm file:font-bold"
        />
      </label>

      {checking && (
        <p role="status" className="text-sm text-muted">
          検査中…
        </p>
      )}
      {message && (
        <p role="alert" className="text-sm font-semibold text-[#cf4a51]">
          {message}
        </p>
      )}

      {report && !checking && (
        <div className="space-y-3">
          <p className="text-sm">
            <b className="break-all">{file?.name}</b>：{report.playerCount}人分を検査しました
            {report.errors.length === 0 ? "（エラーなし）。" : "。"}
          </p>
          {report.errors.length > 0 && <ErrorTable errors={report.errors} />}
          <Warnings warnings={report.warnings} />
          {report.playerCount > 0 && <Preview report={report} />}
        </div>
      )}

      {report && !checking && (
        <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
          <button type="button" onClick={onSave} disabled={!canSave} className={GOLD_BUTTON_CLASS}>
            {saving ? "登録中…" : "このチームの成績を登録"}
          </button>
          <span className="text-xs text-muted">
            {report.errors.length > 0
              ? "エラーを直したCSVを選び直すと、登録できるようになります。"
              : existingCount > 0
                ? `${teamAbbr} の登録済みの${existingCount}人分を置き換えます。相手チームの成績は変わりません。`
                : `${teamAbbr} の成績として登録します。`}
          </span>
        </div>
      )}

      {saveResult?.ok === false && (
        <p role="alert" className="text-sm font-semibold text-[#cf4a51]">
          {saveResult.message}
        </p>
      )}
      {saveResult?.ok && (
        <div role="status" className="border-l-4 border-[#218c68] bg-surface px-4 py-3 text-sm">
          <p className="font-extrabold text-[#218c68]">
            {teamAbbr} の成績を{saveResult.count}人分登録しました
            {saveResult.replaced > 0 ? `（以前の${saveResult.replaced}人分を置き換え）` : ""}。
          </p>
          <p className="mt-1 text-muted">下の「登録済みの成績」と、公開ページの試合詳細に反映されています。</p>
        </div>
      )}
    </div>
  );
}
