import { TEAM_PRIMARY_COLORS } from "@/lib/team-colors";

// ランキング表などでチーム名の左に置く、チームカラーの小さな目印(装飾のため読み上げ対象外)。
// 色は NBA.com のチームカラー(補正前の元の値)。ページ背景にはしない。
export function TeamColorChip({ abbreviation }: { abbreviation: string }) {
  const color = TEAM_PRIMARY_COLORS[abbreviation];
  if (!color) return null;
  return (
    <span
      aria-hidden
      className="inline-block h-2.5 w-2.5 shrink-0 rounded-[2px] ring-1 ring-black/10 dark:ring-white/25"
      style={{ backgroundColor: color }}
    />
  );
}
