import Link from "next/link";
import type { GameTeamLine } from "@/lib/games/types";

// 試合結果・ボックススコアのチーム名・選手名の表示(チーム名はカタカナを主に英語名を補助に、選手名はカタカナのみ)。

/** チーム名: 上段にカタカナの正式名、下段に英語の正式名。カタカナが無いチームは英語名だけ */
export function TeamName({ team, size = "md" }: { team: GameTeamLine; size?: "sm" | "md" }) {
  const main = size === "sm" ? "text-[13px] leading-tight sm:text-sm" : "text-base leading-snug";
  if (!team.nameJa) return <span className={`block font-extrabold ${main}`}>{team.name}</span>;
  return (
    <>
      <span className={`block font-extrabold ${main}`}>{team.nameJa}</span>
      <span className="block text-[10px] font-normal leading-tight text-muted sm:text-xs">{team.name}</span>
    </>
  );
}

/** 選手名: カタカナ名があればカタカナだけを表示する(英語名は行を詰めるため出さず、マウスを重ねたときの補足にだけ使う)。
 *  カタカナ名が未登録なら英語名だけ(空欄にしない) */
export function PlayerName({ name, nameJa, playerId }: { name: string; nameJa: string | null; playerId: string | null }) {
  const label = nameJa ?? name;
  const title = nameJa ? name : undefined;
  return playerId ? (
    <Link href={`/players/${playerId}?view=stats`} title={title} className="hover:text-blue hover:underline">
      {label}
    </Link>
  ) : (
    <span title={title}>{label}</span>
  );
}
