"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// 管理画面の上部ナビゲーション。縦にスクロールしても画面上部に固定し(position: fixed・高さ 3rem)、
// 今いる画面のリンクを強調する。スマホで項目が入りきらない場合は、ナビの部分だけを横にスクロールできる。

const NAV_ITEMS = [
  { href: "/admin/news", label: "収集ジョブ" },
  { href: "/admin/news/events", label: "イベント" },
  { href: "/admin/news/drafts", label: "記事下書き" },
  { href: "/admin/games", label: "試合データ" },
  { href: "/admin/awards", label: "表彰データ" },
  { href: "/admin/announcements", label: "お知らせ" },
];

/** 今いる画面に当たる項目(詳細・編集画面も含む。/admin/news と /admin/news/drafts のように重なる場合は長いほう) */
function activeHref(pathname: string): string | null {
  const matches = NAV_ITEMS.filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
  return matches.sort((a, b) => b.href.length - a.href.length)[0]?.href ?? null;
}

export function AdminNav() {
  const active = activeHref(usePathname());
  return (
    <>
      {/* 親要素の大きさや overflow に左右されないよう fixed で固定し、同じ高さの空きを置いて本文が隠れないようにする */}
      <div aria-hidden className="h-12" />
      <div className="fixed inset-x-0 top-0 z-40 h-12 border-b border-line bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
      <nav aria-label="管理画面" className="mx-auto flex h-full max-w-5xl items-stretch gap-1 overflow-x-auto px-4 text-sm font-bold sm:px-8">
        {NAV_ITEMS.map((item) => {
          const current = item.href === active;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={current ? "page" : undefined}
              className={`flex shrink-0 items-center whitespace-nowrap border-b-2 px-2.5 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-blue ${
                current ? "border-blue text-blue" : "border-transparent hover:text-blue"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      </div>
    </>
  );
}
