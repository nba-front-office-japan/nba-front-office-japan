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
import { currentSeasonSentence } from "@/lib/player-summary";

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

// current: 今季の成績(ボックススコアから集計)。出場が無ければ null。あれば「選手名 スタッツ」の検索向けにタイトル・説明文へ入れる
export function playerPageTitle(player: PlayerRow, view: "profile" | "stats", current: PlayerCurrentSeasonStats | null = null): string {
  const name = playerDisplayName(player);
  // 有名選手(lib/featured-players.ts)のProfileは、検索されやすい「成績・年俸・経歴」にする
  // 「{選手名} 身長」で検索されることが多いため、身長が分かる選手はProfileのタイトルに「身長」を入れる
  const height = player.height_cm ? "身長・" : "";
  const featured = featuredPlayerFor(player.full_name);
  if (featured && view === "profile") {
    return `${name}の${height}成績・${featured.hideSalary ? "プロフィール" : "年俸"}・経歴 | NBA Front Office Japan`;
  }
  const season = current ? `（${seasonLabel(current.season)}）` : "";
  return view === "stats"
    ? `${name}のシーズン別成績・スタッツ${current ? `（${seasonLabel(current.season)}含む）` : ""} | NBA Front Office Japan`
    : current
      ? `${name}の${height}成績・スタッツ${season} | NBA Front Office Japan`
      : `${name}の${height}プロフィール・成績 | NBA Front Office Japan`;
}

/** meta description。チーム・ポジション・身長が無い場合はその部分を省く */
export function playerPageDescription(
  { player, currentTeam }: PlayerPageBase,
  current: PlayerCurrentSeasonStats | null = null,
): string {
  const role = roleText(teamLabel(currentTeam), player.position);
  const featured = featuredPlayerFor(player.full_name);
  const currentText = current ? currentSeasonSentence(current) : "";
  if (featured) {
    // 紹介文に身長が入っていない選手は「（身長201cm）」を添える
    const height = player.height_cm && !featured.catchphrase.includes("身長") ? `（身長${player.height_cm}cm）` : "";
    return `${featured.catchphrase}${currentText}${featured.nameJa}${height}の経歴・プレースタイル・主なタイトル${featured.hideSalary ? "" : "・年俸"}、NBAのシーズン別成績を日本語でまとめています。`;
  }
  const parts = [
    role ? `${playerDisplayName(player)}は${role}。` : `${playerDisplayName(player)}。`,
    player.height_cm ? `身長${player.height_cm}cm。` : "",
    currentText,
    "NBAのシーズン別成績・スタッツ、ドラフト情報、受賞歴などのプロフィールを日本語でまとめています。",
  ];
  return parts.join("");
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
