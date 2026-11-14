// 河村勇輝の選手ページだけに出すセクション(Gリーグ成績・日本代表成績)。
// page.tsx から kawamuraExtrasFor() が null でないときだけ使う。
import Link from "next/link";
import {
  GLEAGUE_CURRENT_SEASON,
  GLEAGUE_SEASON_TYPE_LABEL,
  GLEAGUE_TEAMS,
  gleagueTeamNameJa,
  totalsOf,
  type GLeagueGame,
  type GLeagueSeasonType,
  type KawamuraExtras,
} from "@/lib/kawamura";
import type { NationalTeamGame } from "@/lib/kawamura/national-team";
import { deriveStats, formatPct, formatStat, type RawStatTotals } from "@/lib/stats";
import { seasonLabel } from "@/lib/seasons";
import { StickyTableFrame } from "@/components/sticky-table-frame";
import { KawamuraGameTable, gameDateLabel, type KawamuraGameRow } from "@/components/kawamura/kawamura-game-table";
import { GLeagueGameLog, type GLeagueLogSeason } from "@/components/kawamura/gleague-game-log";

const TYPE_ORDER: GLeagueSeasonType[] = ["tipoff", "regular", "playoffs"];

function teamJaFor(season: number, games: GLeagueGame[]): string {
  if (games.length > 0) {
    return [...new Set(games.map((g) => gleagueTeamNameJa(season, g.teamName)))].join("・");
  }
  return GLEAGUE_TEAMS.find((t) => t.season === season)?.nameJa ?? "";
}

function gleagueRow(g: GLeagueGame): KawamuraGameRow {
  return {
    ...g,
    key: g.gameId,
    dateLabel: gameDateLabel(g.gameDate),
    opponentLabel: `${g.isHome ? "vs" : "@"} ${g.opponentAbbr}`,
    badge: g.seasonType === "regular" ? undefined : GLEAGUE_SEASON_TYPE_LABEL[g.seasonType],
    win: g.result === null ? null : g.result === "W",
  };
}

function nationalRow(g: NationalTeamGame, tournamentShort: string): KawamuraGameRow {
  return {
    ...g,
    dateLabel: gameDateLabel(g.gameDate, true),
    opponentLabel: `vs ${g.opponentJa}`,
    badge: `${tournamentShort}・${g.round}`,
    win: g.teamScore > g.opponentScore,
    scoreLabel: `${g.teamScore}-${g.opponentScore}${g.overtime ? "(OT)" : ""}`,
  };
}

const lastUpdated = (updatedAt: string | null) => {
  if (!updatedAt) return "";
  const [y, m, d] = updatedAt.split("-").map(Number);
  return `（${y}年${m}月${d}日更新）`;
};

function SectionBox({ id, eyebrow, title, children }: { id?: string; eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={id ? `${id}-title` : undefined} className="mt-8 scroll-mt-20 border border-line bg-surface p-5 sm:p-6">
      <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">{eyebrow}</p>
      <h2 id={id ? `${id}-title` : undefined} className="mb-4 text-lg font-semibold">
        {title}
      </h2>
      {children}
    </section>
  );
}

function StatGrid({ totals }: { totals: RawStatTotals }) {
  const d = deriveStats(totals);
  const items = [
    { label: "試合", value: String(totals.gamesPlayed) },
    { label: "平均得点", value: formatStat(d.ppg) },
    { label: "平均リバウンド", value: formatStat(d.rpg) },
    { label: "平均アシスト", value: formatStat(d.apg) },
    { label: "平均出場時間", value: formatStat(d.mpg) },
    { label: "FG%", value: formatPct(d.fgPct) },
    { label: "3P%", value: formatPct(d.threePct) },
    { label: "FT%", value: formatPct(d.ftPct) },
    { label: "平均スティール", value: formatStat(d.stlPg) },
    { label: "平均ターンオーバー", value: formatStat(d.tovPg) },
  ];
  return (
    <dl className="grid grid-cols-3 gap-x-4 gap-y-3 text-sm sm:grid-cols-5">
      {items.map((item) => (
        <div key={item.label}>
          <dt className="text-muted">{item.label}</dt>
          <dd className="font-semibold tabular-nums">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Profile: 今季のGリーグ成績 */
export function KawamuraGLeagueCurrentCard({ extras, playerId }: { extras: KawamuraExtras; playerId: string }) {
  const games = extras.gleagueGames.filter((g) => g.season === GLEAGUE_CURRENT_SEASON);
  const team = teamJaFor(GLEAGUE_CURRENT_SEASON, games);
  return (
    <SectionBox id="kawamura-gleague-current" eyebrow="This Season · G League" title={`${seasonLabel(GLEAGUE_CURRENT_SEASON)} Gリーグ今季成績`}>
      <p className="-mt-3 mb-4 text-xs text-muted">
        {team}
        {games.length > 0 && `・${gameDateLabel(games[0].gameDate)}の試合まで（現地日付）`}
        {lastUpdated(extras.gleagueUpdatedAt)}
      </p>
      {games.length > 0 ? (
        <StatGrid totals={totalsOf(games)} />
      ) : (
        <p className="text-sm text-muted">今季のGリーグの出場試合はまだありません。</p>
      )}
      <p className="mt-4 text-sm">
        <Link href={`/players/${playerId}?view=gamelog`} className="font-semibold text-blue underline-offset-2 hover:underline">
          Gリーグの試合別成績（Game Log）
        </Link>
        <span className="mx-2 text-muted">/</span>
        <Link href={`/players/${playerId}?view=stats#kawamura-gleague`} className="font-semibold text-blue underline-offset-2 hover:underline">
          シーズン別のGリーグ成績
        </Link>
      </p>
    </SectionBox>
  );
}

/** Profile: 日本代表成績の要約(大会ごとの平均) */
export function KawamuraNationalTeamSummary({ extras, playerId }: { extras: KawamuraExtras; playerId: string }) {
  return (
    <SectionBox id="kawamura-japan-summary" eyebrow="Japan National Team" title="日本代表成績（主要国際大会）">
      <div className="grid gap-4 sm:grid-cols-2">
        {extras.nationalTeamTournaments.map((t) => {
          const games = extras.nationalTeamGames.filter((g) => g.tournament === t.id);
          const d = deriveStats(totalsOf(games));
          const wins = games.filter((g) => g.teamScore > g.opponentScore).length;
          return (
            <div key={t.id} className="border border-line bg-background p-4">
              <p className="text-sm font-bold">{t.name}</p>
              <p className="mt-0.5 text-xs text-muted">
                {games.length}試合（チーム{wins}勝{games.length - wins}敗）・{t.note}
              </p>
              <dl className="mt-3 grid grid-cols-3 gap-2 text-sm">
                {[
                  { label: "平均得点", value: formatStat(d.ppg) },
                  { label: "平均アシスト", value: formatStat(d.apg) },
                  { label: "3P%", value: formatPct(d.threePct) },
                ].map((item) => (
                  <div key={item.label}>
                    <dt className="text-xs text-muted">{item.label}</dt>
                    <dd className="text-lg font-semibold tabular-nums">{item.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-sm">
        <Link href={`/players/${playerId}?view=stats#kawamura-japan`} className="font-semibold text-blue underline-offset-2 hover:underline">
          日本代表の試合別成績を見る
        </Link>
      </p>
    </SectionBox>
  );
}

const SEASON_COLUMNS = ["シーズン", "チーム", "区分", "G", "MPG", "PTS", "REB", "AST", "STL", "BLK", "FG%", "3P%", "FT%", "TOV"];

function SeasonRow({ label, team, type, totals, strong }: { label: string; team: string; type: string; totals: RawStatTotals; strong?: boolean }) {
  const d = deriveStats(totals);
  const cell = "whitespace-nowrap px-2 py-3 tabular-nums";
  return (
    <tr className={`border-b border-line/60 ${strong ? "bg-[#f6f9ff] font-bold dark:bg-white/[.04]" : "hover:bg-[#f6f9ff] dark:hover:bg-white/[.03]"}`}>
      <td className={`${cell} font-bold`}>{label}</td>
      <td className={`${cell} text-muted`}>{team}</td>
      <td className={cell}>{type}</td>
      <td className={cell}>{totals.gamesPlayed}</td>
      <td className={cell}>{formatStat(d.mpg)}</td>
      <td className={cell}>{formatStat(d.ppg)}</td>
      <td className={cell}>{formatStat(d.rpg)}</td>
      <td className={cell}>{formatStat(d.apg)}</td>
      <td className={cell}>{formatStat(d.stlPg)}</td>
      <td className={cell}>{formatStat(d.blkPg)}</td>
      <td className={cell}>{formatPct(d.fgPct)}</td>
      <td className={cell}>{formatPct(d.threePct)}</td>
      <td className={cell}>{formatPct(d.ftPct)}</td>
      <td className={cell}>{formatStat(d.tovPg)}</td>
    </tr>
  );
}

/** Stats: シーズン・チーム・区分(Tip-Off/レギュラー/プレーオフ)別のGリーグ成績 */
export function KawamuraGLeagueSeasonStats({ extras }: { extras: KawamuraExtras }) {
  const seasons = [...new Set(extras.gleagueGames.map((g) => g.season))].sort((a, b) => b - a);
  return (
    <SectionBox id="kawamura-gleague" eyebrow="G League" title="Gリーグ成績（シーズン別）">
      {seasons.length === 0 ? (
        <p className="text-sm text-muted">Gリーグ成績は準備中です。</p>
      ) : (
        <>
          <p className="mb-2 text-xs text-muted sm:hidden">→ 横にスクロールできます</p>
          <StickyTableFrame className="overflow-x-auto border border-line bg-surface">
            <table className="w-full min-w-[900px] border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-line">
                  {SEASON_COLUMNS.map((c) => (
                    <th key={c} className="whitespace-nowrap px-2 py-2.5 text-left text-[11px] font-bold text-muted">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {seasons.flatMap((season) => {
                  const seasonGames = extras.gleagueGames.filter((g) => g.season === season);
                  const team = teamJaFor(season, seasonGames);
                  const types = TYPE_ORDER.filter((t) => seasonGames.some((g) => g.seasonType === t));
                  const rows = types.map((t) => (
                    <SeasonRow
                      key={`${season}-${t}`}
                      label={seasonLabel(season)}
                      team={team}
                      type={GLEAGUE_SEASON_TYPE_LABEL[t]}
                      totals={totalsOf(seasonGames.filter((g) => g.seasonType === t))}
                    />
                  ));
                  if (types.length > 1) {
                    rows.push(<SeasonRow key={`${season}-all`} label={seasonLabel(season)} team={team} type="合計" totals={totalsOf(seasonGames)} strong />);
                  }
                  return rows;
                })}
                <SeasonRow key="career" label="通算" team="" type="全区分" totals={totalsOf(extras.gleagueGames)} strong />
              </tbody>
            </table>
          </StickyTableFrame>
          <p className="mt-2 text-xs leading-6 text-muted">
            Gリーグはシーズン前半の「Tip-Off Tournament（ティップオフ・トーナメント）」と、その後の「レギュラーシーズン」に分かれていて、
            区分ごとに分けて表示しています。平均は試合ごとの成績の合計から計算しています。出典：NBA Gリーグ公式（stats.gleague.nba.com）
            {lastUpdated(extras.gleagueUpdatedAt)}。
          </p>
        </>
      )}
    </SectionBox>
  );
}

/** Stats: 日本代表の大会別平均と試合別成績 */
export function KawamuraNationalTeamStats({ extras }: { extras: KawamuraExtras }) {
  return (
    <SectionBox id="kawamura-japan" eyebrow="Japan National Team" title="日本代表成績（主要国際大会）">
      <p className="mb-2 text-xs text-muted sm:hidden">→ 横にスクロールできます</p>
      <StickyTableFrame className="overflow-x-auto border border-line bg-surface">
        <table className="w-full min-w-[900px] border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-line">
              {["大会", "チーム成績", "", "G", "MPG", "PTS", "REB", "AST", "STL", "BLK", "FG%", "3P%", "FT%", "TOV"].map((c, i) => (
                <th key={`${c}-${i}`} className="whitespace-nowrap px-2 py-2.5 text-left text-[11px] font-bold text-muted">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {extras.nationalTeamTournaments.map((t) => {
              const games = extras.nationalTeamGames.filter((g) => g.tournament === t.id);
              const wins = games.filter((g) => g.teamScore > g.opponentScore).length;
              return (
                <SeasonRow key={t.id} label={t.name} team={`${wins}勝${games.length - wins}敗`} type="" totals={totalsOf(games)} />
              );
            })}
            <SeasonRow key="all" label="2大会合計" team="" type="" totals={totalsOf(extras.nationalTeamGames)} strong />
          </tbody>
        </table>
      </StickyTableFrame>

      <h3 className="mb-3 mt-6 text-base font-semibold">試合別成績（{extras.nationalTeamGames.length}試合）</h3>
      <KawamuraGameTable
        rows={extras.nationalTeamGames.map((g) =>
          nationalRow(g, extras.nationalTeamTournaments.find((t) => t.id === g.tournament)?.shortName ?? ""),
        )}
        emptyText="日本代表の試合データはありません。"
      />
      <p className="mt-2 text-xs leading-6 text-muted">
        日付は現地の試合日です。W杯2023の1次ラウンド3試合の出場時間はFIBA公式の分単位の記録です（大会平均の MPG は分単位の値から計算）。
        出典：FIBA公式、ESPN、Land of Basketball（試合ごとのボックススコア）。合計はFIBA公式・Basketball-Referenceの大会成績と照合しています。
      </p>
    </SectionBox>
  );
}

/** Game Log: Gリーグの試合別成績(今季＋過去シーズン切替) */
export function KawamuraGLeagueLogSection({ extras, nbaNote }: { extras: KawamuraExtras; nbaNote?: string }) {
  const seasons: GLeagueLogSeason[] = GLEAGUE_TEAMS.map((t) => t.season)
    .sort((a, b) => b - a)
    .map((season) => {
      const games = extras.gleagueGames.filter((g) => g.season === season);
      return { season, label: seasonLabel(season), teamJa: teamJaFor(season, games), rows: games.map(gleagueRow) };
    })
    // 今季は出場が無くても出す。過去シーズンはデータがあるものだけ
    .filter((s) => s.season === GLEAGUE_CURRENT_SEASON || s.rows.length > 0);

  return (
    <SectionBox id="kawamura-gleague-log" eyebrow="Game Log · G League" title="Gリーグ 試合別成績">
      {nbaNote && <p className="-mt-2 mb-4 border-l-[3px] border-gold pl-3 text-xs leading-6 text-muted">{nbaNote}</p>}
      <GLeagueGameLog seasons={seasons} />
      <p className="mt-2 text-xs leading-6 text-muted">
        出場した試合だけを載せています。日付は現地（米国）の試合日で、「Tip-Off」はシーズン前半のTip-Off Tournamentの試合です。
        平均は表示中のシーズンの合計を試合数で割った値、FG%・3P%・FT%は合計の成功数÷試投数です。出典：NBA Gリーグ公式（stats.gleague.nba.com）
        {lastUpdated(extras.gleagueUpdatedAt)}。
      </p>
    </SectionBox>
  );
}
