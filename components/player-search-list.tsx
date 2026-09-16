"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

export interface PlayerListItem {
  id: string;
  fullName: string;
  position: string | null;
}

export function PlayerSearchList({ players }: { players: PlayerListItem[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return players;
    return players.filter((p) => p.fullName.toLowerCase().includes(q));
  }, [players, query]);

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="選手名で検索"
        className="mb-6 w-full max-w-sm border border-line bg-surface px-3 py-2.5 text-sm outline-none focus:border-blue"
      />

      <p className="mb-4 text-sm text-muted">
        {filtered.length}件表示中（全{players.length}件）
      </p>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted">該当する選手が見つかりません。</p>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
          {filtered.map((player) => (
            <li key={player.id}>
              <Link
                href={`/players/${player.id}`}
                className="block border-l-[3px] border-blue bg-[#f3f6fb] p-3.5 transition-colors hover:bg-[#eaf1ff] dark:bg-white/[.04] dark:hover:bg-white/[.07]"
              >
                <p className="text-sm font-extrabold">{player.fullName}</p>
                <p className="text-xs text-muted">{player.position ?? "-"}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
