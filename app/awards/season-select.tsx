"use client";

import { useRouter } from "next/navigation";

// 年度の選択。選ぶとすぐ /awards?season=YYYY-YY へ移動する(URLに年度が残るため、共有・再読込でも同じ年度を開ける)。
// JavaScript が動かない場合も、「表示」ボタンで同じURLへ移動できる。
export function SeasonSelect({ seasons, selected }: { seasons: string[]; selected: string }) {
  const router = useRouter();
  return (
    <form method="get" action="/awards" className="flex flex-wrap items-end gap-2">
      <label className="grid gap-1 text-xs font-bold text-muted">
        年度
        <select
          name="season"
          defaultValue={selected}
          onChange={(e) => router.push(`/awards?season=${e.target.value}`, { scroll: false })}
          className="min-w-[140px] border border-line bg-surface px-3 py-2 text-sm font-bold tabular-nums text-foreground"
        >
          {seasons.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
      <noscript>
        <button type="submit" className="border border-line bg-surface px-3 py-2 text-sm font-bold">
          表示
        </button>
      </noscript>
    </form>
  );
}
