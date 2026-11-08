import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { PageShell } from "@/components/page-shell";
import { LegendStatsTable } from "@/components/legends/legend-stats-table";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { fetchActiveLegendPlayerIds } from "@/lib/legends/active-links";
import { awardsPageHref } from "@/lib/legends/award-links";
import { seasonLabel } from "@/lib/awards/history";
import {
  LEGENDS,
  LEGEND_PLAYOFFS_AVAILABLE,
  awardCount,
  careerAverages,
  careerPoints,
  careerSpan,
  collapseLegendSeasons,
  isYearOnlyAward,
  legendBySlug,
  legendTeams,
  positionLabel,
  rankAmongLegends,
  summarizeLegendAwards,
  type Legend,
  type LegendAwardSummary,
} from "@/lib/legends/data";

// レジェンド選手のページ。Profile(Roster Profile・Awards & Honors・Highlights)と Stats(生涯成績)を ?view= で切り替える。
// 現役のレジェンドは、今季成績・Game Log がある既存の選手ページ(/players/{id})へ転送する。
type View = "profile" | "stats";
const parseView = (v: string | string[] | undefined): View => (v === "stats" ? "stats" : "profile");

export function generateStaticParams() {
  return LEGENDS.filter((l) => !l.isActive).map((l) => ({ slug: l.slug }));
}

function titleFor(l: Legend, view: View): string {
  return view === "stats"
    ? `${l.nameJa}の通算成績・シーズン別スタッツ(レギュラー・プレーオフ) | NBA Front Office Japan`
    : `${l.nameJa}(${l.name})のプロフィール・受賞歴・通算成績｜NBAレジェンド | NBA Front Office Japan`;
}

function descriptionFor(l: Legend): string {
  const avg = careerAverages(collapseLegendSeasons(l.regularSeason));
  const span = careerSpan(l);
  const { summaries } = summarizeLegendAwards(l.awards);
  const parts = [
    `${l.nameJa}(${l.name})は${l.greatest50 ? "NBA50周年・75周年記念チーム" : "NBA75周年記念チーム"}に選ばれたレジェンド。`,
    span ? `${span.first}-${String((span.last + 1) % 100).padStart(2, "0")}年にNBAでプレー。` : "",
    avg.ppg !== null ? `通算平均${avg.ppg.toFixed(1)}点・${(avg.rpg ?? 0).toFixed(1)}リバウンド・${(avg.apg ?? 0).toFixed(1)}アシスト。` : "",
    awardCount(summaries, "champion") > 0 ? `優勝${awardCount(summaries, "champion")}回。` : "",
    awardCount(summaries, "mvp") > 0 ? `MVP${awardCount(summaries, "mvp")}回。` : "",
  ];
  return parts.join("");
}

export async function generateMetadata({ params, searchParams }: PageProps<"/legends/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const { view: viewParam } = await searchParams;
  const view = parseView(viewParam);
  const l = legendBySlug(slug);
  if (!l) return {};
  const title = titleFor(l, view);
  const description = descriptionFor(l);
  const canonical = view === "profile" ? `/legends/${slug}` : `/legends/${slug}?view=stats`;
  return { title, description, alternates: { canonical }, openGraph: { title, description, url: canonical } };
}

const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">{children}</p>
);

// 2003-04以降の主要な賞は、年度別アワード(/awards)のその年度へリンクする
function AwardSeasons({ seasons, yearOnly, awardKey }: { seasons: number[]; yearOnly: boolean; awardKey: string }) {
  if (seasons.length === 0) return <p className="text-sm">選出</p>;
  return (
    <ul className="flex flex-wrap gap-x-1.5 gap-y-1">
      {seasons.map((s, i) => {
        const label = yearOnly ? `${s}年` : seasonLabel(s);
        const href = yearOnly ? null : awardsPageHref(awardKey, s);
        return (
          <li key={s} className="whitespace-nowrap text-sm tabular-nums">
            {href ? (
              <Link href={href} className="font-bold text-blue underline underline-offset-2 hover:opacity-80" title={`${label}の年度別アワードを見る`}>
                {label}
              </Link>
            ) : (
              label
            )}
            {i < seasons.length - 1 && <span className="ml-1.5 text-muted">/</span>}
          </li>
        );
      })}
    </ul>
  );
}

const TEAM_LABEL: Record<number, string> = { 1: "1st Team", 2: "2nd Team", 3: "3rd Team" };

function AwardsSection({ summaries, others }: { summaries: LegendAwardSummary[]; others: { description: string; season: number | null }[] }) {
  return (
    <section aria-labelledby="legend-awards" className="mt-6 border border-line bg-surface p-5 sm:p-6">
      <Eyebrow>Awards & Honors</Eyebrow>
      <h2 id="legend-awards" className="mb-4 text-lg font-semibold">
        個人賞・表彰
      </h2>
      {summaries.length === 0 ? (
        <p className="text-sm text-muted">NBA公式の受賞記録はありません。</p>
      ) : (
        <dl className="divide-y divide-line">
          {summaries.map((a) => (
            <div key={a.key} className="grid gap-x-6 gap-y-1.5 py-3 first:pt-0 last:pb-0 sm:grid-cols-[200px_1fr]">
              <dt>
                <span className="text-base font-bold">{a.label}</span>
                {!isYearOnlyAward(a.key) && a.seasons.length > 0 && (
                  <span className="ml-2 text-base font-extrabold tabular-nums text-blue">{a.seasons.length}回</span>
                )}
                {a.note && <span className="mt-0.5 block text-xs text-muted">{a.note}</span>}
              </dt>
              <dd className="min-w-0">
                {a.byTeam && a.byTeam.length > 0 ? (
                  <dl className="space-y-1.5">
                    {a.byTeam.map((t) => (
                      <div key={t.team} className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                        <dt className="shrink-0 whitespace-nowrap text-xs font-bold text-muted">
                          {TEAM_LABEL[t.team] ?? `${t.team}th Team`}（{t.seasons.length}回）：
                        </dt>
                        <dd className="min-w-0">
                          <AwardSeasons seasons={t.seasons} yearOnly={false} awardKey={a.key} />
                        </dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <AwardSeasons seasons={a.seasons} yearOnly={isYearOnlyAward(a.key)} awardKey={a.key} />
                )}
              </dd>
            </div>
          ))}
        </dl>
      )}
      {others.length > 0 && (
        <details className="mt-4 text-sm">
          <summary className="cursor-pointer font-bold text-muted">そのほかの表彰（{others.length}件・英語表記）</summary>
          <ul className="mt-2 space-y-1 text-muted">
            {others.map((o, i) => (
              <li key={`${o.description}-${o.season}-${i}`}>
                {o.season ? `${seasonLabel(o.season)} ` : ""}
                {o.description}
              </li>
            ))}
          </ul>
        </details>
      )}
      <p className="mt-4 text-xs text-muted">
        出典: Basketball-Reference（公開データセット）。NBA優勝・ファイナルMVPはNBA.com、オールスターMVPはCBS Sports・Wikipediaの一覧から。優勝は優勝シーズンの最終所属チームで判定しています。
      </p>
    </section>
  );
}

// データから作る短い紹介(Highlights)。数字はすべて NBA公式の記録から計算する
function highlights(l: Legend, summaries: LegendAwardSummary[]): string[] {
  const regular = collapseLegendSeasons(l.regularSeason);
  const playoffs = collapseLegendSeasons(l.playoffs);
  const avg = careerAverages(regular);
  const po = careerAverages(playoffs);
  const span = careerSpan(l);
  const teams = legendTeams(l);
  const lines: string[] = [];

  lines.push(
    l.greatest50
      ? "1996年の「NBA50周年記念チーム（50 Greatest Players）」と、2021年の「NBA75周年記念チーム（75th Anniversary Team）」の両方に選ばれています。"
      : "2021年の「NBA75周年記念チーム（75th Anniversary Team）」に選ばれています。",
  );
  if (span) {
    lines.push(
      `NBAで${seasonLabel(span.first)}から${seasonLabel(span.last)}まで${regular.length}シーズンプレー。在籍チームは${teams.join("・")}${teams.length > 1 ? `の${teams.length}球団` : ""}です。`,
    );
  }
  const pts = careerPoints(l);
  const rank = rankAmongLegends(l.slug, careerPoints);
  if (pts !== null && avg.ppg !== null) {
    lines.push(
      `レギュラーシーズン通算${pts.toLocaleString("en-US")}得点${rank ? `（レジェンド${rank.total}人中${rank.rank}位）` : ""}。1試合平均は${avg.ppg.toFixed(1)}点・${(avg.rpg ?? 0).toFixed(1)}リバウンド・${(avg.apg ?? 0).toFixed(1)}アシストです。`,
    );
  }
  const titles = [
    ["champion", "NBA優勝"],
    ["mvp", "シーズンMVP"],
    ["finals_mvp", "ファイナルMVP"],
    ["all_star", "オールスター選出"],
    ["all_nba", "All-NBA選出"],
  ]
    .map(([key, label]) => [label, awardCount(summaries, key)] as const)
    .filter(([, n]) => n > 0)
    .map(([label, n]) => `${label}${n}回`);
  if (titles.length > 0) lines.push(`主なタイトルは${titles.join("、")}。`);
  if ((LEGEND_PLAYOFFS_AVAILABLE || l.playoffsLoaded) && playoffs.length > 0 && po.ppg !== null) {
    lines.push(`プレーオフは${playoffs.length}シーズン・通算${po.career.gp}試合に出場し、平均${po.ppg.toFixed(1)}点を記録しました。`);
  }
  return lines;
}

export default async function LegendPage({ params, searchParams }: PageProps<"/legends/[slug]">) {
  const { slug } = await params;
  const { view: viewParam } = await searchParams;
  const view = parseView(viewParam);
  const l = legendBySlug(slug);
  if (!l) notFound();

  if (l.isActive) {
    const ids = await fetchActiveLegendPlayerIds(createServerSupabaseClient(), [l]).catch(() => new Map<string, string>());
    const id = ids.get(l.slug);
    if (id) permanentRedirect(`/players/${id}`);
  }

  const regular = collapseLegendSeasons(l.regularSeason);
  const playoffs = collapseLegendSeasons(l.playoffs);
  const { summaries, others } = summarizeLegendAwards(l.awards);
  const span = careerSpan(l);
  const teams = legendTeams(l);

  const profile: { label: string; value: string }[] = [
    { label: "身長", value: l.heightCm ? `${l.heightCm} cm` : "-" },
    { label: "体重", value: l.weightKg ? `${l.weightKg} kg` : "-" },
    { label: "生年月日", value: l.birthDate ?? "-" },
    { label: "ポジション", value: positionLabel(l.position) },
    {
      label: "ドラフト",
      value: l.draftYear
        ? `${l.draftYear}年${l.draftRound ? ` ${l.draftRound}巡目` : ""}${l.draftNumber ? ` ${l.draftNumber}位` : ""}`
        : "ドラフト外・記録なし",
    },
    ...(l.draftTeam ? [{ label: "指名チーム", value: l.draftTeam }] : []),
    { label: "出身校", value: l.school ?? "-" },
    { label: "NBA在籍", value: span ? `${seasonLabel(span.first)}〜${seasonLabel(span.last)}（${regular.length}シーズン）` : "-" },
    { label: "在籍チーム", value: teams.join("・") || "-" },
  ];

  return (
    <PageShell>
      <nav className="mb-4 text-xs text-muted">
        <Link href="/legends" className="font-bold text-blue hover:underline">
          NBAレジェンド
        </Link>
        <span className="mx-1.5">›</span>
        {l.nameJa}
      </nav>
      <Eyebrow>Legends</Eyebrow>
      <h1 className="text-[32px] font-semibold tracking-tight sm:text-[36px]">{l.nameJa}</h1>
      <p className="mt-0.5 text-sm text-muted">{l.name}</p>
      <p className="mb-6 mt-2 flex flex-wrap items-center gap-1.5 text-sm text-muted">
        {l.greatest50 && <span className="border border-gold px-1.5 text-[11px] font-extrabold text-gold">50周年記念チーム</span>}
        <span className="border border-blue px-1.5 text-[11px] font-extrabold text-blue">75周年記念チーム</span>
        <span className="ml-1">{positionLabel(l.position)}</span>
      </p>

      <div className="mb-4 flex flex-wrap gap-2">
        {(["profile", "stats"] as const).map((v) => (
          <Link
            key={v}
            href={v === "profile" ? `/legends/${slug}` : `/legends/${slug}?view=stats`}
            aria-current={view === v ? "page" : undefined}
            className={`selection-button selection-blue rounded-lg px-4 py-2 text-sm font-bold transition-all duration-200 ${
              view === v ? "bg-blue text-white" : "border border-line text-muted hover:text-foreground"
            }`}
          >
            {v === "profile" ? "Profile" : "Stats"}
          </Link>
        ))}
      </div>

      {view === "profile" && (
        <>
          <section className="border border-line bg-surface p-6">
            <Eyebrow>Roster Profile</Eyebrow>
            <h2 className="mb-4 text-lg font-semibold">Player Details</h2>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
              {profile.map((p) => (
                <div key={p.label}>
                  <dt className="text-muted">{p.label}</dt>
                  <dd className="font-semibold">{p.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <AwardsSection summaries={summaries} others={others} />

          <section aria-labelledby="legend-highlights" className="mt-6 border border-line bg-surface p-5 sm:p-6">
            <Eyebrow>Highlights</Eyebrow>
            <h2 id="legend-highlights" className="mb-4 text-lg font-semibold">
              データで見る{l.nameJa}
            </h2>
            <div className="space-y-3 text-sm leading-7">
              {highlights(l, summaries).map((text) => (
                <p key={text}>{text}</p>
              ))}
            </div>
          </section>

          <p className="mt-6 text-sm text-muted">
            シーズン別の成績は
            <Link href={`/legends/${slug}?view=stats`} className="mx-1 font-semibold text-blue underline-offset-2 hover:underline">
              Stats
            </Link>
            で確認できます。
          </p>
        </>
      )}

      {view === "stats" && (
        <section className="mt-4 border border-line bg-surface p-4 sm:p-6">
          <Eyebrow>Career Stats</Eyebrow>
          <h2 className="mb-4 text-lg font-semibold">生涯成績（シーズン別・通算）</h2>
          <LegendStatsTable regular={regular} playoffs={playoffs} playoffsAvailable={LEGEND_PLAYOFFS_AVAILABLE || Boolean(l.playoffsLoaded)} />
        </section>
      )}

      <p className="mt-8 text-sm">
        <Link href="/legends" className="font-bold text-blue hover:underline">
          ‹ NBAレジェンド一覧に戻る
        </Link>
      </p>
    </PageShell>
  );
}
