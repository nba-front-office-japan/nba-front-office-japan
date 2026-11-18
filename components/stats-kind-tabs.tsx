import Link from "next/link";

// スタッツ(/stats)の「選手｜チーム」切り替え。選手は /stats、チームは /stats/teams(別ページ・別URL)。
export function StatsKindTabs({ active }: { active: "players" | "teams" }) {
  const tabs = [
    { key: "players", label: "選手", href: "/stats" },
    { key: "teams", label: "チーム", href: "/stats/teams" },
  ] as const;
  return (
    <nav aria-label="スタッツの種類" className="mb-5 flex gap-1 border-b border-line">
      {tabs.map((tab) =>
        tab.key === active ? (
          <span key={tab.key} aria-current="page" className="-mb-px border-b-[3px] border-blue px-4 py-2.5 text-sm font-extrabold text-blue">
            {tab.label}
          </span>
        ) : (
          <Link key={tab.key} href={tab.href} className="-mb-px border-b-[3px] border-transparent px-4 py-2.5 text-sm font-bold text-muted hover:border-line hover:text-foreground">
            {tab.label}
          </Link>
        )
      )}
    </nav>
  );
}
