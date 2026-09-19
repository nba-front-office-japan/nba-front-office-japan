"use client";

import { useState } from "react";
import type { DraftPick } from "@/lib/draft/draft-2026-picks";

const COLUMNS = ["Pick", "Player", "Team", "POS", "Pre-Draft Team", "Height", "Weight", "Nationality"];

export function DraftBoard({ picks }: { picks: DraftPick[] }) {
  const [round, setRound] = useState<1 | 2>(1);

  const rows = picks
    .filter((p) => p.round === round)
    .sort((a, b) => a.pickInRound - b.pickInRound);

  return (
    <div>
      <div className="mb-6 flex gap-2">
        {([1, 2] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRound(r)}
            className={`px-4 py-2 text-sm font-bold transition-colors ${
              round === r
                ? "bg-blue text-white"
                : "border border-line text-muted hover:text-foreground"
            }`}
          >
            {r === 1 ? "1巡目" : "2巡目"}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto border border-line bg-surface">
        <table className="w-full min-w-[900px] border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-line">
              {COLUMNS.map((label) => (
                <th
                  key={label}
                  className="whitespace-nowrap px-2 py-2.5 text-left text-[11px] font-bold text-muted"
                >
                  {label === "Team" ? "Team(指名先・トレード情報)" : label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.overallPick}
                className="border-b border-line/60 hover:bg-[#f6f9ff] dark:hover:bg-white/[.03]"
                title={row.draftStatus}
              >
                <td className="whitespace-nowrap px-2 py-3 font-semibold text-muted">
                  {row.pickInRound}
                </td>
                <td className="whitespace-nowrap px-2 py-3 font-semibold">
                  <div>{row.playerNameJa}</div>
                  <div className="text-xs font-normal text-muted">{row.playerNameEn}</div>
                </td>
                <td className="px-2 py-3">{row.teamDisplay}</td>
                <td className="whitespace-nowrap px-2 py-3">{row.position ?? "—"}</td>
                <td className="px-2 py-3">{row.preDraftTeam ?? "—"}</td>
                <td className="whitespace-nowrap px-2 py-3">
                  {row.heightCm !== null ? `${row.heightCm} cm` : "—"}
                </td>
                <td className="whitespace-nowrap px-2 py-3">
                  {row.weightKg !== null ? `${row.weightKg} kg` : "—"}
                </td>
                <td className="whitespace-nowrap px-2 py-3">{row.nationality ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
