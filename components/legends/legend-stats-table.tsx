"use client";

import Link from "next/link";
import { useState } from "react";
import { formatSeasonLabel } from "@/lib/stats";
import {
  careerAverages,
  pct,
  perGame,
  type LegendDisplaySeason,
} from "@/lib/legends/calc";

// レジェンドのシーズン別成績(レギュラーシーズン / プレーオフ切替)。最下部に通算平均・通算合計。
// 記録が無い項目(古い年代のスティール・ブロック・3Pなど)は「—」。

const DASH = "—";
const f1 = (v: number | null) => (v === null ? DASH : v.toFixed(1));
const fPct = (v: number | null) => (v === null ? DASH : `${(v * 100).toFixed(1)}%`);
const fInt = (v: number | null) => (v === null ? DASH : v.toLocaleString("en-US"));

const HEAD = ["シーズン", "チーム", "年齢", "G", "MIN", "PTS", "TRB", "AST", "STL", "BLK", "FG%", "3P%", "FT%", "TOV"];

function SeasonRow({ s }: { s: LegendDisplaySeason }) {
  const pg = (v: number | null) => f1(perGame(v, s.gp));
  return (
    <tr className="border-b border-line/60 hover:bg-[#f6f9ff] dark:hover:bg-white/[.03]">
      <td className="whitespace-nowrap px-2 py-2.5 font-bold">{formatSeasonLabel(s.season)}</td>
      <td className="whitespace-nowrap px-2 py-2.5 text-muted">{s.teams.join("・")}</td>
      <td className="whitespace-nowrap px-2 py-2.5 tabular-nums">{s.age ?? DASH}</td>
      <td className="whitespace-nowrap px-2 py-2.5 tabular-nums">{s.gp ?? DASH}</td>
      <td className="whitespace-nowrap px-2 py-2.5 tabular-nums">{pg(s.min)}</td>
      <td className="whitespace-nowrap px-2 py-2.5 font-semibold tabular-nums">{pg(s.pts)}</td>
      <td className="whitespace-nowrap px-2 py-2.5 tabular-nums">{pg(s.reb)}</td>
      <td className="whitespace-nowrap px-2 py-2.5 tabular-nums">{pg(s.ast)}</td>
      <td className="whitespace-nowrap px-2 py-2.5 tabular-nums">{pg(s.stl)}</td>
      <td className="whitespace-nowrap px-2 py-2.5 tabular-nums">{pg(s.blk)}</td>
      <td className="whitespace-nowrap px-2 py-2.5 tabular-nums">{fPct(pct(s.fgm, s.fga))}</td>
      <td className="whitespace-nowrap px-2 py-2.5 tabular-nums">{fPct(pct(s.fg3m, s.fg3a))}</td>
      <td className="whitespace-nowrap px-2 py-2.5 tabular-nums">{fPct(pct(s.ftm, s.fta))}</td>
      <td className="whitespace-nowrap px-2 py-2.5 tabular-nums">{pg(s.tov)}</td>
    </tr>
  );
}

function CareerRows({ seasons }: { seasons: LegendDisplaySeason[] }) {
  const a = careerAverages(seasons);
  const c = a.career;
  const tov = perGame(c.totals.tov, c.gamesWithStat.tov);
  const cell = "whitespace-nowrap px-2 py-2.5 tabular-nums";
  return (
    <>
      <tr className="border-t-2 border-line bg-[#f6f9ff] font-bold dark:bg-white/[.04]">
        <td className={cell}>通算平均</td>
        <td className={`${cell} text-muted`}>{c.seasons}シーズン</td>
        <td className={cell} />
        <td className={cell}>{c.gp}</td>
        <td className={cell}>{f1(a.mpg)}</td>
        <td className={cell}>{f1(a.ppg)}</td>
        <td className={cell}>{f1(a.rpg)}</td>
        <td className={cell}>{f1(a.apg)}</td>
        <td className={cell}>{f1(a.spg)}</td>
        <td className={cell}>{f1(a.bpg)}</td>
        <td className={cell}>{fPct(a.fgPct)}</td>
        <td className={cell}>{fPct(a.threePct)}</td>
        <td className={cell}>{fPct(a.ftPct)}</td>
        <td className={cell}>{f1(tov)}</td>
      </tr>
      <tr className="bg-[#f6f9ff] font-bold dark:bg-white/[.04]">
        <td className={cell}>通算合計</td>
        <td className={cell} />
        <td className={cell} />
        <td className={cell}>{c.gp}</td>
        <td className={cell}>{fInt(c.totals.min)}</td>
        <td className={cell}>{fInt(c.totals.pts)}</td>
        <td className={cell}>{fInt(c.totals.reb)}</td>
        <td className={cell}>{fInt(c.totals.ast)}</td>
        <td className={cell}>{fInt(c.totals.stl)}</td>
        <td className={cell}>{fInt(c.totals.blk)}</td>
        <td className={cell} />
        <td className={cell} />
        <td className={cell} />
        <td className={cell}>{fInt(c.totals.tov)}</td>
      </tr>
    </>
  );
}

export function LegendStatsTable({
  regular,
  playoffs,
  playoffsAvailable,
}: {
  regular: LegendDisplaySeason[];
  playoffs: LegendDisplaySeason[];
  /** プレーオフ成績を収録済みか(未収録なら「準備中」と表示する) */
  playoffsAvailable: boolean;
}) {
  const [type, setType] = useState<"regular" | "playoffs">("regular");
  const rows = type === "regular" ? regular : playoffs;

  return (
    <div>
      <div className="mb-4 flex gap-2">
        {(["regular", "playoffs"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              type === t ? "bg-blue text-white" : "border border-line text-muted"
            }`}
          >
            {t === "regular" ? "Regular Season" : "Playoffs"}
          </button>
        ))}
      </div>

      <p className="mb-2 text-xs text-muted sm:hidden">→ 横にスクロールできます</p>
      <div className="overflow-x-auto border border-line bg-surface">
        <table className="w-full min-w-[900px] border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-line">
              {HEAD.map((h) => (
                <th key={h} className="whitespace-nowrap px-2 py-2.5 text-left text-[11px] font-bold text-muted">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={HEAD.length} className="px-2 py-6 text-center text-sm text-muted">
                  {type === "playoffs"
                    ? playoffsAvailable
                      ? "プレーオフの出場記録はありません。"
                      : "プレーオフ成績は準備中です。"
                    : "データがありません。"}
                </td>
              </tr>
            ) : (
              <>
                {rows.map((s) => (
                  <SeasonRow key={s.season} s={s} />
                ))}
                <CareerRows seasons={rows} />
              </>
            )}
          </tbody>
        </table>
      </div>

      <ul className="mt-3 space-y-1 text-xs leading-relaxed text-muted">
        <li>・MIN〜BLK・TOVは1試合平均。移籍したシーズンは合計を1行で表示し、在籍チームを並べています。</li>
        <li>・「—」は公式記録が無い項目です（出場時間は1951-52以降、スティール・ブロックは1973-74以降、ターンオーバーは1977-78以降、3Pは1979-80以降に記録開始）。通算平均は、その項目が記録されているシーズンの試合だけで計算しています。</li>
        <li>・NBA（前身のBAAを含む）での成績です。ABAの成績は含みません。</li>
        <li>・出典: Basketball-Reference（公開データセット sumitrodatta/bball-reference-datasets）</li>
        <li>
          ・項目の意味は
          <Link href="/guide/stats-basics" className="mx-1 font-semibold text-blue underline-offset-2 hover:underline">
            スタッツ表の見方
          </Link>
          で解説しています。
        </li>
      </ul>
    </div>
  );
}
