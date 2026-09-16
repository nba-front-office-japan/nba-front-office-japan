"use client";

import { useState, type ReactNode } from "react";

const TABS = ["Overview", "Roster", "Stats"] as const;
type Tab = (typeof TABS)[number];

export function TeamTabs({
  overview,
  roster,
  stats,
}: {
  overview: ReactNode;
  roster: ReactNode;
  stats: ReactNode;
}) {
  const [tab, setTab] = useState<Tab>("Overview");
  const content: Record<Tab, ReactNode> = { Overview: overview, Roster: roster, Stats: stats };

  return (
    <div>
      <div className="flex gap-6 overflow-x-auto border border-line bg-surface px-4">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`whitespace-nowrap border-b-[3px] py-3.5 text-[13px] font-bold transition-colors ${
              tab === t
                ? "border-blue text-blue"
                : "border-transparent text-muted hover:text-foreground"
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
