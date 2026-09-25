"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";

const TABS = ["Overview", "Roster", "Stats"] as const;
export type TeamTab = (typeof TABS)[number];

const TAB_BASE =
  "whitespace-nowrap border-b-[3px] py-3.5 text-[13px] font-bold transition-colors";
const TAB_IDLE = "border-transparent text-muted hover:text-foreground";

// Overview / Roster / Stats は画面内で切り替え、Team Profile は別ページ(profileHref)へ移動する。
export function TeamTabs({
  overview,
  roster,
  stats,
  initialTab = "Overview",
  profileHref,
}: {
  overview: ReactNode;
  roster: ReactNode;
  stats: ReactNode;
  initialTab?: TeamTab;
  profileHref?: string;
}) {
  const [tab, setTab] = useState<TeamTab>(initialTab);
  const content: Record<TeamTab, ReactNode> = { Overview: overview, Roster: roster, Stats: stats };

  return (
    <div>
      <div className="flex gap-6 overflow-x-auto border border-line bg-surface px-4">
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
        {profileHref && (
          <Link href={profileHref} className={`${TAB_BASE} ${TAB_IDLE}`}>
            Team Profile
          </Link>
        )}
      </div>
      <div className="mt-6">{content[tab]}</div>
    </div>
  );
}
