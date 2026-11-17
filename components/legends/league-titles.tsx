import Link from "next/link";
import { seasonLabel } from "@/lib/awards/history";
import { leagueTitleHref, type LeagueTitle } from "@/lib/legends/titles";

// リーグ1位(得点王など)の履歴。部門ごとに「回数」と「獲得した年」を並べ、年はオールタイムリーダーズの年度別リーダーへリンクする。
// 1度も無い選手には出さない(呼び出し側で titles が空なら描画しない)
export function LeagueTitlesSection({ titles, name }: { titles: LeagueTitle[]; name: string }) {
  if (titles.length === 0) return null;
  return (
    <section aria-labelledby="league-titles" className="mt-6 border border-line bg-surface p-5 sm:p-6">
      <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">League Leaders</p>
      <h2 id="league-titles" className="mb-4 text-lg font-semibold">
        {name}が獲得したリーグ1位（得点王など）
      </h2>
      <dl className="divide-y divide-line">
        {titles.map((t) => (
          <div key={t.stat} className="grid gap-x-6 gap-y-1.5 py-3 first:pt-0 last:pb-0 sm:grid-cols-[200px_1fr]">
            <dt>
              <span className="text-base font-bold">{t.label}</span>
              <span className="ml-2 text-base font-extrabold tabular-nums text-blue">{t.seasons.length}回</span>
              <span className="mt-0.5 block text-xs text-muted">{t.note}</span>
            </dt>
            <dd className="min-w-0">
              <ul className="flex flex-wrap gap-x-1.5 gap-y-1">
                {t.seasons.map((s, i) => (
                  <li key={`${s.season}-${s.lg}`} className="whitespace-nowrap text-sm tabular-nums">
                    <Link
                      href={leagueTitleHref(t.stat, s.lg)}
                      className="font-bold text-blue underline underline-offset-2 hover:opacity-80"
                      title={`${s.lg}の年度別リーダー（${t.label}）を見る`}
                    >
                      {seasonLabel(s.season)}
                    </Link>
                    {s.lg === "ABA" && <span className="ml-0.5 text-xs font-bold text-muted">(ABA)</span>}
                    {i < t.seasons.length - 1 && <span className="ml-1.5 text-muted">/</span>}
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        ))}
      </dl>
      <ul className="mt-4 space-y-1 text-xs leading-relaxed text-muted">
        <li>
          ・
          <Link href="/legends/leaders" className="font-semibold text-blue underline-offset-2 hover:underline">
            オールタイムリーダーズ
          </Link>
          の年度別リーダーと同じ基準です。平均・成功率は、規定の試合数などを満たした選手の中での1位です。
        </li>
        <li>・1969-70より前のNBAは、公式には得点・リバウンド・アシストを合計で1位を決めていたため、公式記録と1位が異なるシーズンがあります。</li>
        <li>・出典: Basketball-Reference（公開データセット）</li>
      </ul>
    </section>
  );
}
