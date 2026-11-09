import Link from "next/link";

// レジェンド枠のサブタブ(レジェンド一覧 / オールタイムリーダーズ)
const TABS = [
  { href: "/legends", key: "list", label: "レジェンド一覧" },
  { href: "/legends/leaders", key: "leaders", label: "オールタイムリーダーズ" },
] as const;

export function LegendsTabs({ current }: { current: (typeof TABS)[number]["key"] }) {
  return (
    <nav aria-label="レジェンドのメニュー" className="mb-6 flex gap-5 border-b border-line">
      {TABS.map((t) => (
        <Link
          key={t.key}
          href={t.href}
          aria-current={current === t.key ? "page" : undefined}
          className={`-mb-px border-b-2 pb-2.5 text-[14px] font-bold transition-colors ${
            current === t.key ? "border-blue text-foreground" : "border-transparent text-muted hover:border-line hover:text-foreground"
          }`}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
