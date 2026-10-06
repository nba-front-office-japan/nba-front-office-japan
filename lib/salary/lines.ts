// サラリーライン(Salary Cap・Tax Level・1st Apron・2nd Apron)の基準額と、チーム総年俸との比較。
// 基準額は運営者が指定した2026-27の額のみ。2027-28以降は公式額を追加するまで持たない(比較も表示しない)。
// 比較は Excel から取り込んだ「チーム総年俸」を基準にした参考比較で、CBA上の厳密なチーム給与計算とは差が出る場合がある。

import type { SalarySeason } from "./types";

export type SalaryLineKey = "cap" | "tax" | "apron1" | "apron2";

export type SalaryLine = {
  key: SalaryLineKey;
  label: string;
  amount: number;
  description: string;
  /** グラフの縦線・目印の色 */
  color: string;
};

export const SALARY_LINES: Partial<Record<SalarySeason, SalaryLine[]>> = {
  "2026-27": [
    { key: "cap", label: "Salary Cap", amount: 164_961_000, description: "キャップスペースの計算に使う基準額", color: "#8a94a6" },
    { key: "tax", label: "Tax Level", amount: 200_428_000, description: "超えるとラグジュアリータックスの対象", color: "#d99a12" },
    { key: "apron1", label: "1st Apron", amount: 209_015_000, description: "超えると一部の補強手段が制限される", color: "#1f63e9" },
    { key: "apron2", label: "2nd Apron", amount: 221_686_000, description: "より厳しい制限の対象", color: "#d23c44" },
  ],
};

export function salaryLinesFor(season: SalarySeason): SalaryLine[] | null {
  return SALARY_LINES[season] ?? null;
}

export type LineStatus = { label: string; line: SalaryLine | null };

/** 総年俸が超えている最も高いライン(どれも超えていなければ「Cap下」)。基準額と同額は「超えていない」扱い */
export function lineStatus(total: number, lines: SalaryLine[]): LineStatus {
  const exceeded = [...lines].sort((a, b) => b.amount - a.amount).find((l) => total > l.amount);
  if (!exceeded) return { label: "Cap下", line: null };
  const short: Record<SalaryLineKey, string> = { cap: "Cap超過", tax: "Tax超過", apron1: "1st Apron超過", apron2: "2nd Apron超過" };
  return { label: short[exceeded.key], line: exceeded };
}

/** 日本語の金額表記(例: 164,961,000 → 1億6,496万1,000ドル) */
export function formatUsdJa(value: number): string {
  const oku = Math.floor(value / 100_000_000);
  const man = Math.floor((value % 100_000_000) / 10_000);
  const rest = value % 10_000;
  const parts = [oku > 0 ? `${oku.toLocaleString("ja-JP")}億` : "", man > 0 ? `${man.toLocaleString("ja-JP")}万` : "", rest > 0 ? rest.toLocaleString("ja-JP") : ""];
  return `${parts.join("") || "0"}ドル`;
}
