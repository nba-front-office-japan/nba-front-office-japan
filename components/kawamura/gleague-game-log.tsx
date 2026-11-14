"use client";

// 河村勇輝の Game Log の Gリーグ試合別成績。シーズン(今季・過去)をボタンで切り替える。
// 行はサーバー側で表示用に整えたものを受け取る(データファイルはブラウザに送らない)。
import { useState } from "react";
import { KawamuraGameTable, type KawamuraGameRow } from "@/components/kawamura/kawamura-game-table";

export type GLeagueLogSeason = {
  season: number;
  label: string;
  teamJa: string;
  rows: KawamuraGameRow[];
};

export function GLeagueGameLog({ seasons }: { seasons: GLeagueLogSeason[] }) {
  const [selected, setSelected] = useState(seasons[0]?.season ?? 0);
  const current = seasons.find((s) => s.season === selected) ?? seasons[0];
  if (!current) return null;

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {seasons.map((s) => (
          <button
            key={s.season}
            type="button"
            onClick={() => setSelected(s.season)}
            aria-pressed={s.season === current.season}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              s.season === current.season ? "bg-blue text-white" : "border border-line text-muted hover:text-foreground"
            }`}
          >
            {s.label}
            <span className="ml-1 text-xs opacity-80">{s.teamJa}</span>
          </button>
        ))}
      </div>
      <p className="mb-3 text-sm font-semibold">
        {current.label} {current.teamJa}
        <span className="ml-2 text-xs font-normal text-muted">{current.rows.length}試合</span>
      </p>
      <KawamuraGameTable
        rows={current.rows}
        showPlusMinus
        emptyText={`${current.label}のGリーグの出場試合はまだありません。`}
      />
    </div>
  );
}
