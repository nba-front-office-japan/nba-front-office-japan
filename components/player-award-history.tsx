import { TEAM_LABEL, seasonLabel, type AwardSummary } from "@/lib/awards/history";

// 選手プロフィールの「個人賞・表彰」。賞ごとに合計回数と受賞シーズン(古い順)を表示し、
// All-NBA・All-Defensive・All-Rookie は 1st / 2nd / 3rd Team ごとの内訳も出す。
// 受賞シーズンは1つずつ折り返せる単位で並べ、多くても年度が途中で切れないようにする。
// 表彰歴のない選手には表示しない(呼び出し側で summaries が空なら出さない)。

function Seasons({ seasons }: { seasons: number[] }) {
  return (
    <ul className="flex flex-wrap gap-x-1.5 gap-y-1">
      {seasons.map((s, i) => (
        <li key={s} className="whitespace-nowrap text-sm tabular-nums">
          {seasonLabel(s)}
          {i < seasons.length - 1 && <span className="ml-1.5 text-muted">/</span>}
        </li>
      ))}
    </ul>
  );
}

export function PlayerAwardHistory({ summaries }: { summaries: AwardSummary[] }) {
  return (
    <section aria-labelledby="award-history" className="mt-8 border border-line bg-surface p-5 sm:p-6">
      <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">Awards & Honors</p>
      <h2 id="award-history" className="mb-4 text-lg font-semibold">
        個人賞・表彰
      </h2>
      <dl className="divide-y divide-line">
        {summaries.map((a) => (
          <div key={a.key} className="grid gap-x-6 gap-y-1.5 py-3 first:pt-0 last:pb-0 sm:grid-cols-[200px_1fr]">
            <dt>
              <span className="text-base font-bold">{a.label}</span>
              <span className="ml-2 text-base font-extrabold tabular-nums text-blue">{a.count}回</span>
              {a.note && <span className="mt-0.5 block text-xs text-muted">{a.note}</span>}
            </dt>
            <dd className="min-w-0">
              {a.byTeam && a.byTeam.length > 0 ? (
                <dl className="space-y-1.5">
                  {a.byTeam.map((t) => (
                    <div key={t.team} className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      <dt className="shrink-0 whitespace-nowrap text-xs font-bold text-muted">
                        {TEAM_LABEL[t.team]}（{t.seasons.length}回）：
                      </dt>
                      <dd className="min-w-0">
                        <Seasons seasons={t.seasons} />
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <Seasons seasons={a.seasons} />
              )}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
