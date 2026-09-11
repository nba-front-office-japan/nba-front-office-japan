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
        className="mb-6 w-full max-w-sm rounded-md border border-black/[.08] bg-transparent px-3 py-2 text-sm outline-none focus:border-black/[.3] dark:border-white/[.145] dark:focus:border-white/[.4]"
      />

      <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
        {filtered.length}件表示中（全{players.length}件）
      </p>

      {filtered.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          該当する選手が見つかりません。
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {filtered.map((player) => (
            <li key={player.id}>
              <Link
                href={`/players/${player.id}`}
                className="block rounded-lg border border-black/[.08] p-4 transition-colors hover:border-black/[.2] dark:border-white/[.145] dark:hover:border-white/[.3]"
              >
                <p className="text-base font-semibold">{player.fullName}</p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {player.position ?? "-"}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
