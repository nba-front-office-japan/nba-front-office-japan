import type { GameTeamLine } from "@/lib/games/types";

// ボックススコア表の見出し帯。アウェーは紺、ホームは赤のベタ面に、チーム名(カタカナ・英語)を白抜きで出す。
// 表(BOX_TABLE_FRAME)は帯の真下に、同じ色の枠でつなげる。新聞紙風ページ以外では既定の紺・赤を使う。
export function BoxScoreHeading({ side, team }: { side: "アウェー" | "ホーム"; team: GameTeamLine }) {
  return (
    <h3 className={`${side === "アウェー" ? "np-ink-navy bg-[var(--navy)]" : "np-ink-red bg-[#a8262b]"} flex items-end justify-between gap-3 px-3 py-2 text-white`}>
      <span className="min-w-0">
        <span className="block text-[10px] font-bold tracking-[1.5px] opacity-85">{side}</span>
        <span className="np-serif block text-base font-extrabold leading-snug sm:text-lg">{team.nameJa ?? team.name}</span>
        {team.nameJa && <span className="block text-[10px] font-normal leading-tight opacity-80 sm:text-xs">{team.name}</span>}
      </span>
      <span aria-hidden className="np-blackletter shrink-0 text-lg leading-none opacity-90 sm:text-2xl">
        Box Score
      </span>
    </h3>
  );
}

export function boxTableFrame(side: "アウェー" | "ホーム"): string {
  return `overflow-x-auto border-2 border-t-0 bg-surface ${side === "アウェー" ? "border-[var(--np-navy,var(--navy))]" : "border-[var(--np-red,#a8262b)]"}`;
}
