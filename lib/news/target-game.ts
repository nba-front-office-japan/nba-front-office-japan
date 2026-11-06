import { isValidDateString } from "@/lib/games/date";

// 記事の「対象試合」(任意)。試合プレビュー記事を /games の試合カードに紐づけるために使う。
// - gameDate: /games の表示日(日本時間の YYYY-MM-DD)
// - awayTeam / homeTeam: チームの略称(teams.abbreviation。例: "LAL")。/games の試合データのチームと同じ値
// 3つとも空なら「未設定」。どれか1つだけ入れることはできない(DBの制約でも同じ)。
// 管理画面(app/admin/news/drafts/actions.ts)と入稿API(lib/news/ingest-api.ts)で同じ検証を使う。

export type TargetGame = { gameDate: string; awayTeam: string; homeTeam: string };

const TEAM_RE = /^[A-Z]{2,4}$/;

/** 入力された3つの値を検証する。3つとも空なら null(未設定) */
export function parseTargetGame(raw: { gameDate?: unknown; awayTeam?: unknown; homeTeam?: unknown }): TargetGame | null | { error: string } {
  const texts = [raw.gameDate, raw.awayTeam, raw.homeTeam];
  if (texts.some((v) => v !== undefined && v !== null && typeof v !== "string")) {
    return { error: "対象試合（gameDate・awayTeam・homeTeam）は文字列で指定してください。" };
  }
  const [gameDate, awayTeam, homeTeam] = texts.map((v) => (typeof v === "string" ? v.trim() : ""));
  if (!gameDate && !awayTeam && !homeTeam) return null;
  if (!gameDate || !awayTeam || !homeTeam) {
    return { error: "対象試合は、試合日・アウェイ・ホームの3つをすべて入れてください（設定しない場合は3つとも空にします）。" };
  }
  if (!isValidDateString(gameDate)) return { error: "対象試合の試合日は YYYY-MM-DD（日本時間の /games の日付）で指定してください。" };
  const away = awayTeam.toUpperCase();
  const home = homeTeam.toUpperCase();
  if (!TEAM_RE.test(away) || !TEAM_RE.test(home)) return { error: "対象試合のチームは略称（例: LAL）で指定してください。" };
  if (away === home) return { error: "対象試合のアウェイとホームに同じチームは指定できません。" };
  return { gameDate, awayTeam: away, homeTeam: home };
}

/** チームの略称が teams に登録されているか確かめる。登録のない略称があればエラー文を返す */
export function unknownTeamProblem(target: TargetGame, knownAbbreviations: Iterable<string>): string | null {
  const known = new Set(knownAbbreviations);
  const missing = [target.awayTeam, target.homeTeam].filter((abbr) => !known.has(abbr));
  return missing.length > 0 ? `対象試合のチーム略称が見つかりません: ${missing.join(", ")}` : null;
}

/** DB の列の値に変換する(未設定は3つとも null) */
export function targetGameColumns(target: TargetGame | null) {
  return {
    target_game_date: target?.gameDate ?? null,
    target_away_team: target?.awayTeam ?? null,
    target_home_team: target?.homeTeam ?? null,
  };
}

/** DB の行から読み出す(3つそろっていなければ未設定) */
export function targetGameFromRow(row: { target_game_date: string | null; target_away_team: string | null; target_home_team: string | null }): TargetGame | null {
  return row.target_game_date && row.target_away_team && row.target_home_team
    ? { gameDate: row.target_game_date, awayTeam: row.target_away_team, homeTeam: row.target_home_team }
    : null;
}
