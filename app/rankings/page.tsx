import type { ReactNode } from "react";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/page-shell";
import { RANKINGS, rankingHref, type RankingEntry } from "@/lib/rankings";
import { TeamColorChip } from "@/components/team-color-chip";
import { fetchLatestValuationEdition, formatJaDate, formatValueOku } from "@/lib/valuations";
import { buildOwnerNetWorthRows, fetchLatestOwnerNetWorthEdition } from "@/lib/owner-net-worth";

interface RankingPreview {
  // 上位の項目(例: 上位3チーム)
  top: { rank: number; label: string; value: string; teamAbbr?: string; badge?: string }[];
  // 出典と時点(例: 「CNBC（2026年2月13日公開）」)
  source: string | null;
}

type ServerClient = ReturnType<typeof createServerSupabaseClient>;

// チーム資産価値: 最新の年版の上位3チームと出典
async function teamValuationsPreview(supabase: ServerClient): Promise<RankingPreview | null> {
  const { data: edition } = await fetchLatestValuationEdition(supabase);
  if (!edition) return null;

  const [{ data: top }, { data: teams }] = await Promise.all([
    supabase
      .from("team_valuations")
      .select("team_id, rank, value_usd")
      .eq("edition_id", edition.id)
      .order("rank")
      .limit(3),
    supabase.from("teams").select("id, name, abbreviation"),
  ]);
  const teamById = new Map((teams ?? []).map((t) => [t.id, t]));

  return {
    top: (top ?? []).map((v) => ({
      rank: v.rank,
      label: teamById.get(v.team_id)?.name ?? "—",
      value: `${formatValueOku(v.value_usd)}億ドル`,
      teamAbbr: teamById.get(v.team_id)?.abbreviation,
    })),
    source: `${edition.source_name}（${formatJaDate(edition.published_on)}公開）`,
  };
}

// オーナー資産: 最新の基準日の上位3名(同額は同順位)と出典
async function ownerNetWorthPreview(supabase: ServerClient): Promise<RankingPreview | null> {
  const { data: edition } = await fetchLatestOwnerNetWorthEdition(supabase);
  if (!edition) return null;

  const [{ data: records }, { data: teams }] = await Promise.all([
    supabase.from("team_owner_net_worths").select("*").eq("edition_id", edition.id),
    supabase.from("teams").select("id, name, abbreviation"),
  ]);
  const rows = buildOwnerNetWorthRows(records ?? [], teams ?? []).filter((r) => r.group === "ranked");

  return {
    top: rows.slice(0, 3).map((r) => ({
      rank: r.rank ?? 0,
      label: `${r.ownerName}（${r.teamAbbr}）`,
      value: `${formatValueOku(r.netWorthUsd ?? 0)}億ドル`,
      teamAbbr: r.teamAbbr,
      badge: r.isFamilyEstimate ? "一族合算" : undefined,
    })),
    source: `${edition.source_name}（${formatJaDate(edition.as_of_date)}時点）`,
  };
}

const PREVIEW_LOADERS: Record<string, (supabase: ServerClient) => Promise<RankingPreview | null>> = {
  "team-valuations": teamValuationsPreview,
  "owner-net-worth": ownerNetWorthPreview,
};

function RankingCard({ entry, preview }: { entry: RankingEntry; preview: RankingPreview | null }) {
  const href = rankingHref(entry.slug);
  return (
    <article className="flex flex-col border border-line bg-surface p-4 sm:p-6">
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-semibold">
          <Link href={href} className="hover:text-blue">
            {entry.title}
          </Link>
        </h2>
        {entry.badge && (
          <span className="border border-gold px-1.5 py-0.5 text-[11px] font-bold text-muted">
            {entry.badge}
          </span>
        )}
      </div>
      <p className="mb-4 text-sm text-muted">{entry.description}</p>

      {preview && preview.top.length > 0 ? (
        <ol className="mb-4 border-y border-line">
          {preview.top.map((item) => (
            <li
              key={`${item.rank}-${item.label}`}
              className="flex items-baseline gap-3 border-b border-line/60 py-2.5 text-sm last:border-b-0"
            >
              <span className="w-5 shrink-0 text-right font-bold">{item.rank}</span>
              {item.teamAbbr && <TeamColorChip abbreviation={item.teamAbbr} />}
              {/* 狭い画面でも名前やラベルを途中で切らず、折り返して表示する */}
              <span className="min-w-0 flex-1 break-words">
                {item.label}
                {item.badge && (
                  <span className="ml-1.5 inline-block border border-gold px-1 align-middle text-[10px] font-bold leading-4 text-muted">
                    {item.badge}
                  </span>
                )}
              </span>
              <b className="shrink-0 font-semibold">{item.value}</b>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mb-4 text-sm text-muted">情報準備中</p>
      )}

      <div className="mt-auto flex flex-wrap items-baseline justify-between gap-2 text-xs">
        <span className="text-muted">{preview?.source ? `出典：${preview.source}` : null}</span>
        <Link href={href} className="font-semibold text-blue hover:underline">
          ランキングを見る →
        </Link>
      </div>
    </article>
  );
}

export default async function RankingsPage() {
  const supabase = createServerSupabaseClient();
  const previews = await Promise.all(
    RANKINGS.map((entry) => PREVIEW_LOADERS[entry.slug]?.(supabase) ?? Promise.resolve(null))
  );

  let cards: ReactNode = <p className="text-sm text-muted">掲載中のランキングはまだありません。</p>;
  if (RANKINGS.length > 0) {
    cards = (
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {RANKINGS.map((entry, i) => (
          <RankingCard key={entry.slug} entry={entry} preview={previews[i]} />
        ))}
      </div>
    );
  }

  return (
    <PageShell>
      <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">Rankings</p>
      <h1 className="mb-3 text-[36px] font-semibold tracking-tight">ランキング</h1>
      <p className="mb-8 text-sm text-muted">NBAのチーム・選手に関するランキングをまとめたコーナーです。</p>
      {cards}
    </PageShell>
  );
}
