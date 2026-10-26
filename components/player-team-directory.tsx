import Link from "next/link";
import type { CSSProperties } from "react";
import { DEFAULT_SEASON, seasonSearch } from "@/lib/seasons";
import { teamThemeBackground } from "@/lib/team-colors";

export interface TeamListItem {
  id: string;
  name: string;
  abbreviation: string;
  conference: "East" | "West";
  division: string;
}

const DIVISION_ORDER: Record<string, string[]> = {
  East: ["Atlantic", "Central", "Southeast"],
  West: ["Northwest", "Pacific", "Southwest"],
};

const CONFERENCE_LABEL: Record<string, string> = {
  East: "Eastern Conference",
  West: "Western Conference",
};

// チーム名クリックで選手名鑑Profile(/players/guide/[teamId])へ進む一覧。
// チーム名の下の導線は「Profile / Stats / Team Profile(/players/guide/[teamId]?view=team-profile)」。
// 選手名・チームPPG・3P%・今季成績などは出さない。season は表示中のシーズン(リンク先も同じシーズンで開く)。
export function PlayerTeamDirectory({
  teams,
  season = DEFAULT_SEASON,
}: {
  teams: TeamListItem[];
  season?: number;
}) {
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
                  <div key={division} className="border-t-2 border-foreground pt-2.5">
                    <h3 className="mb-2 text-[13px] font-bold">{division}</h3>
                    {divisionTeams.map((team) => {
                      const teamAccent = teamThemeBackground(team.abbreviation) ?? "#2457b7";
                      const teamStyle = {
                        "--team-accent": teamAccent,
                        "--team-tint": `${teamAccent}18`,
                      } as CSSProperties;
                      return (
                        <div key={team.id} className="border-t border-line py-2.5" style={teamStyle}>
                          <Link
                            href={`/players/guide/${team.id}${seasonSearch(season)}`}
                            className="selection-button selection-team group flex items-center gap-2.5 rounded-xl border border-transparent px-2 py-1.5 text-sm font-bold transition-all duration-200 hover:-translate-y-1 hover:scale-[1.025] hover:border-[var(--team-accent)] hover:bg-[var(--team-accent)] hover:text-white hover:shadow-lg active:translate-y-1 active:scale-[0.93] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--team-accent)]"
                          >
                            <span
                              className="inline-grid h-[30px] w-[30px] flex-none place-items-center rounded-full text-[10px] tracking-wide text-white transition-transform duration-200 group-hover:scale-105"
                              style={{ backgroundColor: teamAccent }}
                            >
                              {team.abbreviation}
                            </span>
                            <span>{team.name}</span>
                          </Link>
                          <div className="ml-10 mt-1.5 flex flex-wrap gap-2">
                            {[
                              { label: "Profile", href: `/players/guide/${team.id}${seasonSearch(season)}` },
                              { label: "Stats", href: `/players/guide/${team.id}${seasonSearch(season, { view: "stats" })}` },
                              { label: "Team Profile", href: `/players/guide/${team.id}${seasonSearch(season, { view: "team-profile" })}` },
                            ].map((link) => (
                              <Link
                                key={link.label}
                                href={link.href}
                                className="selection-button selection-team inline-flex min-h-9 min-w-[72px] items-center justify-center rounded-lg border border-line px-3 text-xs font-bold text-blue transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.06] hover:border-[var(--team-accent)] hover:bg-[var(--team-accent)] hover:text-white hover:shadow-lg active:translate-y-1 active:scale-[0.92] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--team-accent)]"
                              >
                                {link.label}
                              </Link>
                            ))}
                          </div>
                        </div>
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
