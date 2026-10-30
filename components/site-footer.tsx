"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SITE_NAME, SOCIAL_LINKS } from "@/lib/site";

// 全ページ共通のフッター(管理画面 /admin には出さない)。ヘッダーと同じ紺色でそろえる。
const CONTENT_LINKS = [
  { href: "/news", label: "ニュース" },
  { href: "/games", label: "試合結果" },
  { href: "/standings", label: "順位表" },
  { href: "/teams", label: "チーム" },
  { href: "/players", label: "選手名鑑" },
  { href: "/salary", label: "サラリー" },
  { href: "/guide", label: "NBAガイド" },
];

const SITE_LINKS = [
  { href: "/about", label: "運営者情報" },
  { href: "/contact", label: "お問い合わせ" },
  { href: "/privacy", label: "プライバシーポリシー" },
  { href: "/terms", label: "利用規約" },
];

export function SiteFooter() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;

  return (
    <footer className="bg-navy text-slate-300">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-10 px-4 py-12 sm:px-7 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="col-span-2 md:col-span-1">
          <p className="text-xl text-white" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
            {SITE_NAME}
          </p>
          <p className="mt-3 max-w-sm text-[13px] leading-7">
            NBAの試合結果・スタッツ・年俸・移籍ニュースを日本語で。勝敗の裏側にあるフロントオフィスの意思決定を読むNBAファンサイトです。
          </p>
          {SOCIAL_LINKS.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-3">
              {SOCIAL_LINKS.map((s) => (
                <a
                  key={s.label}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer me"
                  className="inline-flex items-center border border-slate-500 px-4 py-2 text-[13px] font-bold text-white transition-colors hover:border-gold hover:text-gold"
                >
                  {s.label}でフォロー
                </a>
              ))}
            </div>
          )}
        </div>
        <FooterColumn title="コンテンツ" links={CONTENT_LINKS} />
        <FooterColumn title="サイトについて" links={SITE_LINKS} />
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto w-full max-w-6xl px-4 py-5 text-[11px] leading-5 text-slate-400 sm:px-7">
          © {new Date().getFullYear()} {SITE_NAME}. 当サイトはNBA及び各チームとは関係のない非公式のファンサイトです。
        </p>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <p className="text-[11px] font-extrabold tracking-[1.3px] text-gold">{title}</p>
      <ul className="mt-4 space-y-2.5 text-[13px]">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="hover:text-white hover:underline">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
