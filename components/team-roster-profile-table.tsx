import Link from "next/link";

export interface ProfileRow {
  id: string;
  name: string;
  position: string | null;
  heightCm: number | null;
  weightKg: number | null;
  birthDate: string | null;
  age: number | null;
  yearsOfService: number | null;
  draftText: string | null;
}

const COLUMNS = ["選手名", "#", "POS", "身長", "体重", "生年月日", "年齢", "経験年数", "出身校", "獲得経緯"];

// 背番号(#)・出身校は、元のロスター表(NBA_2026_2027ロスター.xlsx)には存在するが
// Supabaseへは未取り込みのため、現時点では値を持たない(「—」表示)。推測・外部取得は行わない。
// 経験年数(YOS)はplayer_season_rosters.years_of_serviceから表示する。0はルーキーを示す
// 有効な値なのでnullとは区別し、nullのときだけ「—」にする。
export function TeamRosterProfileTable({ rows }: { rows: ProfileRow[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted">ロスターデータがありません。</p>;
  }

  return (
    <div className="overflow-x-auto border border-line bg-surface">
      <table className="w-full min-w-[820px] border-collapse text-[13px]">
        <thead>
          <tr className="border-b border-line">
            {COLUMNS.map((label) => (
              <th
                key={label}
                className="whitespace-nowrap px-2 py-2.5 text-left text-[11px] font-bold text-muted"
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-line/60 hover:bg-[#f6f9ff] dark:hover:bg-white/[.03]">
              <td className="whitespace-nowrap px-2 py-3 font-semibold">
                <Link href={`/players/${row.id}`} className="hover:text-blue">
                  {row.name}
                </Link>
              </td>
              <td className="whitespace-nowrap px-2 py-3 text-muted">—</td>
              <td className="whitespace-nowrap px-2 py-3">{row.position ?? "—"}</td>
              <td className="whitespace-nowrap px-2 py-3">
                {row.heightCm !== null ? `${row.heightCm} cm` : "—"}
              </td>
              <td className="whitespace-nowrap px-2 py-3">
                {row.weightKg !== null ? `${row.weightKg} kg` : "—"}
              </td>
              <td className="whitespace-nowrap px-2 py-3">{row.birthDate ?? "—"}</td>
              <td className="whitespace-nowrap px-2 py-3">{row.age ?? "—"}</td>
              <td className="whitespace-nowrap px-2 py-3">
                {row.yearsOfService !== null ? row.yearsOfService : "—"}
              </td>
              <td className="whitespace-nowrap px-2 py-3 text-muted">—</td>
              <td className="whitespace-nowrap px-2 py-3">{row.draftText ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
