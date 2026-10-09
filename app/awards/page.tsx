import type { Metadata } from "next";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/page-shell";
import { HISTORY_AWARDS, TEAM_LABEL, seasonLabel, type HistoryAwardKey } from "@/lib/awards/history";
import { SeasonSelect } from "./season-select";

// 年度別アワード。管理画面で取り込んだ表彰履歴(player_award_records)を年度ごとに表示する。
// 表彰履歴は「現在サイトに登録されている選手」の過去の受賞歴なので、引退選手などは含まれない。
// NBA全体の公式の年度別受賞者一覧と誤解されないよう、ページ上部に注記する。
// 年度は URL(?season=2023-24)で指定し、指定がない・データがない年度なら最新の年度を表示する。

// DBの日本語名が明らかに崩れている選手は、誤った表記を出さないよう日本語名を使わず英語名のみ表示する。
// (DBの修正は別作業。修正後はこの一覧から外す)
const SUSPECT_JA_NAMES = new Set(["ジエルエムイアハ・フィアーズ", "コリン・ムウルルエイ＝ブオイルエス"]);

const MAJOR_KEYS: HistoryAwardKey[] = [
  "mvp",
  "finals_mvp",
  "defensive_player_of_the_year",
  "rookie_of_the_year",
  "most_improved_player",
  "sixth_man_of_the_year",
  "all_star_mvp",
];
const TEAM_KEYS: HistoryAwardKey[] = ["all_nba", "all_defensive", "all_rookie"];

type Winner = { playerId: string; name: string; ja: string | null; awardTeam: string | null };
type Rec = { player_id: string; season: number; award_key: string; selection_team: number | null; award_team: string | null };

function parseSeasonParam(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const m = /^(\d{4})-(\d{2})$/.exec(value);
  if (!m) return null;
  const start = Number(m[1]);
  return (start + 1) % 100 === Number(m[2]) ? start : null;
}

async function fetchRecords(): Promise<Rec[]> {
  const supabase = createServerSupabaseClient();
  const rows: Rec[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from("player_award_records")
      .select("player_id, season, award_key, selection_team, award_team")
      .order("id")
      .range(from, from + 999);
    if (error) return rows;
    rows.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  return rows;
}

export async function generateMetadata({ searchParams }: PageProps<"/awards">): Promise<Metadata> {
  const { season } = await searchParams;
  const start = parseSeasonParam(season);
  const label = start !== null ? seasonLabel(start) : "年度別";
  return {
    title: `${label} アワード（登録選手の受賞歴） | NBA Front Office Japan`,
    description: "現在サイトに登録されている選手の過去の受賞歴（MVP・All-NBA・オールスターなど）を年度別に表示します。",
  };
}

function WinnerItem({ winner }: { winner: Winner }) {
  const ja = winner.ja && !SUSPECT_JA_NAMES.has(winner.ja) ? winner.ja : null;
  return (
    <li className="min-w-0 border-l-[3px] border-gold pl-3">
      <Link href={`/players/${winner.playerId}`} className="block break-words text-base font-extrabold leading-snug hover:text-blue hover:underline">
        {ja ?? winner.name}
      </Link>
      {ja && <span className="block break-words text-xs text-muted">{winner.name}</span>}
      {winner.awardTeam && <span className="mt-0.5 block text-xs text-muted">当時の所属: {winner.awardTeam}</span>}
    </li>
  );
}

function NoWinner() {
  return <p className="text-sm text-muted">該当者なし（登録選手の受賞記録はありません）</p>;
}

export default async function AwardsPage({ searchParams }: PageProps<"/awards">) {
  const { season: seasonParam } = await searchParams;
  const records = await fetchRecords();
  const seasons = [...new Set(records.map((r) => r.season))].sort((a, b) => b - a);
  const requested = parseSeasonParam(seasonParam);
  const season = requested !== null && seasons.includes(requested) ? requested : (seasons[0] ?? null);
  const requestedMissing = seasonParam !== undefined && (requested === null || !seasons.includes(requested));

  const inSeason = season === null ? [] : records.filter((r) => r.season === season);
  const supabase = createServerSupabaseClient();
  const ids = [...new Set(inSeason.map((r) => r.player_id))];
  const { data: players } = ids.length > 0 ? await supabase.from("players").select("id, full_name, full_name_ja").in("id", ids) : { data: [] };
  const playerById = new Map((players ?? []).map((p) => [p.id, p]));

  const winnersOf = (key: HistoryAwardKey, team: number | null = null): Winner[] =>
    inSeason
      .filter((r) => r.award_key === key && (team === null || r.selection_team === team))
      .map((r) => {
        const p = playerById.get(r.player_id);
        return { playerId: r.player_id, name: p?.full_name ?? "（不明）", ja: p?.full_name_ja ?? null, awardTeam: r.award_team };
      })
      .sort((a, b) => a.name.localeCompare(b.name));

  const defs = new Map(HISTORY_AWARDS.map((a) => [a.key, a]));
  const label = season !== null ? seasonLabel(season) : "";
  const allStars = winnersOf("all_star");

  return (
    <PageShell>
      <div className="-mx-4 bg-navy px-4 py-8 text-white sm:-mx-7 sm:px-7 sm:py-[29px]">
        <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[1.3px] text-[#84b0ff]">Awards Database{label ? ` · ${label} Season` : ""}</p>
        <h1 className="text-[28px] font-semibold tracking-tight sm:text-[36px]">{label ? `${label} アワード` : "年度別アワード"}</h1>
        <p className="mt-1 text-sm text-slate-300">登録選手の受賞歴を年度別に表示しています。</p>
      </div>

      <div className="mt-6 space-y-3">
        <p className="border-l-4 border-gold bg-surface px-4 py-3 text-sm leading-7">
          このページは、現在登録されている選手の過去の受賞歴を年度別に表示しています。引退選手など、サイトに未登録の選手は含まれません。
        </p>
        {seasons.length > 0 && <SeasonSelect key={label} seasons={seasons.map(seasonLabel)} selected={label} />}
        {requestedMissing && seasons.length > 0 && (
          <p className="text-xs text-muted">指定された年度の受賞記録がないため、最新の {seasonLabel(seasons[0])} を表示しています。</p>
        )}
      </div>

      {season === null ? (
        <p className="mt-8 border border-line bg-surface px-5 py-8 text-center text-sm text-muted">受賞歴のデータは準備中です。</p>
      ) : (
        <div className="mt-8 space-y-10">
          <section>
            <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">Major Awards</p>
            <h2 className="mb-1 text-xl font-semibold">主要賞</h2>
            <p className="mb-4 text-xs text-muted">所属チームは受賞時点のものです。選手名から選手プロフィールへ移動できます。</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {MAJOR_KEYS.map((key) => {
                const def = defs.get(key)!;
                const winners = winnersOf(key);
                return (
                  <div key={key} className="border border-line bg-surface p-5">
                    <p className="text-sm font-bold">{def.label}</p>
                    <p className="mb-3 text-[11px] text-muted">{def.note ?? " "}</p>
                    {winners.length > 0 ? (
                      <ul className="space-y-2">
                        {winners.map((w) => (
                          <WinnerItem key={w.playerId} winner={w} />
                        ))}
                      </ul>
                    ) : (
                      <NoWinner />
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <section>
            <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">All-NBA / All-Defensive / All-Rookie</p>
            <h2 className="mb-1 text-xl font-semibold">チーム表彰</h2>
            <p className="mb-4 text-xs text-muted">1st / 2nd / 3rd Team ごとに、登録選手の選出記録を表示しています。</p>
            <div className="space-y-6">
              {TEAM_KEYS.map((key) => {
                const def = defs.get(key)!;
                return (
                  <div key={key}>
                    <h3 className="mb-2 text-base font-bold">
                      {def.label}
                      {def.note && <span className="ml-2 text-xs font-normal text-muted">{def.note}</span>}
                    </h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {(def.teams ?? []).map((team) => {
                        const winners = winnersOf(key, team);
                        return (
                          <div key={team} className="border border-line bg-surface p-5">
                            <p className="mb-3 text-sm font-bold">
                              {def.label} {TEAM_LABEL[team]}
                            </p>
                            {winners.length > 0 ? (
                              <ul className="space-y-3">
                                {winners.map((w) => (
                                  <WinnerItem key={w.playerId} winner={w} />
                                ))}
                              </ul>
                            ) : (
                              <NoWinner />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section>
            <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">All-Star</p>
            <h2 className="mb-1 text-xl font-semibold">オールスター選出（{allStars.length}人）</h2>
            <p className="mb-4 text-xs text-muted">登録選手のうち、この年度のオールスターに選出された選手です（欠場者・代替選出者を含みます）。</p>
            {allStars.length > 0 ? (
              <ul className="grid grid-cols-1 gap-x-4 gap-y-3 border border-line bg-surface p-5 sm:grid-cols-2 lg:grid-cols-3">
                {allStars.map((w) => (
                  <WinnerItem key={w.playerId} winner={w} />
                ))}
              </ul>
            ) : (
              <div className="border border-line bg-surface p-5">
                <NoWinner />
              </div>
            )}
          </section>
        </div>
      )}
    </PageShell>
  );
}
