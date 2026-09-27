import type { ReactNode } from "react";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/page-shell";
import { TeamValuationsTable, type ValuationTableRow } from "@/components/team-valuations-table";
import {
  fetchLatestValuationEdition,
  formatJaDate,
  formatSeasonSpan,
  formatValueOku,
  valuationEditionLabel,
} from "@/lib/valuations";

const TEN_BILLION_USD = 10_000_000_000;

function SummaryCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
}) {
  return (
    <div className="min-w-0 bg-surface p-4">
      <span className="mb-1.5 block text-[11px] text-muted">{label}</span>
      <b className="block break-words text-[20px] font-bold leading-tight">{value}</b>
      {sub && <span className="mt-1 block break-words text-[11px] text-muted">{sub}</span>}
    </div>
  );
}

function PageHeading({ kicker }: { kicker: string }) {
  return (
    <>
      <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">{kicker}</p>
      <h1 className="mb-3 text-[36px] font-semibold tracking-tight">チーム資産価値ランキング</h1>
      <p className="mb-5 text-sm text-muted">NBA全30チームの資産価値（推計値）を順位で並べたページです。</p>
    </>
  );
}

export default async function TeamValuationsPage() {
  const supabase = createServerSupabaseClient();

  const { data: edition, error: editionError } = await fetchLatestValuationEdition(supabase);

  if (editionError || !edition) {
    return (
      <PageShell>
        <PageHeading kicker="Team Valuations" />
        <p className="text-sm text-muted">
          {editionError ? `資産価値データの取得に失敗しました: ${editionError.message}` : "情報準備中"}
        </p>
      </PageShell>
    );
  }

  const [{ data: valuations, error: valuationsError }, { data: teams }] = await Promise.all([
    supabase.from("team_valuations").select("*").eq("edition_id", edition.id).order("rank"),
    supabase.from("teams").select("id, name, abbreviation, conference"),
  ]);

  const teamById = new Map((teams ?? []).map((t) => [t.id, t]));
  const rows: ValuationTableRow[] = (valuations ?? []).flatMap((v) => {
    const team = teamById.get(v.team_id);
    if (!team) return [];
    return [
      {
        teamId: team.id,
        teamName: team.name,
        teamAbbr: team.abbreviation,
        conference: team.conference,
        rank: v.rank,
        valueUsd: v.value_usd,
        revenueUsd: v.revenue_usd,
        ebitdaUsd: v.ebitda_usd,
        changePct: v.change_pct === null ? null : Number(v.change_pct),
      },
    ];
  });

  const byRank = [...rows].sort((a, b) => a.rank - b.rank);
  const top = byRank[0] ?? null;
  const bottom = byRank[byRank.length - 1] ?? null;
  const average = rows.length > 0 ? rows.reduce((sum, r) => sum + r.valueUsd, 0) / rows.length : null;
  const matchesStatedAverage =
    average !== null &&
    edition.stated_average_value_usd !== null &&
    Math.round(average) === edition.stated_average_value_usd;
  const overTenBillion = byRank.filter((r) => r.valueUsd >= TEN_BILLION_USD);
  const financialsSeason = formatSeasonSpan(edition.financials_season);

  return (
    <PageShell>
      <PageHeading kicker={`Team Valuations · ${edition.source_name} ${edition.edition_year}`} />

      <p className="mb-6 border-l-[3px] border-gold pl-3 text-xs leading-relaxed text-muted">
        <span className="font-bold text-foreground">推計値：</span>
        メディア（{edition.source_name}）による推計で、NBA・各チームの公式発表ではありません。
        {formatJaDate(edition.published_on)}公開の{valuationEditionLabel(edition)}の数値です。
      </p>

      {valuationsError ? (
        <p className="text-sm text-red-600 dark:text-red-400">
          資産価値データの取得に失敗しました: {valuationsError.message}
        </p>
      ) : (
        <>
          <div className="mb-8 grid grid-cols-2 gap-px border border-line bg-line lg:grid-cols-4">
            <SummaryCard
              label="1位"
              value={top ? `${formatValueOku(top.valueUsd)}億ドル` : "—"}
              sub={top?.teamName}
            />
            <SummaryCard
              label={`${rows.length}チーム平均`}
              value={average !== null ? `${formatValueOku(Math.round(average))}億ドル` : "—"}
              sub={matchesStatedAverage ? "記事の平均と一致" : null}
            />
            <SummaryCard
              label={bottom ? `${bottom.rank}位` : "最下位"}
              value={bottom ? `${formatValueOku(bottom.valueUsd)}億ドル` : "—"}
              sub={bottom?.teamName}
            />
            <SummaryCard
              label="100億ドル以上"
              value={`${overTenBillion.length}チーム`}
              sub={overTenBillion.map((r) => r.teamAbbr).join("・") || null}
            />
          </div>

          <section className="mb-8">
            <h2 className="mb-3 text-lg font-semibold">順位表</h2>
            <TeamValuationsTable rows={rows} />
            <p className="mt-2 text-xs text-muted">
              {financialsSeason ? `売上・EBITDAは${financialsSeason}シーズン（単位：億ドル）。` : "売上・EBITDAの単位は億ドル。"}
              見出しを押すと並べ替えできます。
            </p>
          </section>
        </>
      )}

      <section className="border border-line bg-surface p-4 text-xs text-muted sm:p-6">
        <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">Source</p>
        <h2 className="mb-3 text-base font-semibold text-foreground">出典</h2>
        <dl className="space-y-2.5">
          <div>
            <dt className="font-bold">記事</dt>
            <dd className="mt-0.5">
              {edition.source_name}「
              <a
                href={edition.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="break-words text-blue underline-offset-2 hover:underline"
              >
                {edition.title}
              </a>
              」（{formatJaDate(edition.published_on)}公開）↗
            </dd>
          </div>
          {edition.value_definition && (
            <div>
              <dt className="font-bold">価値の定義</dt>
              <dd className="mt-0.5 leading-relaxed">{edition.value_definition}</dd>
            </div>
          )}
          <div>
            <dt className="font-bold">売上・EBITDAの対象</dt>
            <dd className="mt-0.5">{financialsSeason ? `${financialsSeason}シーズン` : "—"}</dd>
          </div>
          <div>
            <dt className="font-bold">記事の平均</dt>
            <dd className="mt-0.5">
              {edition.stated_average_value_usd !== null
                ? `${formatValueOku(edition.stated_average_value_usd)}億ドル`
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="font-bold">確認日</dt>
            <dd className="mt-0.5">{formatJaDate(edition.last_verified)}</dd>
          </div>
        </dl>
        <p className="mt-4">
          掲載しているのは順位と数値のみです。各チームの詳細は
          <Link href="/teams" className="text-blue underline-offset-2 hover:underline">
            チーム一覧
          </Link>
          から確認できます。
        </p>
      </section>
    </PageShell>
  );
}
