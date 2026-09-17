import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/page-shell";
import {
  AWARDS_SEASON,
  INDIVIDUAL_AWARD_KEYS,
  TEAM_AWARDS,
  getAwardLabel,
} from "@/lib/awards/constants";
import type { Database } from "@/lib/supabase/types";

type AwardRow = Database["public"]["Tables"]["season_player_awards"]["Row"];

interface WinnerDisplay {
  playerId: string;
  name: string;
  teamAbbr: string | null;
}

export default async function AwardsPage() {
  const supabase = createServerSupabaseClient();

  // season_player_awardsのマイグレーション未実行時はdataがnullになるだけなので、
  // player_season_rosters（2026-27ロスター）と同様にエラーは無視して「準備中」表示にする。
  const { data: awards } = await supabase
    .from("season_player_awards")
    .select("*")
    .eq("season", AWARDS_SEASON);

  const rows = awards ?? [];
  const playerIds = [...new Set(rows.map((r) => r.player_id))];
  const teamIds = [
    ...new Set(rows.map((r) => r.team_id).filter((id): id is string => id !== null)),
  ];

  const [{ data: players }, { data: teams }] = await Promise.all([
    supabase.from("players").select("id, full_name, full_name_ja").in("id", playerIds),
    supabase.from("teams").select("id, abbreviation").in("id", teamIds),
  ]);

  const playerById = new Map((players ?? []).map((p) => [p.id, p]));
  const teamAbbrById = new Map((teams ?? []).map((t) => [t.id, t.abbreviation]));

  function groupWinners(predicate: (r: AwardRow) => boolean): WinnerDisplay[] {
    return rows
      .filter(predicate)
      .sort((a, b) => a.display_order - b.display_order)
      .map((r) => {
        const player = playerById.get(r.player_id);
        return {
          playerId: r.player_id,
          name: player?.full_name_ja ?? player?.full_name ?? "不明な選手",
          teamAbbr: r.team_id ? teamAbbrById.get(r.team_id) ?? null : null,
        };
      });
  }

  const individualGroups = INDIVIDUAL_AWARD_KEYS.map((key) => ({
    key,
    label: getAwardLabel(key, null),
    winners: groupWinners((r) => r.award_key === key),
  })).filter((g) => g.winners.length > 0);

  const teamGroups = TEAM_AWARDS.flatMap(({ key, selectionTeams }) =>
    selectionTeams.map((selectionTeam) => ({
      key: `${key}-${selectionTeam}`,
      label: getAwardLabel(key, selectionTeam),
      winners: groupWinners(
        (r) => r.award_key === key && r.selection_team === selectionTeam
      ),
    }))
  ).filter((g) => g.winners.length > 0);

  const hasAnyAward = rows.length > 0;

  return (
    <PageShell>
      <div className="-mx-4 bg-navy px-4 py-8 text-white sm:-mx-7 sm:px-7 sm:py-[29px]">
        <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[1.3px] text-[#84b0ff]">
          Awards Database · 2025-26 Season
        </p>
        <h1 className="text-[28px] font-semibold tracking-tight sm:text-[36px]">
          2025-26 NBA Awards
        </h1>
        <p className="mt-1 text-sm text-slate-300">
          個人賞・オールNBA等の選出結果を収録する。
        </p>
      </div>

      {!hasAnyAward ? (
        <div className="mt-8 border border-line bg-surface p-10 text-center">
          <p className="text-lg font-bold">アワード情報を準備中</p>
          <p className="mt-2 text-sm text-muted">
            2025-26シーズンのアワード情報はまだ登録されていません。
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-10">
          {individualGroups.length > 0 && (
            <section>
              <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">
                Individual Awards
              </p>
              <h2 className="mb-4 text-xl font-semibold">個人賞</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {individualGroups.map((group) => (
                  <div key={group.key} className="border border-line bg-surface p-5">
                    <p className="mb-3 text-sm font-bold text-muted">{group.label}</p>
                    <ul className="space-y-2">
                      {group.winners.map((winner) => (
                        <li key={winner.playerId} className="border-l-[3px] border-gold pl-3">
                          <Link
                            href={`/players/${winner.playerId}`}
                            className="text-base font-extrabold hover:text-blue"
                          >
                            {winner.name}
                          </Link>
                          {winner.teamAbbr && (
                            <span className="ml-2 text-xs text-muted">
                              {winner.teamAbbr}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          )}

          {teamGroups.length > 0 && (
            <section>
              <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">
                All-NBA / All-Defensive / All-Rookie
              </p>
              <h2 className="mb-4 text-xl font-semibold">ベストチーム</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {teamGroups.map((group) => (
                  <div key={group.key} className="border border-line bg-surface p-5">
                    <p className="mb-3 text-sm font-bold text-muted">{group.label}</p>
                    <ul className="space-y-2">
                      {group.winners.map((winner) => (
                        <li key={winner.playerId} className="border-l-[3px] border-gold pl-3">
                          <Link
                            href={`/players/${winner.playerId}`}
                            className="text-base font-extrabold hover:text-blue"
                          >
                            {winner.name}
                          </Link>
                          {winner.teamAbbr && (
                            <span className="ml-2 text-xs text-muted">
                              {winner.teamAbbr}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </PageShell>
  );
}
