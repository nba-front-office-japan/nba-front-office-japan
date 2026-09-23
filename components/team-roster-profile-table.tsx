import Link from "next/link";

export interface ProfileRow {
  id: string;
  name: string;
  nameEn: string | null;
  position: string | null;
  jerseyNumber: number | null;
  birthDate: string | null;
  age: number | null;
  preDraftTeam: string | null;
  nationality: string | null;
  yearsOfService: number | null;
  draftText: string | null;
}

const COLUMNS = [
  "選手名",
  "POS",
  "背番号",
  "生年月日",
  "年齢（2026年10月1日時点）",
  "最終在籍校／直前所属",
  "国籍",
  "経験年数",
  "ドラフト情報",
];

// 背番号・経験年数は0が有効な値のため、nullのときだけ「—」にする。
function orDash(value: string | number | null): string | number {
  return value === null || value === "" ? "—" : value;
}

export function TeamRosterProfileTable({ rows }: { rows: ProfileRow[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted">ロスターデータがありません。</p>;
  }

  return (
    <div className="overflow-x-auto border border-line bg-surface">
      <table className="w-full min-w-[960px] border-collapse text-[13px]">
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
                {row.nameEn && row.nameEn !== row.name && (
                  <div className="text-xs font-normal text-muted">{row.nameEn}</div>
                )}
              </td>
              <td className="whitespace-nowrap px-2 py-3">{orDash(row.position)}</td>
              <td className="whitespace-nowrap px-2 py-3">{orDash(row.jerseyNumber)}</td>
              <td className="whitespace-nowrap px-2 py-3">{orDash(row.birthDate)}</td>
              <td className="whitespace-nowrap px-2 py-3">{orDash(row.age)}</td>
              <td className="whitespace-nowrap px-2 py-3">{orDash(row.preDraftTeam)}</td>
              <td className="whitespace-nowrap px-2 py-3">{orDash(row.nationality)}</td>
              <td className="whitespace-nowrap px-2 py-3">{orDash(row.yearsOfService)}</td>
              <td className="whitespace-nowrap px-2 py-3">{orDash(row.draftText)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
