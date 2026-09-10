import type { Database } from "@/lib/supabase/types";

type Team = Database["public"]["Tables"]["teams"]["Row"];

export function TeamList({ teams }: { teams: Team[] }) {
  if (teams.length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        チームデータがありません。
      </p>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {teams.map((team) => (
        <li
          key={team.id}
          className="rounded-lg border border-black/[.08] p-4 dark:border-white/[.145]"
        >
          <p className="text-base font-semibold">{team.name}</p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {team.abbreviation} ・ {team.conference} / {team.division}
          </p>
        </li>
      ))}
    </ul>
  );
}
