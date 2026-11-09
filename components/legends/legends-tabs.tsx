import Link from "next/link";

// レジェンド枠のサブタブ(レジェンド一覧 / オールタイムリーダーズ)。大きめのボタンで、選択中は青地に白文字
const TABS = [
  { href: "/legends", key: "list", label: "レジェンド一覧", sub: "75周年記念チーム 76人" },
  { href: "/legends/leaders", key: "leaders", label: "オールタイムリーダーズ", sub: "歴代記録・ランキング" },
] as const;

export function LegendsTabs({ current }: { current: (typeof TABS)[number]["key"] }) {
  return (
    <nav aria-label="レジェンドのメニュー" className="mb-7 grid grid-cols-2 gap-2.5 sm:flex sm:gap-3">
      {TABS.map((t) => {
        const on = current === t.key;
        return (
          <Link
            key={t.key}
            href={t.href}
            aria-current={on ? "page" : undefined}
            className={`group selection-button selection-blue flex flex-col rounded-lg border-2 px-3 py-2.5 sm:min-w-[240px] sm:px-5 sm:py-3 ${
              on ? "border-blue bg-blue text-white shadow-sm" : "border-line bg-surface text-foreground hover:border-blue"
            }`}
          >
            <span className="whitespace-nowrap text-[13px] font-extrabold leading-snug tracking-tight sm:text-[17px] sm:tracking-normal">{t.label}</span>
            <span className={`mt-0.5 text-[11px] font-bold sm:text-xs ${on ? "text-white/80" : "text-muted group-hover:text-white/80"}`}>{t.sub}</span>
          </Link>
        );
      })}
    </nav>
  );
}
