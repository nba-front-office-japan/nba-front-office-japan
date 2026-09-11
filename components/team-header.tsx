import type { Database } from "@/lib/supabase/types";

type Team = Database["public"]["Tables"]["teams"]["Row"];

export function TeamHeader({ team }: { team: Team }) {
  return (
    <div className="mb-8">
      <h1 className="text-2xl font-semibold">{team.name}</h1>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        {team.abbreviation} ・ {team.conference} / {team.division}
      </p>
    </div>
  );
}
