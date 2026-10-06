// サラリーページ(/salary)のデータの形と表示用の小さな関数。
// データ本体は lib/salary/payroll-data.ts(Excelから生成)。サーバー・クライアントの両方から使う。

export const SALARY_SEASONS = ["2026-27", "2027-28", "2028-29", "2029-30", "2030-31", "2031-32"] as const;
export type SalarySeason = (typeof SALARY_SEASONS)[number];

export const SALARY_SOURCE_LABEL = "NBA Payroll 2026-27–2031-32";

export type SalaryOption = { season: SalarySeason; type: "player" | "team" };

export type SalaryTeam = {
  /** 当サイトのチーム略称(例: NYK) */
  abbr: string;
  name: string;
  /** All Teams Summary の年度別総年俸(SALARY_SEASONS の順。空欄はnull) */
  totals: (number | null)[];
};

export type SalaryPlayer = {
  name: string;
  /** チーム略称 */
  team: string;
  age: number | null;
  /** 年度別年俸(SALARY_SEASONS の順。空欄はnull) */
  salaries: (number | null)[];
  /** 保証額(空欄はnull) */
  guaranteed: number | null;
  /** オプション(Excelの Options 列。空欄でもオプションがないとは限らない) */
  options: SalaryOption[];
};

export const OPTION_LABEL: Record<SalaryOption["type"], string> = { player: "選手オプション", team: "チームオプション" };
export const OPTION_SHORT: Record<SalaryOption["type"], string> = { player: "PO", team: "TO" };

/** ドル表記(例: $57,078,728)。空欄は「—」 */
export function formatUsd(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return `$${value.toLocaleString("en-US")}`;
}

/** 短いドル表記(例: $227.7M)。空欄は「—」 */
export function formatUsdShort(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return `$${(value / 1_000_000).toFixed(1)}M`;
}

export function seasonIndex(season: SalarySeason): number {
  return SALARY_SEASONS.indexOf(season);
}

export function isSalarySeason(value: unknown): value is SalarySeason {
  return typeof value === "string" && (SALARY_SEASONS as readonly string[]).includes(value);
}

/** URL用のチーム識別子(略称の小文字。例: nyk) */
export function teamSlug(abbr: string): string {
  return abbr.toLowerCase();
}

/** その年度のオプション(なければnull) */
export function optionFor(player: SalaryPlayer, season: SalarySeason): SalaryOption["type"] | null {
  return player.options.find((o) => o.season === season)?.type ?? null;
}
