import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/page-shell";
import {
  AWARD_SOURCES,
  MAJOR_AWARDS,
  TEAM_AWARDS,
  type AwardWinner,
} from "@/lib/awards/nba-2025-26-official";

// DBの日本語名が明らかに崩れている選手は、誤った表記を出さないよう日本語名を使わず英語名のみ表示する。
// (DBの修正は別作業。修正後はこの一覧から外す)
const SUSPECT_JA_NAMES = new Set(["ジエルエムイアハ・フィアーズ", "コリン・ムウルルエイ＝ブオイルエス"]);

interface PlayerMatch {
  id: string;
  ja: string | null;
}

function SourceLinks({ sources }: { sources: { label: string; url: string }[] }) {
  return (
    <p className="mb-4 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-xs text-muted">
      <span className="font-bold">出典(NBA公式):</span>
      {sources.map((source, index) => (
        <span key={source.url} className="inline-flex items-baseline gap-2">
          {index > 0 && <span aria-hidden>/</span>}
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="break-words text-blue underline-offset-2 hover:underline"
          >
            {source.label}
          </a>
        </span>
      ))}
    </p>
  );
}

function WinnerItem({
  winner,
  match,
}: {
  winner: AwardWinner;
  match: PlayerMatch | undefined;
}) {
  const ja = match?.ja && !SUSPECT_JA_NAMES.has(match.ja) ? match.ja : null;
  const mainName = ja ?? winner.name;
  return (
    <li className="min-w-0 border-l-[3px] border-gold pl-3">
      {match ? (
        <Link
          href={`/players/${match.id}`}
          className="block break-words text-base font-extrabold leading-snug hover:text-blue"
        >
          {mainName}
        </Link>
      ) : (
        <span className="block break-words text-base font-extrabold leading-snug">
          {mainName}
        </span>
      )}
      {ja && <span className="block break-words text-xs text-muted">{winner.name}</span>}
      <span className="mt-0.5 block text-xs text-muted">
        受賞時の所属: {winner.team}
      </span>
    </li>
  );
}

export default async function AwardsPage() {
  const supabase = createServerSupabaseClient();

  // 選手名鑑(players)にいる選手だけ、日本語名とプロフィールへのリンクを付ける。
  // 名前が一意に一致しない場合(未登録・同名複数)はリンクを付けず英語名のみ表示する。
  const allWinners = [...MAJOR_AWARDS, ...TEAM_AWARDS].flatMap((award) => award.winners);
  const dbNames = [
    ...new Set(
      allWinners.filter((w) => w.kind === "player").map((w) => w.dbName ?? w.name)
    ),
  ];
  const { data: players } = await supabase
    .from("players")
    .select("id, full_name, full_name_ja")
    .in("full_name", dbNames);

  const matchesByName = new Map<string, PlayerMatch[]>();
  for (const p of players ?? []) {
    const list = matchesByName.get(p.full_name) ?? [];
    list.push({ id: p.id, ja: p.full_name_ja });
    matchesByName.set(p.full_name, list);
  }
  function findMatch(winner: AwardWinner): PlayerMatch | undefined {
    if (winner.kind !== "player") return undefined;
    const list = matchesByName.get(winner.dbName ?? winner.name);
    return list && list.length === 1 ? list[0] : undefined;
  }

  return (
    <PageShell>
      <div className="-mx-4 bg-navy px-4 py-8 text-white sm:-mx-7 sm:px-7 sm:py-[29px]">
        <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[1.3px] text-[#84b0ff]">
          Awards Database · 2025-26 Season
        </p>
        <h1 className="text-[28px] font-semibold tracking-tight sm:text-[36px]">
          2025-26 NBA Awards
        </h1>
        <p className="mt-1 text-sm text-slate-300">
          NBA公式発表にもとづく、2025-26シーズンの受賞者・選出者の一覧です。
        </p>
      </div>

      <div className="mt-8 space-y-10">
        <section>
          <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">
            Major Awards
          </p>
          <h2 className="mb-1 text-xl font-semibold">主要賞</h2>
          <p className="mb-2 text-xs text-muted">
            所属チームは受賞時点のものです。選手名は選手名鑑に登録のある場合、プロフィールへリンクします。
          </p>
          <SourceLinks sources={[AWARD_SOURCES.major]} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {MAJOR_AWARDS.map((award) => (
              <div key={award.key} className="border border-line bg-surface p-5">
                <p className="text-sm font-bold">{award.ja}</p>
                <p className="mb-3 text-[11px] text-muted">{award.en}</p>
                <ul className="space-y-2">
                  {award.winners.map((winner) => (
                    <WinnerItem key={winner.name} winner={winner} match={findMatch(winner)} />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section>
          <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">
            All-NBA / All-Defensive / All-Rookie
          </p>
          <h2 className="mb-1 text-xl font-semibold">チーム表彰</h2>
          <p className="mb-2 text-xs text-muted">
            所属チームは選出時点のものです(NBA公式の投票結果に記載のチーム)。掲載順は公式発表のアルファベット順です。
          </p>
          <SourceLinks
            sources={[
              AWARD_SOURCES.allNba,
              AWARD_SOURCES.allDefensive,
              AWARD_SOURCES.allRookie,
              AWARD_SOURCES.votingResults,
            ]}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TEAM_AWARDS.map((award) => (
              <div key={award.key} className="border border-line bg-surface p-5">
                <p className="text-sm font-bold">{award.ja}</p>
                <p className="mb-3 text-[11px] text-muted">{award.en}</p>
                <ul className="space-y-3">
                  {award.winners.map((winner) => (
                    <WinnerItem key={winner.name} winner={winner} match={findMatch(winner)} />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </div>
    </PageShell>
  );
}
