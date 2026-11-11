import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { LegendsTabs } from "@/components/legends/legends-tabs";
import { formatSeasonLabel } from "@/lib/stats";
import { fetchLeaderPlayerInfo, type LeaderPlayerInfo } from "@/lib/legends/leader-links";
import {
  LEADERS_LAST_SEASON,
  LEADER_PLAYERS,
  LEGEND_BY_BREF_ID,
  STATS_BY_VIEW,
  STAT_LABELS,
  VIEW_OPTIONS,
  isPct,
  isTotal,
  statLabel,
  leaderName,
  rankingFor,
  yearlyLeaders,
  type LeaderEntry,
  type LeaderStat,
  type LeaderView,
} from "@/lib/legends/leaders";
import { StickyTableFrame } from "@/components/sticky-table-frame";

// 選手ページへのリンク(現役選手)は1日キャッシュ。?view=&stat= で表示を切り替える
export const revalidate = 86400;

const VIEWS = VIEW_OPTIONS.map((v) => v.value);

// 年度別リーダーのリーグ絞り込み(すべて / NBA / ABA)
type LeagueFilter = "all" | "nba" | "aba";
const LEAGUE_OPTIONS: { value: LeagueFilter; label: string }[] = [
  { value: "all", label: "すべて" },
  { value: "nba", label: "NBA" },
  { value: "aba", label: "ABA" },
];

function parseParams(sp: Record<string, string | string[] | undefined>): { view: LeaderView; stat: LeaderStat; lg: LeagueFilter } {
  const view = (typeof sp.view === "string" && (VIEWS as string[]).includes(sp.view) ? sp.view : "yearly") as LeaderView;
  const stats = STATS_BY_VIEW[view];
  const stat = (typeof sp.stat === "string" && (stats as string[]).includes(sp.stat) ? sp.stat : stats.includes("pts") ? "pts" : stats[0]) as LeaderStat;
  const lg = (view === "yearly" && (sp.lg === "nba" || sp.lg === "aba") ? sp.lg : "all") as LeagueFilter;
  return { view, stat, lg };
}

function href(view: LeaderView, stat: LeaderStat, lg: LeagueFilter = "all"): string {
  const params = new URLSearchParams();
  if (view !== "yearly") params.set("view", view);
  if (stat !== "pts") params.set("stat", stat);
  if (view === "yearly" && lg !== "all") params.set("lg", lg);
  const q = params.toString();
  return q ? `/legends/leaders?${q}` : "/legends/leaders";
}

export async function generateMetadata({ searchParams }: PageProps<"/legends/leaders">): Promise<Metadata> {
  const { view, stat, lg } = parseParams(await searchParams);
  const v = VIEW_OPTIONS.find((o) => o.value === view)!;
  const isDefault = view === "yearly" && stat === "pts" && lg === "all";
  const lgLabel = lg === "nba" ? "NBA" : lg === "aba" ? "ABA" : "NBA＆ABA";
  const label = statLabel(view, stat);
  const title = isDefault
    ? "NBA歴代記録・オールタイムリーダーズ｜年度別リーダーと通算ランキング（NBA＆ABA） | NBA Front Office Japan"
    : `NBA歴代記録 ${v.title}：${label}（${lgLabel}） | NBA Front Office Japan`;
  return {
    title,
    description: isDefault
      ? "NBA・ABAの歴代記録を日本語でまとめました。得点・リバウンド・アシスト・スティール・ブロック・3P・FG%の年度別リーダー（タイトル獲得者）と、通算記録・通算平均・シーズン最高の歴代ランキング。"
      : `NBA・ABAの歴代記録「${v.title}：${label}」。${v.description}`,
    alternates: { canonical: href(view, stat, lg) },
  };
}

function fmt(stat: LeaderStat, value: number, view: LeaderView): string {
  if (isPct(stat)) return `${(value * 100).toFixed(1)}%`;
  if (view === "total" || isTotal(stat)) return value.toLocaleString("en-US");
  return value.toFixed(view === "average" ? 2 : 1);
}

function PlayerName({ id, links }: { id: string; links: LeaderPlayerInfo }) {
  const { ja: legendJa, en } = leaderName(id);
  const ja = legendJa ?? links.namesJa[id] ?? null;
  const legend = LEGEND_BY_BREF_ID.get(id);
  const playerId = links.links[id];
  const target = playerId ? `/players/${playerId}` : legend ? `/legends/${legend.slug}` : null;
  const body = (
    <>
      <span className="font-bold">{ja ?? en}</span>
      {ja && <span className="ml-1.5 hidden text-[11px] text-muted sm:inline">{en}</span>}
    </>
  );
  return (
    <span className="inline-flex flex-wrap items-center gap-x-1.5">
      {target ? (
        <Link href={target} className="text-foreground underline-offset-2 hover:text-[#a87a1e] hover:underline">
          {body}
        </Link>
      ) : (
        <span>{body}</span>
      )}
      {legend && (
        <span className="border border-gold px-1 text-[9px] font-extrabold tracking-wide text-gold" title="NBA75周年記念チーム">
          LEGEND
        </span>
      )}
      {LEADER_PLAYERS[id]?.active && <span className="bg-navy px-1 text-[9px] font-extrabold tracking-wide text-white">現役</span>}
    </span>
  );
}

function ChipLinks<T extends string>({ options, current, link }: { options: { value: T; label: string }[]; current: T; link: (v: T) => string }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <Link
          key={o.value}
          href={link(o.value)}
          aria-current={current === o.value ? "page" : undefined}
          className={`selection-button selection-legend rounded-full border px-3.5 py-1.5 text-[13px] font-bold ${
            current === o.value ? "border-navy bg-navy text-gold" : "border-line bg-surface text-muted"
          }`}
        >
          {o.label}
        </Link>
      ))}
    </div>
  );
}

const th = "whitespace-nowrap px-2 py-2.5 sm:px-2.5 text-left text-[11px] font-bold text-muted";
const td = "whitespace-nowrap px-2 py-2.5 sm:px-2.5";

function LgBadge({ lg }: { lg?: string }) {
  if (lg !== "ABA") return null;
  return <span className="ml-1.5 border border-line px-1 text-[9px] font-extrabold tracking-wide text-muted">ABA</span>;
}

function YearlyTable({ stat, lg, links }: { stat: LeaderStat; lg: LeagueFilter; links: LeaderPlayerInfo }) {
  const rows = yearlyLeaders(stat).filter((r) => lg === "all" || r.lg === lg.toUpperCase());
  return (
    <table className="w-full sm:min-w-[560px] border-collapse text-[13px]">
      <thead>
        <tr className="border-b border-line">
          <th className={th}>シーズン</th>
          <th className={th}>選手</th>
          <th className={`${th} hidden sm:table-cell`}>チーム</th>
          <th className={`${th} hidden sm:table-cell`}>G</th>
          <th className={`${th} text-right`}>{STAT_LABELS[stat].short}</th>
        </tr>
      </thead>
      <tbody>
        {rows.flatMap((r) =>
          r.leaders.map((e, i) => (
            <tr key={`${r.season}-${r.lg}-${e.id}`} className="border-b border-line/60">
              <td className={`${td} font-bold tabular-nums`}>
                {i === 0 && (
                  <>
                    {formatSeasonLabel(r.season)}
                    <LgBadge lg={r.lg} />
                  </>
                )}
              </td>
              <td className={`${td} whitespace-normal sm:whitespace-nowrap`}>
                <PlayerName id={e.id} links={links} />
                <span className="block text-[11px] text-muted sm:hidden">{e.team?.replaceAll("/", "・")}</span>
              </td>
              <td className={`${td} hidden text-muted sm:table-cell`}>{e.team?.replaceAll("/", "・")}</td>
              <td className={`${td} hidden tabular-nums text-muted sm:table-cell`}>{e.g}</td>
              <td className={`${td} text-right font-semibold tabular-nums`}>{fmt(stat, e.value, "yearly")}</td>
            </tr>
          )),
        )}
      </tbody>
    </table>
  );
}

function RankingTable({ view, stat, links }: { view: Exclude<LeaderView, "yearly">; stat: LeaderStat; links: LeaderPlayerInfo }) {
  const rows = rankingFor(view, stat);
  // 同じ値は同じ順位(上から見て最初に同じ値が出た位置)
  const ranked = rows.map((e: LeaderEntry) => ({ e, rank: rows.findIndex((x) => x.value === e.value) + 1 }));
  return (
    <table className="w-full sm:min-w-[560px] border-collapse text-[13px]">
      <thead>
        <tr className="border-b border-line">
          <th className={`${th} w-10`}>順位</th>
          <th className={th}>選手</th>
          <th className={th}>{view === "best" ? "シーズン" : "在籍期間"}</th>
          {view === "best" && <th className={`${th} hidden sm:table-cell`}>チーム</th>}
          {stat !== "g" && <th className={`${th} hidden sm:table-cell`}>G</th>}
          <th className={`${th} text-right`}>{STAT_LABELS[stat].short}</th>
        </tr>
      </thead>
      <tbody>
        {ranked.map(({ e, rank }, i) => (
          <tr key={`${e.id}-${e.season ?? i}`} className="border-b border-line/60">
            <td className={`${td} font-bold tabular-nums ${rank <= 3 ? "text-[#a87a1e]" : "text-muted"}`}>{rank}</td>
            <td className={`${td} whitespace-normal sm:whitespace-nowrap`}>
              <PlayerName id={e.id} links={links} />
              {view === "best" && <span className="block text-[11px] text-muted sm:hidden">{e.team?.replaceAll("/", "・")}</span>}
            </td>
            <td className={`${td} tabular-nums text-muted`}>
              {view === "best" ? (
                <>
                  {formatSeasonLabel(e.season!)}
                  <LgBadge lg={e.lg} />
                </>
              ) : (
                <>
                  {e.from}-{String((e.to! + 1) % 100).padStart(2, "0")}
                  {e.lgs?.includes("ABA") && <LgBadge lg="ABA" />}
                </>
              )}
            </td>
            {view === "best" && <td className={`${td} hidden text-muted sm:table-cell`}>{e.team?.replaceAll("/", "・")}</td>}
            {stat !== "g" && <td className={`${td} hidden tabular-nums text-muted sm:table-cell`}>{e.g.toLocaleString("en-US")}</td>}
            <td className={`${td} text-right font-semibold tabular-nums`}>{fmt(stat, e.value, view)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default async function LegendLeadersPage({ searchParams }: PageProps<"/legends/leaders">) {
  const { view, stat, lg } = parseParams(await searchParams);
  const v = VIEW_OPTIONS.find((o) => o.value === view)!;
  const links = await fetchLeaderPlayerInfo().catch((): LeaderPlayerInfo => ({ links: {}, namesJa: {} }));
  const lastLabel = formatSeasonLabel(LEADERS_LAST_SEASON);

  return (
    <PageShell>
      <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[1.3px] text-[#a87a1e]">All-Time Leaders</p>
      <h1 className="mb-2 text-[28px] font-semibold leading-tight tracking-tight sm:text-[36px]">オールタイムリーダーズ</h1>
      <p className="mb-5 max-w-3xl text-[15px] leading-7">
        NBA（前身のBAAを含む）とABAの歴代記録です。シーズンごとのタイトル獲得者と、通算・シーズンの歴代ランキングをまとめています。
        <span className="text-muted">（{lastLabel}シーズン終了時点）</span>
      </p>

      <LegendsTabs current="leaders" />

      <div className="mb-6 space-y-3">
        <ChipLinks
          options={VIEW_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          current={view}
          link={(nv) => href(nv, STATS_BY_VIEW[nv].includes(stat) ? stat : "pts")}
        />
        <ChipLinks
          options={STATS_BY_VIEW[view].map((s) => ({ value: s, label: statLabel(view, s) }))}
          current={stat}
          link={(ns) => href(view, ns, lg)}
        />
        {view === "yearly" && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[12px] font-bold text-muted">リーグ</span>
            <ChipLinks options={LEAGUE_OPTIONS} current={lg} link={(nl) => href(view, stat, nl)} />
          </div>
        )}
      </div>

      <h2 className="mb-1 text-xl font-semibold tracking-tight">
        {v.title}：{statLabel(view, stat)}
        {lg !== "all" && `（${lg.toUpperCase()}）`}
      </h2>
      <p className="mb-3 text-[13px] text-muted">{v.description}</p>

      <StickyTableFrame className="overflow-x-auto border border-line bg-surface">
        {view === "yearly" ? <YearlyTable stat={stat} lg={lg} links={links} /> : <RankingTable view={view} stat={stat} links={links} />}
      </StickyTableFrame>

      <ul className="mt-3 space-y-1 text-xs leading-relaxed text-muted">
        <li>・「LEGEND」はNBA75周年記念チームの選手で、名前からプロフィールへ移動できます。現役選手は選手ページへ移動できます。</li>
        <li>・通算記録・通算平均はNBAとABAの合計です。ABAの成績を含むシーズン・選手には「ABA」と表示しています。</li>
        <li>・年度別リーダーは「リーグ」でNBAだけ・ABAだけに絞り込めます（ABAは1967-68〜1975-76の9シーズン）。</li>
        <li>・スティール・ブロックは1973-74（ABAは1972-73）以降、3PはNBAが1979-80以降に記録開始。記録の無い年の試合は平均の計算に入れていません。</li>
        <li>・規定（試合数・成功数など）は年代により異なり、Basketball-Referenceの基準に合わせています。途中移籍したシーズンは合計で表示しています。</li>
        <li>・出典: Basketball-Reference（公開データセット sumitrodatta/bball-reference-datasets）</li>
        <li>
          ・項目の意味は
          <Link href="/guide/glossary" className="mx-1 font-semibold text-blue underline-offset-2 hover:underline">
            NBA用語辞典
          </Link>
          で解説しています。
        </li>
      </ul>
    </PageShell>
  );
}
