import { overtimeTotal, type GameSummary, type GameTeamLine } from "@/lib/games/types";

// クオータースコア表(アウェー → ホームの順)。列: 1Q・2Q・3Q・4Q・OT・TOTAL
const COLUMNS = ["1Q", "2Q", "3Q", "4Q", "OT", "TOTAL"] as const;

function cells(line: GameTeamLine): (number | null)[] {
  return [...line.quarters, overtimeTotal(line), line.score];
}

function Row({ side, line }: { side: "アウェー" | "ホーム"; line: GameTeamLine }) {
  return (
    <tr className="border-t border-line">
      <th scope="row" className="py-2 pr-2 text-left font-normal">
        <span className="block text-[10px] font-bold text-muted">{side}</span>
        <span className="block text-sm font-extrabold">{line.abbreviation}</span>
        {/* teams.name はチームの正式名(例: Detroit Pistons)。都市名を含むため city は付けない */}
        <span className="hidden text-xs text-muted sm:block">{line.name}</span>
      </th>
      {cells(line).map((v, i) => (
        <td
          key={COLUMNS[i]}
          className={`px-1 py-2 text-center tabular-nums ${i === COLUMNS.length - 1 ? "text-base font-extrabold" : "text-sm"}`}
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
        <tr className="text-[11px] font-extrabold text-muted">
          <th scope="col" className="w-[34%] pb-1 text-left sm:w-[40%]">
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
