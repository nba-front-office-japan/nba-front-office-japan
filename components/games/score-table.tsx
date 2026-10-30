import { overtimeTotal, type GameSummary, type GameTeamLine } from "@/lib/games/types";
import { TeamName } from "./names";

// クオータースコア表(アウェー → ホームの順)。列: 1Q・2Q・3Q・4Q・OT・TOTAL
const COLUMNS = ["1Q", "2Q", "3Q", "4Q", "OT", "TOTAL"] as const;

function cells(line: GameTeamLine): (number | null)[] {
  return [...line.quarters, overtimeTotal(line), line.score];
}

function Row({ side, line }: { side: "アウェー" | "ホーム"; line: GameTeamLine }) {
  return (
    <tr className="border-t border-line">
      <th scope="row" className="py-2 pr-2 text-left font-normal">
        {/* 新聞紙風ページでは、アウェー=紺・ホーム=赤の帯を添える(他のページでは既定の色) */}
        <span className={`mb-0.5 block w-fit px-1.5 text-[10px] font-bold text-white ${side === "アウェー" ? "bg-[var(--np-navy,var(--navy))]" : "bg-[var(--np-red,#c03221)]"}`}>{side}</span>
        {/* 上段にカタカナの正式チーム名、下段に英語の正式名(teams.name)。略称は出さない */}
        <TeamName team={line} size="sm" />
      </th>
      {cells(line).map((v, i) => (
        <td
          key={COLUMNS[i]}
          className={`px-1 py-2 text-center tabular-nums ${i === COLUMNS.length - 1 ? "border-l border-line text-base font-extrabold" : "text-sm"}`}
        >
          {v ?? "–"}
        </td>
      ))}
    </tr>
  );
}

export function ScoreTable({ game }: { game: GameSummary }) {
  return (
    <table className="w-full table-fixed border-collapse">
      <thead>
        <tr className="border-b-2 border-foreground text-[11px] font-extrabold text-muted">
          <th scope="col" className="w-[38%] pb-1 text-left sm:w-[42%]">
            <span className="sr-only">チーム</span>
          </th>
          {COLUMNS.map((c) => (
            <th key={c} scope="col" className="px-1 pb-1 text-center">
              {c}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        <Row side="アウェー" line={game.away} />
        <Row side="ホーム" line={game.home} />
      </tbody>
    </table>
  );
}
