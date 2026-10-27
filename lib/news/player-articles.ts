// 選手ページとNEWS記事を自動でつなぐ。記事のタイトル・本文に選手の日本語名(players.full_name_ja)がそのまま書かれていれば関連とみなす。
// ・選手ページ(/players/[playerId]) … 「関連ニュース」にその選手の名前が出てくる公開記事を新しい順に出す
// ・記事ページ(/news/[articleId]) … 「この記事の選手」に記事に名前が出てくる選手の選手ページへのリンクを出す
// 記事を公開すれば、管理画面で何も設定しなくても両方に出る。
// 公開記事(status='published')だけを対象にする(下書きは出さない)。
import "server-only";
import type { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { fetchAllRows } from "@/lib/supabase/fetch-all";

type SupabaseAdmin = ReturnType<typeof createAdminSupabaseClient>;

// 短い名前(例: 「ジョーンズ」だけの登録)は別人の記事にも一致してしまうため使わない
const MIN_NAME_LENGTH = 4;

function normalize(text: string): string {
  return text.normalize("NFKC");
}

function usableName(nameJa: string | null): string | null {
  if (!nameJa) return null;
  const name = normalize(nameJa).trim();
  return name.length >= MIN_NAME_LENGTH ? name : null;
}

export type PlayerRelatedArticle = { id: string; headlineJa: string; publishedAt: string | null };

/** 選手の日本語名が出てくる公開記事(新しい順、最大 limit 件) */
export async function fetchPlayerRelatedArticles(
  supabase: SupabaseAdmin,
  nameJa: string | null,
  limit = 5,
): Promise<PlayerRelatedArticle[]> {
  const name = usableName(nameJa);
  if (!name) return [];
  const { data } = await supabase
    .from("article_drafts")
    .select("id, headline_ja, body_markdown, published_at")
    .eq("status", "published")
    .order("published_at", { ascending: false });
  return (data ?? [])
    .filter((a) => normalize(`${a.headline_ja}\n${a.body_markdown ?? ""}`).includes(name))
    .slice(0, limit)
    .map((a) => ({ id: a.id, headlineJa: a.headline_ja, publishedAt: a.published_at }));
}

export type ArticlePlayer = { id: string; nameJa: string };

/** 記事のタイトル・本文に日本語名が出てくる選手(本文に先に出てくる順、最大 limit 人) */
export async function fetchArticlePlayers(
  supabase: SupabaseAdmin,
  text: string,
  limit = 10,
): Promise<ArticlePlayer[]> {
  const body = normalize(text);
  const { data: players } = await fetchAllRows<{ id: string; full_name_ja: string | null; is_active: boolean }>((from, to) =>
    supabase
      .from("players")
      .select("id, full_name_ja, is_active")
      .not("full_name_ja", "is", null)
      .order("id")
      .range(from, to),
  );

  // 同じ日本語名の選手が複数いる場合(同名の引退選手など)は現役の選手を優先する
  const byName = new Map<string, { id: string; is_active: boolean }>();
  for (const p of players) {
    const name = usableName(p.full_name_ja);
    if (!name || !body.includes(name)) continue;
    const existing = byName.get(name);
    if (!existing || (!existing.is_active && p.is_active)) byName.set(name, p);
  }
  // 別の選手の名前の一部として一致しただけの名前は除く(例: 「〇〇・ジュニア」の記事に「〇〇」も出す、を避ける)
  const names = [...byName.keys()];
  return names
    .filter((name) => !names.some((other) => other !== name && other.includes(name)))
    .sort((a, b) => body.indexOf(a) - body.indexOf(b))
    .slice(0, limit)
    .map((name) => ({ id: byName.get(name)!.id, nameJa: name }));
}
