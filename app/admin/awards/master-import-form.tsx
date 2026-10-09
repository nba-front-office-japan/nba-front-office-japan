"use client";

import { useActionState, useState, startTransition } from "react";
import type { MasterImportPlan, MasterIssue } from "@/lib/awards/season-master-import";
import { GOLD_BUTTON_CLASS, PRIMARY_BUTTON_CLASS } from "@/app/admin/_components/action-ui";
import { applyMasterImportAction, previewMasterImportAction, type MasterApplyState, type MasterPreviewState } from "./actions";

function Stat({ label, value, tone }: { label: string; value: string; tone?: "good" | "bad" | "warn" }) {
  const color = tone === "good" ? "text-[#218c68]" : tone === "bad" ? "text-[#cf4a51]" : tone === "warn" ? "text-[#8a5a00] dark:text-gold" : "";
  return (
    <div className="border border-line px-3 py-2">
      <dt className="text-[11px] font-bold text-muted">{label}</dt>
      <dd className={`text-lg font-extrabold tabular-nums ${color}`}>{value}</dd>
    </div>
  );
}

function ErrorTable({ errors }: { errors: MasterIssue[] }) {
  if (errors.length === 0) return null;
  return (
    <div className="border-l-4 border-[#cf4a51] bg-surface" role="alert">
      <p className="px-4 pt-3 text-sm font-extrabold text-[#a3383d] dark:text-[#ff8a7a]">エラー（この行は取り込みません）（{errors.length}件）</p>
      <div className="max-h-80 overflow-auto px-4 pb-3 pt-2">
        <table className="w-full min-w-[520px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-muted">
              <th className="w-28 py-1.5 pr-3">シート</th>
              <th className="w-16 py-1.5 pr-3">行</th>
              <th className="w-40 py-1.5 pr-3">選手名</th>
              <th className="py-1.5">理由</th>
            </tr>
          </thead>
          <tbody>
            {errors.map((e, i) => (
              <tr key={i} className="border-b border-line align-top last:border-b-0">
                <td className="py-1.5 pr-3">{e.sheet}</td>
                <td className="whitespace-nowrap py-1.5 pr-3 font-bold tabular-nums">{e.row !== null ? `${e.row}行目` : "—"}</td>
                <td className="py-1.5 pr-3 font-bold">{e.player ?? "—"}</td>
                <td className="py-1.5">{e.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PlanSummary({ plan }: { plan: MasterImportPlan }) {
  return (
    <>
      <dl className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-5">
        <Stat label="対象年度数" value={`${plan.seasons}年度`} />
        <Stat label="追加予定" value={`${plan.toInsert}件`} tone="good" />
        <Stat label="更新予定" value={`${plan.toUpdate}件`} />
        <Stat label="削除予定" value={`${plan.toDelete}件`} tone={plan.toDelete > 0 ? "warn" : undefined} />
        <Stat label="エラー" value={`${plan.errors.length}件`} tone={plan.errors.length > 0 ? "bad" : undefined} />
      </dl>
      <p className="text-xs leading-6 text-muted">
        対象年度：{plan.seasonRange}（{plan.seasons}年度）。Awards Data {plan.awardRows}行・All-Star {plan.allStarRows}行のうち {plan.importRows}件を取り込みます（変更のない記録 {plan.unchanged}件、現在の登録 {plan.existingRecords}件）。
        選手 {plan.linkedPlayers + plan.unlinkedPlayers}人のうち、選手プロフィールへリンクできるのは {plan.linkedPlayers}人です（残り {plan.unlinkedPlayers}人は引退選手などサイトに未登録のため、名前だけを表示します）。
      </p>
      {plan.ambiguousNames.length > 0 && (
        <p className="text-xs text-[#7a5200] dark:text-gold">同じ名前の選手が複数いるため、リンクを付けない選手：{plan.ambiguousNames.join("、")}</p>
      )}
    </>
  );
}

// 年度別アワード(/awards)のマスターExcelの取り込み。① 内容を確認する → ② 取り込む。
// 選手プロフィール用の表彰履歴とは別のデータとして保存する。
export function MasterImportForm() {
  const [file, setFile] = useState<File | null>(null);
  const [confirmReplace, setConfirmReplace] = useState(false);
  const [preview, previewAction, previewing] = useActionState<MasterPreviewState, FormData>(previewMasterImportAction, { status: "idle" });
  const [applied, applyAction, applying] = useActionState<MasterApplyState, FormData>(applyMasterImportAction, { status: "idle" });

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
          <PlanSummary plan={plan} />
          {needsConfirm && (
            <div className="border-l-4 border-gold bg-surface px-4 py-3 text-sm">
              <p className="mb-1 font-extrabold text-[#7a5200] dark:text-[#ffd27a]">今回のExcelに含まれない既存の年度別アワード（{plan.toDelete}件）は削除されます</p>
              <ul className="list-disc pl-5 text-xs text-muted">
                {plan.deleteSamples.map((s) => (
                  <li key={s}>{s}</li>
                ))}
                {plan.toDelete > plan.deleteSamples.length && <li>ほか {plan.toDelete - plan.deleteSamples.length}件</li>}
              </ul>
            </div>
          )}
          <ErrorTable errors={plan.errors} />
          {needsConfirm && (
            <label className="flex items-start gap-2 border border-gold bg-[#fff8e8] px-3 py-2 text-sm font-bold text-[#7a5200] dark:bg-white/[.04] dark:text-gold">
              <input type="checkbox" checked={confirmReplace} onChange={(e) => setConfirmReplace(e.target.checked)} className="mt-1" />
              今回のExcelを正として既存の年度別アワードを置き換える（Excelに含まれない既存の記録 {plan.toDelete}件を削除します）
            </label>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={apply} disabled={!canApply} className={GOLD_BUTTON_CLASS}>
              {applying ? "取り込み中…" : "② この内容で取り込む"}
            </button>
            <span className="text-xs text-muted">エラーの行は取り込みません。取り込みに失敗した場合は、既存の年度別アワードはそのまま残ります。</span>
          </div>
        </div>
      )}

      {applied.status === "error" && (
        <p role="alert" className="text-sm font-semibold text-[#cf4a51]">
          {applied.message}
        </p>
      )}

      {applied.status === "done" && (
        <div className="space-y-3 border-t border-line pt-4">
          <p role="status" className="break-all text-sm font-extrabold text-[#218c68]">
            {applied.fileName} を取り込みました。
          </p>
          <dl className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-5">
            <Stat label="対象年度数" value={`${applied.plan.seasons}年度`} />
            <Stat label="追加" value={`${applied.result.inserted}件`} tone="good" />
            <Stat label="更新" value={`${applied.result.updated}件`} />
            <Stat label="削除" value={`${applied.result.deleted}件`} />
            <Stat label="エラー" value={`${applied.plan.errors.length}件`} tone={applied.plan.errors.length > 0 ? "bad" : undefined} />
          </dl>
          <p className="text-xs text-muted">
            {applied.plan.seasonRange}・{applied.plan.importRows}件を反映しました（変更のない記録 {applied.plan.unchanged}件）。
          </p>
          <ErrorTable errors={applied.plan.errors} />
        </div>
      )}
    </div>
  );
}
