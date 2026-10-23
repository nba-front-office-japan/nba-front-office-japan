import Link from "next/link";
import type { FeaturedPlayerLink } from "@/lib/featured-player-links";

// 人気選手ガイド(/players/featured)の一覧。グループごとに、選手名と一言紹介のカードを並べる。
export function FeaturedPlayerGuide({
  groups,
}: {
  groups: { id: string; title: string; lead: string; players: FeaturedPlayerLink[] }[];
}) {
  return (
    <div className="space-y-10">
      {groups
        .filter((g) => g.players.length > 0)
        .map((group) => (
          <section key={group.id} aria-labelledby={group.id}>
            <div className="mb-1 flex items-baseline gap-2.5">
              <h2 id={group.id} className="text-xl font-semibold tracking-tight">
                {group.title}
              </h2>
              <span className="text-[11px] font-extrabold tracking-wide text-muted">{group.players.length}人</span>
            </div>
            <p className="mb-4 text-sm text-muted">{group.lead}</p>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {group.players.map(({ id, featured }) => (
                <li key={id}>
                  <Link
                    href={`/players/${id}`}
                    className="flex h-full flex-col border border-line border-t-2 border-t-blue bg-surface p-4 hover:border-blue"
                  >
                    <span className="text-[15px] font-bold">{featured.nameJa}</span>
                    <span className="mt-0.5 text-[11px] font-bold tracking-wide text-muted">{featured.name}</span>
                    <span className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-muted">{featured.catchphrase}</span>
                    <span className="mt-auto pt-3 text-xs font-bold text-blue">プロフィールを見る ›</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
    </div>
  );
}
