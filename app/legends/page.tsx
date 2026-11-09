import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { LegendsTabs } from "@/components/legends/legends-tabs";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { fetchActiveLegendPlayerIds } from "@/lib/legends/active-links";
import {
  LEGENDS,
  awardCount,
  careerAverages,
  careerSpan,
  collapseLegendSeasons,
  debutDecade,
  hasPosition,
  summarizeLegendAwards,
  type Legend,
} from "@/lib/legends/data";

// 現役レジェンドの選手ページID(DB)を使うので、選手名鑑と同じくリクエストごとに表示する
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "NBAレジェンド選手一覧｜50周年・75周年記念チーム全76人の通算成績 | NBA Front Office Japan",
  description:
    "NBA 50周年記念チーム(50 Greatest Players)と75周年記念チーム(75th Anniversary Team)に選ばれた全76人のプロフィール・受賞歴・通算成績(レギュラーシーズン・プレーオフ)を日本語でまとめています。",
  alternates: { canonical: "/legends" },
};

type ListFilter = "all" | "50" | "75new";
type PosFilter = "all" | "G" | "F" | "C";

const LIST_OPTIONS: { value: ListFilter; label: string }[] = [
  { value: "all", label: "全76人" },
  { value: "50", label: "50周年チーム" },
  { value: "75new", label: "75周年で追加" },
];
const POS_OPTIONS: { value: PosFilter; label: string }[] = [
  { value: "all", label: "全ポジション" },
  { value: "G", label: "ガード" },
  { value: "F", label: "フォワード" },
  { value: "C", label: "センター" },
];

function parse<T extends string>(value: string | string[] | undefined, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

function href(list: ListFilter, pos: PosFilter): string {
  const params = new URLSearchParams();
  if (list !== "all") params.set("list", list);
  if (pos !== "all") params.set("pos", pos);
  const q = params.toString();
  return q ? `/legends?${q}` : "/legends";
}

function matchesPosition(l: Legend, pos: PosFilter): boolean {
  if (pos === "all") return true;
  return hasPosition(l.position, pos);
}

function FilterLinks<T extends string>({ options, current, link }: { options: { value: T; label: string }[]; current: T; link: (v: T) => string }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <Link
          key={o.value}
          href={link(o.value)}
          aria-current={current === o.value ? "page" : undefined}
          className={`selection-button selection-blue rounded-full px-3.5 py-1.5 text-[13px] font-bold ${
            current === o.value ? "bg-blue text-white" : "border border-line text-muted hover:text-foreground"
          }`}
        >
          {o.label}
        </Link>
      ))}
    </div>
  );
}

export default async function LegendsPage({ searchParams }: PageProps<"/legends">) {
  const sp = await searchParams;
  const list = parse(sp.list, ["all", "50", "75new"] as const, "all");
  const pos = parse(sp.pos, ["all", "G", "F", "C"] as const, "all");

  const activeIds = await fetchActiveLegendPlayerIds(createServerSupabaseClient()).catch(() => new Map<string, string>());

  const filtered = LEGENDS.filter(
    (l) => (list === "all" || (list === "50" ? l.greatest50 : !l.greatest50)) && matchesPosition(l, pos),
  );

  // デビュー年代ごとに、デビューが早い順に並べる
  const byDecade = new Map<number, Legend[]>();
  for (const l of filtered) {
    const d = debutDecade(l) ?? 0;
    byDecade.set(d, [...(byDecade.get(d) ?? []), l]);
  }
  const decades = [...byDecade.entries()]
    .sort(([a], [b]) => a - b)
    .map(([decade, legends]) => ({
      decade,
      legends: legends.sort((a, b) => (careerSpan(a)?.first ?? 0) - (careerSpan(b)?.first ?? 0) || a.nameJa.localeCompare(b.nameJa, "ja")),
    }));

  return (
    <PageShell>
      <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">Legends</p>
      <h1 className="mb-2 text-[28px] font-semibold leading-tight tracking-tight sm:text-[36px]">NBAレジェンド</h1>
      <p className="mb-6 max-w-3xl text-[15px] leading-7">
        NBAが選んだ歴代の偉大な選手たち。1996年の
        <strong>50周年記念チーム（50 Greatest Players）</strong>
        と、2021年の
        <strong>75周年記念チーム（75th Anniversary Team）</strong>
        に選ばれた全{LEGENDS.length}人のプロフィール・受賞歴・通算成績をまとめています。50周年の50人は全員が75周年にも選ばれています。
      </p>

      <LegendsTabs current="list" />

      <div className="mb-8 space-y-3">
        <FilterLinks options={LIST_OPTIONS} current={list} link={(v) => href(v, pos)} />
        <FilterLinks options={POS_OPTIONS} current={pos} link={(v) => href(list, v)} />
        <p className="text-xs text-muted">{filtered.length}人を表示</p>
      </div>

      <div className="space-y-10">
        {decades.map(({ decade, legends }) => (
          <section key={decade} aria-labelledby={`decade-${decade}`}>
            <div className="mb-3 flex items-baseline gap-2.5">
              <h2 id={`decade-${decade}`} className="text-xl font-semibold tracking-tight">
                {decade}年代デビュー
              </h2>
              <span className="text-[11px] font-extrabold tracking-wide text-muted">{legends.length}人</span>
            </div>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {legends.map((l) => {
                const span = careerSpan(l);
                const avg = careerAverages(collapseLegendSeasons(l.regularSeason));
                const { summaries } = summarizeLegendAwards(l.awards);
                const titles = [
                  awardCount(summaries, "champion") > 0 && `優勝${awardCount(summaries, "champion")}回`,
                  awardCount(summaries, "mvp") > 0 && `MVP${awardCount(summaries, "mvp")}回`,
                ].filter(Boolean);
                const playerId = activeIds.get(l.slug);
                return (
                  <li key={l.slug}>
                    <Link
                      href={playerId ? `/players/${playerId}` : `/legends/${l.slug}`}
                      className="selection-card flex h-full flex-col border border-line border-t-2 border-t-gold bg-surface p-4"
                    >
                      <span className="flex flex-wrap items-center gap-1.5">
                        {l.greatest50 && (
                          <span className="border border-gold px-1.5 text-[10px] font-extrabold tracking-wide text-gold">50周年</span>
                        )}
                        <span className="border border-blue px-1.5 text-[10px] font-extrabold tracking-wide text-blue">75周年</span>
                        {l.isActive && <span className="bg-blue px-1.5 text-[10px] font-extrabold tracking-wide text-white">現役</span>}
                      </span>
                      <span className="mt-2 text-[15px] font-bold">{l.nameJa}</span>
                      <span className="mt-0.5 text-[11px] font-bold tracking-wide text-muted">{l.name}</span>
                      <span className="mt-2 text-[13px] text-muted">
                        {span && `${span.first}-${span.last + 1}`}
                        {avg.ppg !== null && ` ・ 通算平均${avg.ppg.toFixed(1)}点`}
                      </span>
                      {titles.length > 0 && <span className="mt-1 text-[13px] font-bold">{titles.join("・")}</span>}
                      <span className="mt-auto pt-3 text-xs font-bold text-blue">
                        {playerId ? "選手ページを見る ›" : "プロフィールを見る ›"}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </PageShell>
  );
}
