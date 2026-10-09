import type { Metadata } from "next";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/page-shell";
import { seasonLabel } from "@/lib/awards/history";
import { DETAIL_LABEL, SEASON_MAJOR_AWARDS, SEASON_TEAM_AWARDS, type SeasonAwardKey } from "@/lib/awards/season-master";
import { SeasonSelect } from "./season-select";

// 年度別アワード。管理画面で取り込んだマスターデータ(nba_season_awards)を年度ごとに表示する。
// 現役・引退を問わず、NBA全体の受賞者・選出者を表示する。サイトに選手プロフィールがある選手だけリンクを付ける。
// 年度は URL(?season=2023-24)で指定し、指定がない・データがない年度なら最新の年度を表示する。
// 選手プロフィールの「個人賞・表彰」(player_award_records)とは別のデータ。

// DBの日本語名が明らかに崩れている選手は、誤った表記を出さないよう日本語名を使わず英語名のみ表示する。
// (DBの修正は別作業。修正後はこの一覧から外す)
const SUSPECT_JA_NAMES = new Set(["ジエルエムイアハ・フィアーズ", "コリン・ムウルルエイ＝ブオイルエス"]);

type Rec = { season: number; award_key: string; detail: string; player_name: string; player_id: string | null; team: string | null };
type Winner = { key: string; name: string; playerId: string | null; ja: string | null; team: string | null; detail: string };

function parseSeasonParam(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const m = /^(\d{4})-(\d{2})$/.exec(value);
  if (!m) return null;
  const start = Number(m[1]);
  return (start + 1) % 100 === Number(m[2]) ? start : null;
}

async function fetchSeasons(): Promise<number[]> {
  const supabase = createServerSupabaseClient();
  const seasons = new Set<number>();
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase.from("nba_season_awards").select("season").order("id").range(from, from + 999);
    if (error) break;
    for (const r of data ?? []) seasons.add(r.season);
    if (!data || data.length < 1000) break;
  }
  return [...seasons].sort((a, b) => b - a);
}

export async function generateMetadata({ searchParams }: PageProps<"/awards">): Promise<Metadata> {
  const { season } = await searchParams;
  const start = parseSeasonParam(season);
  return {
    title: `${start !== null ? `${seasonLabel(start)} ` : ""}年度別アワード | NBA Front Office Japan`,
    description: "2003-04〜2025-26のNBAアワード（MVP・ファイナルMVP・All-NBA・オールスターなど）を年度別に掲載しています。",
  };
}

function WinnerItem({ winner, showDetail = false }: { winner: Winner; showDetail?: boolean }) {
  const ja = winner.ja && !SUSPECT_JA_NAMES.has(winner.ja) ? winner.ja : null;
  const main = ja ?? winner.name;
  return (
    <li className="min-w-0 border-l-[3px] border-gold pl-3">
      {showDetail && winner.detail && <span className="block text-[11px] font-bold text-muted">{DETAIL_LABEL[winner.detail] ?? winner.detail}</span>}
      {winner.playerId ? (
        <Link href={`/players/${winner.playerId}`} className="block break-words text-base font-extrabold leading-snug text-blue underline-offset-2 hover:underline">
          {main}
        </Link>
      ) : (
        <span className="block break-words text-base font-extrabold leading-snug">{main}</span>
      )}
      {ja && <span className="block break-words text-xs text-muted">{winner.name}</span>}
      {winner.team && <span className="mt-0.5 block text-xs text-muted">所属: {winner.team}</span>}
    </li>
  );
}

export default async function AwardsPage({ searchParams }: PageProps<"/awards">) {
  const { season: seasonParam } = await searchParams;
  const seasons = await fetchSeasons();
  const requested = parseSeasonParam(seasonParam);
  const season = requested !== null && seasons.includes(requested) ? requested : (seasons[0] ?? null);
  const requestedMissing = seasonParam !== undefined && (requested === null || !seasons.includes(requested));

  const supabase = createServerSupabaseClient();
  const { data: rows } =
    season !== null
      ? await supabase.from("nba_season_awards").select("season, award_key, detail, player_name, player_id, team").eq("season", season)
      : { data: [] as Rec[] };
  const records = (rows ?? []) as Rec[];
  const ids = [...new Set(records.flatMap((r) => (r.player_id ? [r.player_id] : [])))];
  const { data: players } = ids.length > 0 ? await supabase.from("players").select("id, full_name_ja").in("id", ids) : { data: [] };
  const jaById = new Map((players ?? []).map((p) => [p.id, p.full_name_ja]));

  const winnersOf = (key: SeasonAwardKey, detail?: string): Winner[] =>
    records
      .filter((r) => r.award_key === key && (detail === undefined || r.detail === detail))
      .map((r) => ({
        key: `${r.award_key}-${r.detail}-${r.player_name}`,
        name: r.player_name,
        playerId: r.player_id,
        ja: r.player_id ? (jaById.get(r.player_id) ?? null) : null,
        team: r.team,
        detail: r.detail,
      }))
      // カンファレンス・ファイナルMVPはイースト → ウエストの順、それ以外は名前順
      .sort((a, b) => a.detail.localeCompare(b.detail) || a.name.localeCompare(b.name));

  const label = season !== null ? seasonLabel(season) : "";
  const majors = SEASON_MAJOR_AWARDS.map((a) => ({ ...a, winners: winnersOf(a.key) })).filter((a) => a.winners.length > 0);
  const teamAwards = SEASON_TEAM_AWARDS.map((a) => ({
    ...a,
    teams: ["1st", "2nd", "3rd"].map((d) => ({ detail: d, winners: winnersOf(a.key, d) })).filter((t) => t.winners.length > 0),
  })).filter((a) => a.teams.length > 0);
  const allStars = winnersOf("all_star");
  const first = seasons.length > 0 ? seasonLabel(seasons[seasons.length - 1]) : "2003-04";
  const last = seasons.length > 0 ? seasonLabel(seasons[0]) : "2025-26";

  return (
    <PageShell>
      <div className="-mx-4 bg-navy px-4 py-8 text-white sm:-mx-7 sm:px-7 sm:py-[29px]">
        <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[1.3px] text-[#84b0ff]">Awards Database{label ? ` · ${label} Season` : ""}</p>
        <h1 className="text-[28px] font-semibold tracking-tight sm:text-[36px]">年度別アワード</h1>
        <p className="mt-1 text-sm text-slate-300">
          {first}〜{last}のNBAアワードを掲載しています。年度を選ぶと、その年度の受賞者・選出者を表示します。
        </p>
      </div>

      <div className="mt-6 space-y-2">
        {seasons.length > 0 && <SeasonSelect key={label} seasons={seasons.map(seasonLabel)} selected={label} />}
        {requestedMissing && seasons.length > 0 && <p className="text-xs text-muted">指定された年度のデータがないため、最新の {seasonLabel(seasons[0])} を表示しています。</p>}
      </div>

      {season === null ? (
        <p className="mt-8 border border-line bg-surface px-5 py-8 text-center text-sm text-muted">アワードのデータは準備中です。</p>
      ) : (
        <div className="mt-8 space-y-10">
          <h2 className="text-2xl font-semibold tracking-tight">{label} シーズン</h2>

          <section>
            <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">Major Awards</p>
            <h3 className="mb-1 text-xl font-semibold">主要賞</h3>
            <p className="mb-4 text-xs text-muted">所属は受賞時点のチームです。青い名前の選手は、選手プロフィールへ移動できます。</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {majors.map((a) => (
                <div key={a.key} className="border border-line bg-surface p-5">
                  <p className="text-sm font-bold">{a.label}</p>
                  <p className="mb-3 text-[11px] text-muted">{a.note ?? " "}</p>
                  <ul className="space-y-3">
                    {a.winners.map((w) => (
                      <WinnerItem key={w.key} winner={w} showDetail={a.key === "conference_finals_mvp"} />
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {teamAwards.length > 0 && (
            <section>
              <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">All-NBA / All-Defensive / All-Rookie</p>
              <h3 className="mb-4 text-xl font-semibold">チーム表彰</h3>
              <div className="space-y-6">
                {teamAwards.map((a) => (
                  <div key={a.key}>
                    <h4 className="mb-2 text-base font-bold">
                      {a.label}
                      <span className="ml-2 text-xs font-normal text-muted">{a.note}</span>
                    </h4>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {a.teams.map((t) => (
                        <div key={t.detail} className="border border-line bg-surface p-5">
                          <p className="mb-3 text-sm font-bold">
                            {a.label} {DETAIL_LABEL[t.detail]}
                          </p>
                          <ul className="space-y-3">
                            {t.winners.map((w) => (
                              <WinnerItem key={w.key} winner={w} />
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {allStars.length > 0 && (
            <section>
              <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">All-Star</p>
              <h3 className="mb-1 text-xl font-semibold">オールスター選出（{allStars.length}人）</h3>
              <p className="mb-4 text-xs text-muted">ケガによる代替選出を含む、公式に選出された選手です。</p>
              <ul className="grid grid-cols-1 gap-x-4 gap-y-3 border border-line bg-surface p-5 sm:grid-cols-2 lg:grid-cols-3">
                {allStars.map((w) => (
                  <WinnerItem key={w.key} winner={w} />
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </PageShell>
  );
}
