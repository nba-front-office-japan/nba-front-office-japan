"use client";

import { useState, type ReactNode } from "react";

const TABS = ["Overview", "Roster", "Stats"] as const;
export type TeamTab = (typeof TABS)[number];

const TAB_BASE =
  "whitespace-nowrap border-b-[3px] py-3.5 text-[13px] font-bold transition-colors";
const TAB_IDLE = "border-transparent text-muted hover:text-foreground";

// 2025-26 チーム記録の Overview / Roster / Stats を画面内で切り替える。
// (Team Profile は選手名鑑 2026 の /players/guide/[teamId]?view=team-profile に移した)
export function TeamTabs({
  overview,
  roster,
  stats,
  initialTab = "Overview",
}: {
  overview: ReactNode;
  roster: ReactNode;
  stats: ReactNode;
  initialTab?: TeamTab;
}) {
  const [tab, setTab] = useState<TeamTab>(initialTab);
  const content: Record<TeamTab, ReactNode> = { Overview: overview, Roster: roster, Stats: stats };

  return (
    <div>
      <div className="flex gap-6 overflow-x-auto border-b border-line">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`${TAB_BASE} ${
              tab === t ? "border-blue text-blue" : TAB_IDLE
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="mt-6">{content[tab]}</div>
    </div>
  );
}
