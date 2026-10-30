// 選手ページ(/players/[playerId])の選手・現所属の取得と、タイトル・説明文・紹介文の組み立て。
// 取得は React の cache() で1回のリクエストにつき1回だけにする(generateMetadata とページ本体で共通)。
import "server-only";
import { cache } from "react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ROSTER_SEASON, seasonLabel } from "@/lib/seasons";
import { teamNameJa } from "@/lib/team-names-ja";
import { formatDraftInfo } from "@/lib/draft-format";
import { featuredPlayerFor } from "@/lib/featured-players";
import type { Database } from "@/lib/supabase/types";
import type { PlayerCurrentSeasonStats } from "@/lib/player-box-score-stats";
import { deriveStats, formatStat } from "@/lib/stats";

type PlayerRow = Database["public"]["Tables"]["players"]["Row"];
type TeamRow = Database["public"]["Tables"]["teams"]["Row"];

export type PlayerPageBase = {
  player: PlayerRow;
  // 2026-27 の現在所属(player_season_rosters)。行が無ければ null(画面では「ロスター準備中」)
  currentRosterTeamId: string | null;
  currentTeam: TeamRow | null;
};

/** 選手と現在所属。選手が見つからなければ null */
export const fetchPlayerPageBase = cache(async (playerId: string): Promise<PlayerPageBase | null> => {
  const supabase = createServerSupabaseClient();
  const { data: player, error } = await supabase.from("players").select("*").eq("id", playerId).single();
  if (error || !player) return null;

  const { data: currentRoster } = await supabase
    .from("player_season_rosters")
    .select("team_id")
    .eq("player_id", playerId)
    .eq("season", ROSTER_SEASON)
    .maybeSingle();
  const { data: currentTeam } = currentRoster
    ? await supabase.from("teams").select("*").eq("id", currentRoster.team_id).single()
    : { data: null };

  return { player, currentRosterTeamId: currentRoster?.team_id ?? null, currentTeam: currentTeam ?? null };
});

/** 表示名: 日本語名があれば「日本語名（英語名）」、なければ英語名 */
export function playerDisplayName(player: Pick<PlayerRow, "full_name" | "full_name_ja">): string {
  return player.full_name_ja ? `${player.full_name_ja}（${player.full_name}）` : player.full_name;
}

/** 所属チームの名前(カタカナの正式名。なければ英語名)。所属がなければ null */
function teamLabel(team: TeamRow | null): string | null {
  return team ? (teamNameJa(team.abbreviation) ?? team.name) : null;
}

/** 「{チーム}所属の{ポジション}」。無い項目は省き、両方無ければ null */
function roleText(team: string | null, position: string | null): string | null {
  if (team && position) return `${team}所属の${position}`;
  if (team) return `${team}所属の選手`;
  if (position) return `ポジション${position}の選手`;
  return null;
}

/** ドラフトの表記(例: 2018年ドラフト1巡目1位 / 2019年ドラフト外)。巡目・順位が分からない場合は出さない */
function draftText(player: PlayerRow): string | null {
  const draft = formatDraftInfo(player, "?");
  if (!draft || draft.includes("?")) return null;
  // formatDraftInfo の「2018年 1巡目 1位」「2019年 ドラフト外」を文中の表記にする
  return draft.includes("ドラフト外") ? draft.replace(/\s+/g, "") : draft.replace(/^(\d{4}年)\s+/, "$1ドラフト").replace(/\s+/g, "");
}

/** 検索結果のタイトル用のチームの短い呼び名(例: サンダー)。所属がなければ null */
function teamShortLabel(team: TeamRow | null): string | null {
  if (!team) return null;
  if (team.abbreviation === "LAC") return "クリッパーズ";
  if (team.abbreviation === "PHI") return "76ers";
  const full = teamNameJa(team.abbreviation);
  return full ? full.slice(full.lastIndexOf("・") + 1) : team.name;
}

/** タイトル用の今季成績(例: 今季5.6点・4.2リバウンド)。得点と、リバウンド・アシストの多い方 */
function currentSeasonTitleText(current: PlayerCurrentSeasonStats): string {
  const d = deriveStats(current.totals);
  const second = n(d.apg) > n(d.rpg) ? `${formatStat(d.apg)}アシスト` : `${formatStat(d.rpg)}リバウンド`;
  return `今季${formatStat(d.ppg)}点・${second}`;
}

const n = (value: number | null | undefined) => value ?? 0;

// 検索結果でクリックされやすいよう、選手名のすぐ後に「身長・成績」、続けて所属チームと今季成績を入れる。
// サイト名はGoogleが別に表示するため、タイトルの末尾には付けない(選手名と成績が途中で切れないようにする)
// current: 今季の成績(ボックススコアから集計)。出場が無ければ null
export function playerPageTitle(
  { player, currentTeam }: PlayerPageBase,
  view: "profile" | "stats",
  current: PlayerCurrentSeasonStats | null = null,
): string {
  const name = playerDisplayName(player);
  const team = teamShortLabel(currentTeam);
  const tail = [team, current ? currentSeasonTitleText(current) : null].filter(Boolean).join(" ");
  const suffix = tail ? `｜${tail}` : "";
  if (view === "stats") return `${name}のシーズン別成績・スタッツ${suffix}`;
  // 「{選手名} 身長」で検索されることが多いため、身長が分かる選手は「身長」を入れる
  const height = player.height_cm ? "身長・" : "";
  // 有名選手(lib/featured-players.ts)は、検索されやすい「年俸・経歴」も入れる
  const featured = featuredPlayerFor(player.full_name);
  if (featured) return `${name}の${height}成績・${featured.hideSalary ? "経歴" : "年俸"}${suffix}`;
  return `${name}の${height}成績・スタッツ${suffix}`;
}

/** 説明文用の今季成績(例: 2026-27は5試合で平均5.6得点・4.2リバウンド・1.0アシスト（10月28日時点）。) */
function currentSeasonDescriptionText(current: PlayerCurrentSeasonStats): string {
  const d = deriveStats(current.totals);
  const [, m, day] = current.lastGameDate.split("-").map(Number);
  return `${seasonLabel(current.season)}は${current.totals.gamesPlayed}試合で平均${formatStat(d.ppg)}得点・${formatStat(d.rpg)}リバウンド・${formatStat(d.apg)}アシスト（${m}月${day}日時点）。`;
}

/** meta description。検索結果で切れる前に数字が見えるよう、今季成績を前に置く。チーム・ポジション・身長が無い場合はその部分を省く */
export function playerPageDescription(
  { player, currentTeam }: PlayerPageBase,
  current: PlayerCurrentSeasonStats | null = null,
): string {
  const currentText = current ? currentSeasonDescriptionText(current) : "";
  const featured = featuredPlayerFor(player.full_name);
  if (featured) {
    // 紹介文に身長が入っていない選手は「（身長201cm）」を添える
    const height = player.height_cm && !featured.catchphrase.includes("身長") ? `（身長${player.height_cm}cm）` : "";
    return `${featured.catchphrase}${currentText}${featured.nameJa}${height}の経歴・プレースタイル・主なタイトル${featured.hideSalary ? "" : "・年俸"}、シーズン別成績を日本語で解説。`;
  }
  // 例: 「アデイ・マーラ（サンダー／C／身長218cm）」
  const details = [teamShortLabel(currentTeam), player.position, player.height_cm ? `身長${player.height_cm}cm` : null].filter(Boolean);
  const nameJa = player.full_name_ja ?? player.full_name;
  const head = details.length > 0 ? `${nameJa}（${details.join("／")}）` : nameJa;
  return current
    ? `${head}の${currentText}NBAのシーズン別成績・スタッツ、ドラフト情報、受賞歴を日本語でまとめています。`
    : `${head}のNBAのシーズン別成績・スタッツ、ドラフト情報、受賞歴などのプロフィールを日本語でまとめています。`;
}

/** プロフィールの紹介文(1文)。例: 「ディアンドレ・エイトン（Deandre Ayton）は、ポートランド・トレイルブレイザーズ所属のC。身長213cm、2018年ドラフト1巡目1位。」 */
export function playerIntroSentence({ player, currentTeam }: PlayerPageBase): string {
  const role = roleText(teamLabel(currentTeam), player.position);
  const details = [player.height_cm ? `身長${player.height_cm}cm` : null, draftText(player)].filter(Boolean);
  const name = playerDisplayName(player);
  // 所属・ポジションが無い選手は「{名前}は、身長…、…。」、何も無い選手は「{名前}。」
  const head = role ? `${name}は、${role}。` : details.length > 0 ? `${name}は、` : `${name}。`;
  return details.length === 0 ? head : `${head}${details.join("、")}。`;
}
