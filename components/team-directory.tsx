import Link from "next/link";
import type { Database } from "@/lib/supabase/types";
import { DEFAULT_SEASON, seasonSearch } from "@/lib/seasons";
import { teamNameJa } from "@/lib/team-names-ja";
import { teamThemeBackground } from "@/lib/team-colors";

type Team = Database["public"]["Tables"]["teams"]["Row"];

const DIVISION_ORDER: Record<string, string[]> = {
  East: ["Atlantic", "Central", "Southeast"],
  West: ["Northwest", "Pacific", "Southwest"],
};

const CONFERENCE_LABEL: Record<string, string> = {
  East: "イースタン・カンファレンス",
  West: "ウエスタン・カンファレンス",
};

const DIVISION_LABEL: Record<string, string> = {
  Atlantic: "アトランティック",
  Central: "セントラル",
  Southeast: "サウスイースト",
  Northwest: "ノースウェスト",
  Pacific: "パシフィック",
  Southwest: "サウスウェスト",
};

// チーム名はチームページ(Overview)へ。その下の Profile / Stats / Team Profile は該当タブを直接開く。
// season は表示中のシーズン(リンク先も同じシーズンで開く)。
export function TeamDirectory({
  teams,
  activeTeamId,
  season = DEFAULT_SEASON,
}: {
  teams: Team[];
  activeTeamId?: string;
  season?: number;
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
                    <h3 className="mb-2 text-[13px] font-bold">{DIVISION_LABEL[division] ?? division}</h3>
                    {divisionTeams.map((team) => {
                      const isActive = team.id === activeTeamId;
                      const japaneseName = teamNameJa(team.abbreviation) ?? team.name;
                      return (
                        <div key={team.id} className="border-t border-line py-2.5">
                          <Link
                            href={`/teams/${team.id}${seasonSearch(season)}`}
                            className={`group flex items-center gap-2.5 border border-transparent px-2 py-1.5 text-sm font-bold transition-all duration-200 ${
                              isActive ? "bg-[#eef4ff] text-blue" : "hover:-translate-y-0.5 hover:border-[#c7d8fb] hover:bg-[#f6f9ff] hover:shadow-sm hover:text-blue"
                            }`}
                          >
                            <span
                              className={`inline-grid h-[30px] w-[30px] flex-none place-items-center rounded-full text-[10px] tracking-wide text-white transition-transform duration-200 group-hover:scale-105 ${
                                isActive
                                  ? "ring-2 ring-offset-2 ring-blue"
                                  : ""
                              }`}
                              style={{ backgroundColor: teamThemeBackground(team.abbreviation) ?? "#2457b7" }}
                            >
                              {team.abbreviation}
                            </span>
                            <span className="min-w-0">
                              <span className="block">{japaneseName}</span>
                              <span className="block text-[10px] font-semibold tracking-wide text-muted">{team.name}</span>
                            </span>
                          </Link>
                          {/* チームページの各タブを直接開く(?tab= は /teams/[teamId] が受け付ける値) */}
                          <div className="ml-10 mt-1.5 flex flex-wrap gap-2">
                            {[
                              { label: "Profile", href: `/teams/${team.id}${seasonSearch(season, { tab: "profile" })}` },
                              { label: "Stats", href: `/teams/${team.id}${seasonSearch(season, { tab: "stats" })}` },
                              { label: "Team Profile", href: `/teams/${team.id}${seasonSearch(season, { tab: "team-profile" })}` },
                            ].map((link) => (
                              <Link
                                key={link.label}
                                href={link.href}
                                aria-label={`${team.name} ${link.label}`}
                                className="inline-flex min-h-9 min-w-[72px] items-center justify-center border border-line px-3 text-xs font-bold text-blue hover:border-blue"
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
