"use client";

import { useActionState, useState, startTransition } from "react";
import type { AwardImportIssue, AwardImportPlan } from "@/lib/awards/history-import";
import { GOLD_BUTTON_CLASS, PRIMARY_BUTTON_CLASS } from "@/app/admin/_components/action-ui";
import { applyAwardImportAction, previewAwardImportAction, type AwardApplyState, type AwardPreviewState } from "./actions";

function Stat({ label, value, tone }: { label: string; value: string; tone?: "good" | "bad" | "warn" }) {
  const color = tone === "good" ? "text-[#218c68]" : tone === "bad" ? "text-[#cf4a51]" : tone === "warn" ? "text-[#8a5a00] dark:text-gold" : "";
  return (
    <div className="border border-line px-3 py-2">
      <dt className="text-[11px] font-bold text-muted">{label}</dt>
      <dd className={`text-lg font-extrabold tabular-nums ${color}`}>{value}</dd>
    </div>
  );
}

function IssueTable({ title, issues, tone }: { title: string; issues: AwardImportIssue[]; tone: "error" | "warning" }) {
  if (issues.length === 0) return null;
  const color = tone === "error" ? "border-[#cf4a51]" : "border-gold";
  return (
    <div className={`border-l-4 bg-surface ${color}`} role={tone === "error" ? "alert" : "status"}>
      <p className={`px-4 pt-3 text-sm font-extrabold ${tone === "error" ? "text-[#a3383d] dark:text-[#ff8a7a]" : "text-[#7a5200] dark:text-[#ffd27a]"}`}>
        {title}（{issues.length}件）
      </p>
      <div className="max-h-80 overflow-auto px-4 pb-3 pt-2">
        <table className="w-full min-w-[480px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-muted">
              <th className="w-16 py-1.5 pr-3">行</th>
              <th className="w-44 py-1.5 pr-3">選手名</th>
              <th className="py-1.5">理由</th>
            </tr>
          </thead>
          <tbody>
            {issues.map((i, idx) => (
              <tr key={idx} className="border-b border-line align-top last:border-b-0">
                <td className="whitespace-nowrap py-1.5 pr-3 font-bold tabular-nums">{i.row !== null ? `${i.row}行目` : "—"}</td>
                <td className="py-1.5 pr-3 font-bold">{i.player ?? "—"}</td>
                <td className="py-1.5">{i.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PlanView({ plan }: { plan: AwardImportPlan }) {
  return (
    <div className="space-y-3">
      <dl className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
        <Stat label="追加予定" value={`${plan.toInsert}件`} tone="good" />
        <Stat label="更新予定" value={`${plan.toUpdate}件`} />
        <Stat label="削除予定" value={`${plan.toDelete}件`} tone={plan.toDelete > 0 ? "warn" : undefined} />
        <Stat label="エラー" value={`${plan.errors.length}件`} tone={plan.errors.length > 0 ? "bad" : undefined} />
      </dl>
      <p className="text-xs text-muted">
        Excelの表彰 {plan.totalRows}行のうち、{plan.matchedPlayers}選手・{plan.importRows}件を取り込みます（変更のない記録 {plan.unchanged}件）。現在の登録件数は {plan.existingRecords}件です。
      </p>
      {plan.unmatchedPlayers.length > 0 && (
        <div className="border-l-4 border-[#cf4a51] bg-surface px-4 py-3 text-sm">
          <p className="mb-1 font-extrabold text-[#a3383d] dark:text-[#ff8a7a]">一致しない選手名（{plan.unmatchedPlayers.length}人。この選手の表彰は取り込みません）</p>
          <ul className="space-y-1">
            {plan.unmatchedPlayers.map((u) => (
              <li key={u.name}>
                <b>{u.name}</b>：{u.reason}
              </li>
            ))}
          </ul>
        </div>
      )}
      {plan.toDelete > 0 && (
        <div className="border-l-4 border-gold bg-surface px-4 py-3 text-sm">
          <p className="mb-1 font-extrabold text-[#7a5200] dark:text-[#ffd27a]">今回のExcelに含まれない既存の表彰データ（{plan.toDelete}件）は削除されます</p>
          <ul className="list-disc pl-5 text-xs text-muted">
            {plan.deleteSamples.map((s) => (
              <li key={s}>{s}</li>
            ))}
            {plan.toDelete > plan.deleteSamples.length && <li>ほか {plan.toDelete - plan.deleteSamples.length}件</li>}
          </ul>
        </div>
      )}
      <IssueTable title="エラー（この行は取り込みません）" issues={plan.errors} tone="error" />
      <IssueTable title="注意（取り込みます）" issues={plan.warnings} tone="warning" />
    </div>
  );
}

// ① ファイルを選んで「内容を確認する」→ ② 追加・更新・削除予定を確認して「取り込む」。
// 取り込むときもサーバー側でもう一度すべて確認する。削除がある場合は置き換えの確認が必要。
export function AwardImportForm() {
  const [file, setFile] = useState<File | null>(null);
  const [confirmReplace, setConfirmReplace] = useState(false);
  const [preview, previewAction, previewing] = useActionState<AwardPreviewState, FormData>(previewAwardImportAction, { status: "idle" });
  const [applied, applyAction, applying] = useActionState<AwardApplyState, FormData>(applyAwardImportAction, { status: "idle" });

  const plan = preview.status === "ready" ? preview.plan : null;
  const needsConfirm = (plan?.toDelete ?? 0) > 0;
  const canApply = plan !== null && plan.importRows > 0 && (!needsConfirm || confirmReplace) && !applying;

  function apply() {
    if (!file) return;
    const fd = new FormData();
    fd.set("xlsx", file);
    if (confirmReplace) fd.set("confirmReplace", "yes");
    startTransition(() => applyAction(fd));
  }

  return (
    <div className="space-y-4">
      <form action={previewAction} className="flex flex-wrap items-center gap-3">
        <input
          type="file"
          name="xlsx"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          required
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null);
            setConfirmReplace(false);
          }}
          className="w-full max-w-full text-sm sm:w-auto file:mr-3 file:border file:border-line file:bg-surface file:px-3 file:py-2 file:text-sm file:font-bold"
        />
        <button type="submit" disabled={previewing || applying} className={PRIMARY_BUTTON_CLASS}>
          {previewing ? "確認中…" : "① 内容を確認する"}
        </button>
      </form>

      {preview.status === "error" && (
        <p role="alert" className="text-sm font-semibold text-[#cf4a51]">
          {preview.message}
        </p>
      )}

      {plan && applied.status !== "done" && (
        <div className="space-y-4 border-t border-line pt-4">
          <p className="break-all text-sm">
            <b>{preview.status === "ready" ? preview.fileName : ""}</b> の確認結果（まだ反映していません）
          </p>
          <PlanView plan={plan} />
          {needsConfirm && (
            <label className="flex items-start gap-2 border border-gold bg-[#fff8e8] px-3 py-2 text-sm font-bold text-[#7a5200] dark:bg-white/[.04] dark:text-gold">
              <input type="checkbox" checked={confirmReplace} onChange={(e) => setConfirmReplace(e.target.checked)} className="mt-1" />
              今回のExcelを正として既存の表彰データを置き換える（Excelに含まれない既存の表彰データ {plan.toDelete}件を削除します）
            </label>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={apply} disabled={!canApply} className={GOLD_BUTTON_CLASS}>
              {applying ? "取り込み中…" : "② この内容で取り込む"}
            </button>
            <span className="text-xs text-muted">エラーの行は取り込みません。取り込みに失敗した場合は、既存の表彰データはそのまま残ります。</span>
          </div>
        </div>
      )}

      {applied.status === "error" && (
        <div className="space-y-3">
          <p role="alert" className="text-sm font-semibold text-[#cf4a51]">
            {applied.message}
          </p>
        </div>
      )}

      {applied.status === "done" && (
        <div className="space-y-3 border-t border-line pt-4">
          <p role="status" className="break-all text-sm font-extrabold text-[#218c68]">
            {applied.fileName} を取り込みました。
          </p>
          <dl className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            <Stat label="追加" value={`${applied.result.inserted}件`} tone="good" />
            <Stat label="更新" value={`${applied.result.updated}件`} />
            <Stat label="削除" value={`${applied.result.deleted}件`} />
            <Stat label="エラー" value={`${applied.plan.errors.length}件`} tone={applied.plan.errors.length > 0 ? "bad" : undefined} />
          </dl>
          <p className="text-xs text-muted">
            {applied.plan.matchedPlayers}選手・{applied.plan.importRows}件の表彰を反映しました（変更のない記録 {applied.plan.unchanged}件）。
          </p>
          <IssueTable title="エラー（この行は取り込んでいません）" issues={applied.plan.errors} tone="error" />
        </div>
      )}
    </div>
  );
}
