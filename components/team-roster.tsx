import type { Database } from "@/lib/supabase/types";

type Player = Database["public"]["Tables"]["players"]["Row"];

export function TeamRoster({ players }: { players: Player[] }) {
  if (players.length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        在籍選手データがありません。
      </p>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {players.map((player) => (
        <li
          key={player.id}
          className="rounded-lg border border-black/[.08] p-4 dark:border-white/[.145]"
        >
          <p className="text-base font-semibold">{player.full_name}</p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {player.position ?? "-"}
          </p>
        </li>
      ))}
    </ul>
  );
}
