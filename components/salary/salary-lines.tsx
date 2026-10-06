import Link from "next/link";
import { TeamColorChip } from "@/components/team-color-chip";
import { formatUsdJa, lineStatus, type SalaryLine } from "@/lib/salary/lines";
import { formatUsd, formatUsdShort, teamSlug, type SalarySeason } from "@/lib/salary/types";

// チームサラリー画面の「サラリーライン」表と、30チームの総年俸とラインを比べる横棒グラフ。
// 比較の基準は Excel から取り込んだチーム総年俸(参考比較)。

type ChartTeam = { abbr: string; name: string; total: number };

/** ラインの目印(凡例・表で使う短い縦線) */
function LineSwatch({ line }: { line: SalaryLine }) {
  return <span aria-hidden className="inline-block h-4 w-[3px] shrink-0 rounded-full" style={{ backgroundColor: line.color }} />;
}

/** 超えている最も高いラインの表示(例: Tax超過) */
export function LineStatusBadge({ total, lines }: { total: number; lines: SalaryLine[] }) {
  const status = lineStatus(total, lines);
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-bold">
      <span
        aria-hidden
        className="inline-block h-2.5 w-2.5 shrink-0 rounded-full border border-line"
        style={status.line ? { backgroundColor: status.line.color, borderColor: status.line.color } : undefined}
      />
      {status.label}
    </span>
  );
}

export function SalaryLinesTable({ season, lines }: { season: SalarySeason; lines: SalaryLine[] }) {
  return (
    <section aria-labelledby="salary-lines" className="border border-line bg-surface p-4 sm:p-5">
      <h2 id="salary-lines" className="mb-3 text-lg font-bold">
        {season} サラリーライン
      </h2>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-foreground text-left text-[11px] font-bold text-muted">
            <th scope="col" className="py-2 pr-3">
              ライン
            </th>
            <th scope="col" className="py-2 text-right">
              基準額
            </th>
          </tr>
        </thead>
        <tbody>
          {lines.map((l) => (
            <tr key={l.key} className="border-b border-line/60 align-top last:border-b-0">
              <th scope="row" className="py-2.5 pr-3 text-left font-normal">
                <span className="flex items-center gap-2 font-bold">
                  <LineSwatch line={l} />
                  {l.label}
                </span>
                <span className="mt-0.5 block pl-[11px] text-xs text-muted">{l.description}</span>
              </th>
              <td className="py-2.5 text-right">
                <span className="block font-bold tabular-nums">{formatUsd(l.amount)}</span>
                <span className="block whitespace-nowrap text-xs text-muted">{formatUsdJa(l.amount)}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

/** 目盛りの上限(最大の総年俸・最も高いラインより少し上の、2,000万ドル単位の値) */
function niceMax(values: number[]): number {
  const step = 20_000_000;
  return Math.ceil((Math.max(...values) * 1.02) / step) * step;
}

export function SalaryLineChart({ season, teams, lines }: { season: SalarySeason; teams: ChartTeam[]; lines: SalaryLine[] }) {
  const max = niceMax([...teams.map((t) => t.total), ...lines.map((l) => l.amount)]);
  const pct = (v: number) => `${(v / max) * 100}%`;
  const ticks = Array.from({ length: Math.floor(max / 50_000_000) + 1 }, (_, i) => i * 50_000_000);
  const counts = [
    { label: "2nd Apron超過", n: 0 },
    { label: "1st Apron超過", n: 0 },
    { label: "Tax超過", n: 0 },
    { label: "Cap超過", n: 0 },
    { label: "Cap下", n: 0 },
  ];
  for (const t of teams) {
    const c = counts.find((x) => x.label === lineStatus(t.total, lines).label);
    if (c) c.n += 1;
  }

  return (
    <section aria-labelledby="salary-line-chart" className="border border-line bg-surface p-4 sm:p-5">
      <h2 id="salary-line-chart" className="mb-1 text-lg font-bold">
        {season} 総年俸とサラリーラインの比較
      </h2>
      <p className="mb-3 text-xs text-muted">
        {counts.map((c) => `${c.label} ${c.n}`).join("・")}チーム。チーム名または棒を押すと、そのチームのサラリー詳細へ移動します。
      </p>

      {/* 凡例(各ラインの金額つき) */}
      <ul className="mb-4 grid grid-cols-1 gap-x-5 gap-y-1.5 text-xs sm:grid-cols-2 lg:grid-cols-4">
        {lines.map((l) => (
          <li key={l.key} className="flex items-center gap-2">
            <LineSwatch line={l} />
            <span className="font-bold">{l.label}</span>
            <span className="tabular-nums text-muted">{formatUsd(l.amount)}</span>
          </li>
        ))}
      </ul>

      {/* PCはチーム名と棒を横に並べ、スマホはチーム名・金額の行の下に棒を置く(縦線は棒の部分にだけ引き、文字と重ねない) */}
      <ol>
        {teams.map((t) => {
          const status = lineStatus(t.total, lines);
          return (
            <li key={t.abbr}>
              <Link
                href={`/salary/teams/${teamSlug(t.abbr)}`}
                aria-label={`${t.name}：${formatUsd(t.total)}（${status.label}）`}
                title={`${t.name}：${formatUsd(t.total)}（${status.label}）`}
                className="group flex flex-col gap-1 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue sm:flex-row sm:items-stretch sm:gap-3 sm:py-0"
              >
                <span className="flex min-w-0 items-center justify-between gap-2 text-xs sm:w-[168px] sm:shrink-0 sm:py-[3px]">
                  <span className="flex min-w-0 items-center gap-1.5 font-bold text-blue group-hover:underline">
                    <TeamColorChip abbreviation={t.abbr} />
                    <span className="truncate">{t.name}</span>
                  </span>
                  <span className="shrink-0 tabular-nums text-muted sm:hidden">
                    ${(t.total / 1_000_000).toFixed(2)}M・{status.label}
                  </span>
                </span>
                <span className="relative block h-5 flex-none sm:mr-2 sm:h-auto sm:min-h-[22px] sm:flex-1">
                  <span
                    className="absolute left-0 top-1/2 block h-3 -translate-y-1/2 bg-[#4b6a9b] transition-colors group-hover:bg-[#2f4f80] dark:bg-[#8fa8d0] dark:group-hover:bg-[#b4c8ea] sm:h-4"
                    style={{ width: pct(t.total) }}
                  />
                  {lines.map((l) => (
                    <span
                      key={l.key}
                      aria-hidden
                      className="absolute inset-y-0 w-0 border-l-2"
                      style={{ left: pct(l.amount), borderColor: l.color, borderStyle: l.key === "cap" ? "dashed" : "solid" }}
                    />
                  ))}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>

      {/* 横軸(金額) */}
      <div className="relative mt-1 h-5 border-t border-line text-[10px] tabular-nums text-muted sm:ml-[180px] sm:mr-2">
        {ticks.map((v) => (
          <span key={v} className={`absolute top-1 whitespace-nowrap ${v === 0 ? "" : "-translate-x-1/2"}`} style={{ left: pct(v) }}>
            {v === 0 ? "$0" : formatUsdShort(v).replace(".0M", "M")}
          </span>
        ))}
      </div>
    </section>
  );
}
