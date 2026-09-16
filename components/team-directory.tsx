import Link from "next/link";
import type { Database } from "@/lib/supabase/types";

type Team = Database["public"]["Tables"]["teams"]["Row"];

const DIVISION_ORDER: Record<string, string[]> = {
  East: ["Atlantic", "Central", "Southeast"],
  West: ["Northwest", "Pacific", "Southwest"],
};

const CONFERENCE_LABEL: Record<string, string> = {
  East: "Eastern Conference",
  West: "Western Conference",
};

export function TeamDirectory({
  teams,
  activeTeamId,
}: {
  teams: Team[];
  activeTeamId?: string;
}) {
  if (teams.length === 0) {
    return <p className="text-sm text-muted">チームデータがありません。</p>;
  }

  const conferences: ("East" | "West")[] = ["East", "West"];

  return (
    <div className="space-y-7">
      {conferences.map((conference) => {
        const divisions = DIVISION_ORDER[conference];
        const conferenceTeams = teams.filter((t) => t.conference === conference);
        if (conferenceTeams.length === 0) return null;

        return (
          <section key={conference}>
            <div className="mb-3.5 flex items-baseline gap-2.5">
              <h2 className="text-xl font-semibold tracking-tight">
                {CONFERENCE_LABEL[conference]}
              </h2>
              <span className="text-[11px] font-extrabold tracking-wide text-muted">
                {conference.toUpperCase()}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              {divisions.map((division) => {
                const divisionTeams = conferenceTeams
                  .filter((t) => t.division === division)
                  .sort((a, b) => a.name.localeCompare(b.name));
                if (divisionTeams.length === 0) return null;
                return (
                  <div
                    key={division}
                    className="border-t-2 border-foreground pt-2.5"
                  >
                    <h3 className="mb-2 text-[13px] font-bold">{division}</h3>
                    {divisionTeams.map((team) => {
                      const isActive = team.id === activeTeamId;
                      return (
                        <Link
                          key={team.id}
                          href={`/teams/${team.id}`}
                          className={`flex items-center gap-2.5 border-t border-line py-2.5 text-sm font-bold ${
                            isActive ? "text-blue" : "hover:text-blue"
                          }`}
                        >
                          <span
                            className={`inline-grid h-[30px] w-[30px] flex-none place-items-center rounded-full text-[10px] tracking-wide ${
                              isActive
                                ? "bg-blue text-white"
                                : "bg-[#eaf1ff] text-[#2457b7]"
                            }`}
                          >
                            {team.abbreviation}
                          </span>
                          <span>{team.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
