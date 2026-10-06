import Link from "next/link";
import { OPTION_LABEL, OPTION_SHORT, SALARY_SEASONS, SALARY_SOURCE_LABEL, type SalaryOption, type SalarySeason } from "@/lib/salary/types";

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

/** オプションの目印(PO=選手オプション、TO=チームオプション) */
export function OptionBadge({ type, season }: { type: SalaryOption["type"]; season?: SalarySeason }) {
  const color =
    type === "player"
      ? "bg-[#e5f0ff] text-[#1d4f9a] dark:bg-[#1d3557] dark:text-[#bcd6ff]"
      : "bg-[#fff0cd] text-[#7a5200] dark:bg-[#4a3a12] dark:text-[#ffd27a]";
  return (
    <span title={`${season ? `${season} ` : ""}${OPTION_LABEL[type]}`} className={`inline-block whitespace-nowrap px-1.5 py-0.5 text-[11px] font-bold ${color}`}>
      {season ? `${season} ` : ""}
      {OPTION_SHORT[type]}
    </span>
  );
}

export function OptionList({ options }: { options: SalaryOption[] }) {
  if (options.length === 0) return <span className="text-muted">—</span>;
  return (
    <span className="flex flex-wrap gap-1">
      {options.map((o) => (
        <OptionBadge key={o.season} type={o.type} season={o.season} />
      ))}
    </span>
  );
}

export function OptionLegend() {
  return (
    <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
      <span className="flex items-center gap-1.5">
        <OptionBadge type="player" />
        選手オプション（選手が契約を続けるか選べる年）
      </span>
      <span className="flex items-center gap-1.5">
        <OptionBadge type="team" />
        チームオプション（チームが契約を続けるか選べる年）
      </span>
    </p>
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
        <li>オプションは、出典で選手・年度・金額が一致したものだけを表示しています。「—」でもオプションがないとは限りません。</li>
        <li>契約の状況は今後のトレード・契約・解雇などで変わります。</li>
      </ul>
    </footer>
  );
}
