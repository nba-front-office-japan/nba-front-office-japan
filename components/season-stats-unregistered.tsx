import Link from "next/link";

// 成績(player_stats)がまだ登録されていないシーズンの Stats 表示。
// 成績を登録すると、画面側はこの表示の代わりに成績の表を出す(データの有無で切り替える)。
export function SeasonStatsUnregistered({
  seasonLabel,
  fallbackHref,
  fallbackLabel,
}: {
  seasonLabel: string;
  // 成績が登録済みのシーズンへの導線
  fallbackHref?: string;
  fallbackLabel?: string;
}) {
  return (
    <div className="border border-line bg-surface p-8 text-center sm:p-10">
      <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">
        {seasonLabel} Stats
      </p>
      <p className="text-lg font-bold">{seasonLabel}シーズンのスタッツは未登録です</p>
      <p className="mt-2 text-sm text-muted">
        成績データを登録すると、ここに表示されます。
      </p>
      {fallbackHref && fallbackLabel && (
        <p className="mt-4 text-sm">
          <Link href={fallbackHref} className="font-semibold text-blue underline underline-offset-4 hover:no-underline">
            {fallbackLabel} →
          </Link>
        </p>
      )}
    </div>
  );
}
