"use client";

import { useState, type CSSProperties, type ReactNode } from "react";

const TABS = ["Profile", "Stats", "Team Profile"] as const;
export type TeamTab = (typeof TABS)[number];

const TAB_BASE =
  "whitespace-nowrap border-b-[3px] px-2 py-3.5 text-[13px] font-bold transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--team-tab-accent)]";
const TAB_IDLE =
  "border-transparent text-muted hover:-translate-y-0.5 hover:scale-[1.06] hover:border-[var(--team-tab-accent)] hover:bg-[var(--team-tab-accent)] hover:text-white hover:shadow-lg active:translate-y-1 active:scale-[0.92]";

// チームページの Profile / Stats / Team Profile を画面内で切り替える。初期表示は Team Profile(チームの概要)。
export function TeamTabs({
  profile,
  stats,
  teamProfile,
  initialTab = "Team Profile",
  accent = "#1f63e9",
}: {
  profile: ReactNode;
  stats: ReactNode;
  teamProfile: ReactNode;
  initialTab?: TeamTab;
  /** 選択・ホバー時に使うチーム固有色 */
  accent?: string;
}) {
  const [tab, setTab] = useState<TeamTab>(initialTab);
  const content: Record<TeamTab, ReactNode> = {
    Profile: profile,
    Stats: stats,
    "Team Profile": teamProfile,
  };

  return (
    <div>
      <div
        className="flex gap-3 overflow-x-auto border-b border-line"
        style={{
          "--team-accent": accent,
          "--team-tab-accent": accent,
          "--team-tab-tint": `${accent}20`,
        } as CSSProperties}
      >
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`${TAB_BASE} ${
              tab === t
                ? "selection-button border-white bg-surface text-[var(--team-tab-accent)] shadow-sm"
                : `selection-button selection-team ${TAB_IDLE}`
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
