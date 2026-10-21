"use client";

import { useState, type ReactNode } from "react";

const TABS = ["Overview", "Profile", "Stats", "Team Profile"] as const;
export type TeamTab = (typeof TABS)[number];

const TAB_BASE =
  "whitespace-nowrap border-b-[3px] py-3.5 text-[13px] font-bold transition-colors";
const TAB_IDLE = "border-transparent text-muted hover:text-foreground";

// チームページの Overview / Profile / Stats / Team Profile を画面内で切り替える。
// teamProfile を渡さない場合、Team Profile タブは出さない。
export function TeamTabs({
  overview,
  profile,
  stats,
  teamProfile,
  initialTab = "Overview",
}: {
  overview: ReactNode;
  profile: ReactNode;
  stats: ReactNode;
  teamProfile?: ReactNode;
  initialTab?: TeamTab;
}) {
  const tabs = TABS.filter((t) => t !== "Team Profile" || teamProfile !== undefined);
  const [tab, setTab] = useState<TeamTab>(tabs.includes(initialTab) ? initialTab : "Overview");
  const content: Record<TeamTab, ReactNode> = {
    Overview: overview,
    Profile: profile,
    Stats: stats,
    "Team Profile": teamProfile,
  };

  return (
    <div>
      <div className="flex gap-6 overflow-x-auto border-b border-line">
        {tabs.map((t) => (
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
