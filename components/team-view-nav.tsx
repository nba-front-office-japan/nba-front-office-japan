import Link from "next/link";

const TAB_BASE =
  "whitespace-nowrap border-b-[3px] py-3.5 text-[13px] font-bold transition-colors";
const TAB_IDLE = "border-transparent text-muted hover:text-foreground";

// Team Profile 表示中に、チーム成績ページの Overview / Roster / Stats へ戻るためのタブ行。
// 見た目は TeamTabs と揃え、Team Profile を選択中として表示する。
export function TeamViewNav({ teamId }: { teamId: string }) {
  const items = [
    { label: "Overview", href: `/teams/${teamId}` },
    { label: "Roster", href: `/teams/${teamId}?tab=roster` },
    { label: "Stats", href: `/teams/${teamId}?tab=stats` },
  ];

  return (
    <nav
      aria-label="チームページ"
      className="flex gap-6 overflow-x-auto border border-line bg-surface px-4"
    >
      {items.map((item) => (
        <Link key={item.label} href={item.href} className={`${TAB_BASE} ${TAB_IDLE}`}>
          {item.label}
        </Link>
      ))}
      <span aria-current="page" className={`${TAB_BASE} border-blue text-blue`}>
        Team Profile
      </span>
    </nav>
  );
}
