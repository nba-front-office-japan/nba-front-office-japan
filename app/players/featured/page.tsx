import type { Metadata } from "next";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/page-shell";
import { FeaturedPlayerGuide } from "@/components/featured-player-guide";
import { FEATURED_PLAYERS } from "@/lib/featured-players";
import { fetchFeaturedPlayerLinks } from "@/lib/featured-player-links";

// 選手IDはDBから引くので、選手名鑑(/players)と同じくリクエストごとに表示する
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "NBA人気選手ガイド｜日本人選手・スター選手のプロフィール | NBA Front Office Japan",
  description:
    "レブロン・カリー・ヨキッチ・ウェンバンヤマなどのスター選手から注目の若手、八村塁ら日本人選手まで、人気のNBA選手の経歴・プレースタイル・年俸を日本語で紹介します。",
  alternates: { canonical: "/players/featured" },
};

// 人気選手ガイド。選手名鑑(/players)から1行のリンクで案内する(選手名鑑の上部には並べない)。
// 並びはトップスター→注目の選手→日本人選手。NBAファン向けなのでスターを先に出す。
// トップスターは第1弾の4人目以降(モラントを除きエンビードを加える)、日本人選手は第1弾の先頭、残りが注目の選手。
// 渡邊雄太はNBAの成績データが無い(B.League所属)ので、ガイドには載せない(選手ページは残す)。
const EXCLUDED = ["Yuta Watanabe"];

export default async function FeaturedPlayersPage() {
  const supabase = createServerSupabaseClient();
  const links = (await fetchFeaturedPlayerLinks(supabase)).filter((l) => !EXCLUDED.includes(l.featured.name));
  const japanese = FEATURED_PLAYERS.slice(0, 3);
  const starNames = [...FEATURED_PLAYERS.slice(3).map((p) => p.name).filter((n) => n !== "Ja Morant"), "Joel Embiid"];
  const stars = starNames.flatMap((name) => links.filter((l) => l.featured.name === name));
  const others = links.filter((l) => !japanese.includes(l.featured) && !starNames.includes(l.featured.name));
  // モラントは注目の選手の3番目(エンビードがいた位置)に置く
  const morant = others.findIndex((l) => l.featured.name === "Ja Morant");
  if (morant >= 0) others.splice(2, 0, ...others.splice(morant, 1));

  return (
    <PageShell>
      <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">Featured Players</p>
      <h1 className="mb-2 text-[28px] font-semibold leading-tight tracking-tight sm:text-[36px]">NBA人気選手ガイド</h1>
      <p className="mb-8 text-[15px]">
        人気のNBA選手{links.length}人を、経歴・プレースタイル・年俸つきで日本語で紹介します。全選手は
        <Link href="/players" className="font-bold text-blue hover:underline">
          選手名鑑
        </Link>
        からチーム別に探せます。
      </p>
      <FeaturedPlayerGuide
        groups={[
          { id: "stars", title: "トップスター", lead: "MVP経験者やリーグの顔となるスーパースター。", players: stars },
          { id: "more", title: "注目の選手", lead: "オールスター選手や今後が楽しみな若手など。", players: others },
          { id: "japanese", title: "日本人選手", lead: "NBAに挑戦する日本人選手。", players: links.filter((l) => japanese.includes(l.featured)) },
        ]}
      />
    </PageShell>
  );
}
