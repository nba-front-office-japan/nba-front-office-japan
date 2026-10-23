"use client";

import { useState, type ReactNode } from "react";

const TABS = ["Profile", "Stats", "Team Profile"] as const;
export type TeamTab = (typeof TABS)[number];

const TAB_BASE =
  "whitespace-nowrap border-b-[3px] py-3.5 text-[13px] font-bold transition-colors";
const TAB_IDLE = "border-transparent text-muted hover:text-foreground";

// チームページの Profile / Stats / Team Profile を画面内で切り替える。初期表示は Team Profile(チームの概要)。
export function TeamTabs({
  profile,
  stats,
  teamProfile,
  initialTab = "Team Profile",
}: {
  profile: ReactNode;
  stats: ReactNode;
  teamProfile: ReactNode;
  initialTab?: TeamTab;
}) {
  const [tab, setTab] = useState<TeamTab>(initialTab);
  const content: Record<TeamTab, ReactNode> = {
    Profile: profile,
    Stats: stats,
    "Team Profile": teamProfile,
  };

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
