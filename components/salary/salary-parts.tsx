import Link from "next/link";
import {
  CONTRACT_MARKS,
  CONTRACT_MARK_BY_TYPE,
  SALARY_SEASONS,
  SALARY_SOURCE_LABEL,
  contractMarks,
  type ContractMarkType,
  type SalaryPlayer,
  type SalarySeason,
} from "@/lib/salary/types";

// サラリーページ(/salary 以下)で共通の部品。

export function SalaryBreadcrumb({ items }: { items: { href?: string; label: string }[] }) {
  return (
    <nav aria-label="パンくずリスト" className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
      <Link href="/salary" className="font-semibold text-blue hover:underline">
        サラリー
      </Link>
      {items.map((item) => (
        <span key={item.label} className="flex items-center gap-x-2">
          <span aria-hidden>›</span>
          {item.href ? (
            <Link href={item.href} className="font-semibold text-blue hover:underline">
              {item.label}
            </Link>
          ) : (
            <span aria-current="page" className="font-semibold text-foreground">
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}

export function SalaryHeading({ kicker, title, lead }: { kicker: string; title: string; lead?: string }) {
  return (
    <div className="mb-6">
      <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">{kicker}</p>
      <h1 className="text-[28px] font-semibold leading-tight tracking-tight sm:text-[36px]">{title}</h1>
      {lead && <p className="mt-2 max-w-3xl text-sm leading-7 text-muted">{lead}</p>}
    </div>
  );
}

// 契約状況の目印の配色(文字と背景のコントラスト比はライト・ダークとも4.5以上)
export const CONTRACT_BADGE_COLOR: Record<ContractMarkType, string> = {
  player: "bg-[#d6e4ff] text-[#163f8f] dark:bg-[#1c3a70] dark:text-[#cfe0ff]",
  team: "bg-[#ffd6de] text-[#a01d3a] dark:bg-[#5c1f2d] dark:text-[#ffd0d9]",
  qo: "bg-[#d2f0dc] text-[#17663a] dark:bg-[#1b4a30] dark:text-[#c4efd3]",
  "two-way": "bg-[#e6dbff] text-[#5a2aa6] dark:bg-[#3d2a6e] dark:text-[#e0d4ff]",
};

/** 契約状況の目印(PO・TO・Q・TW) */
export function ContractBadge({ type, season }: { type: ContractMarkType; season?: SalarySeason }) {
  const mark = CONTRACT_MARK_BY_TYPE[type];
  return (
    <span title={`${season ? `${season} ` : ""}${mark.label}`} className={`inline-block whitespace-nowrap px-1.5 py-0.5 text-[11px] font-bold ${CONTRACT_BADGE_COLOR[type]}`}>
      {season ? `${season} ` : ""}
      {mark.short}
    </span>
  );
}

/** 選手ごとの契約状況(年度順)。何もなければ「—」 */
export function ContractList({ player }: { player: SalaryPlayer }) {
  const marks = contractMarks(player);
  if (marks.length === 0) return <span className="text-muted">—</span>;
  return (
    <span className="flex flex-wrap gap-1">
      {marks.map((m) => (
        <ContractBadge key={`${m.season}-${m.type}`} type={m.type} season={m.season} />
      ))}
    </span>
  );
}

/** 契約状況の凡例。statusCount は Q・TW が付いている選手の数 */
export function ContractLegend({ statusCount }: { statusCount: number }) {
  return (
    <div className="text-xs text-muted">
      <p className="mb-1 font-bold text-foreground">契約状況の見方</p>
      <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
        {CONTRACT_MARKS.map((m) => (
          <li key={m.type} className="flex items-center gap-1.5">
            <ContractBadge type={m.type} />
            <span>
              <span className="font-semibold text-foreground">{m.label}</span>（{m.description}）
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-1.5 text-[11px]">
        Q・TWは、出典で確認できた選手だけに表示します。
        {statusCount === 0 ? "現在の出典データには該当する情報がないため、表示している選手はいません。" : `現在${statusCount}人に表示しています。`}
      </p>
    </div>
  );
}

/** 年度の切り替えボタン(クライアント側の状態で切り替える) */
export function SeasonTabs({
  value,
  onChange,
  includeAll = false,
}: {
  value: SalarySeason | "all";
  onChange: (value: SalarySeason | "all") => void;
  includeAll?: boolean;
}) {
  const items: (SalarySeason | "all")[] = includeAll ? [...SALARY_SEASONS, "all"] : [...SALARY_SEASONS];
  return (
    <div role="group" aria-label="年度" className="flex flex-wrap gap-1.5">
      {items.map((s) => {
        const active = s === value;
        return (
          <button
            key={s}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(s)}
            className={`border px-3 py-1.5 text-sm font-bold tabular-nums transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue ${
              active ? "border-navy bg-navy text-white dark:border-blue dark:bg-blue" : "border-line bg-surface text-foreground hover:border-blue"
            }`}
          >
            {s === "all" ? "全年度" : s}
          </button>
        );
      })}
    </div>
  );
}

/** 各サラリー画面の下部に置く、データ出典と注意書き */
export function SalarySourceNote() {
  return (
    <footer className="mt-10 border-t border-line pt-5 text-xs leading-6 text-muted">
      <p>
        データ出典：<span className="font-semibold text-foreground">{SALARY_SOURCE_LABEL}</span>
      </p>
      <ul className="mt-1 list-disc space-y-0.5 pl-5">
        <li>金額は米ドル（各年度の年俸）。空欄は「—」で表示しています。</li>
        <li>契約状況のオプション（PO・TO）は、出典で選手・年度・金額が一致したものだけを表示しています。「—」でもオプションがないとは限りません。</li>
        <li>契約の状況は今後のトレード・契約・解雇などで変わります。</li>
      </ul>
    </footer>
  );
}
