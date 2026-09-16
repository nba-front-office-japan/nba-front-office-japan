import Link from "next/link";
import type { ReactNode } from "react";

const NAV_ITEMS = [
  { href: "/admin/news", label: "収集ジョブ" },
  { href: "/admin/news/events", label: "イベント" },
  { href: "/admin/news/drafts", label: "記事下書き" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="border-b border-line bg-surface px-4 py-3 sm:px-8">
        <nav className="mx-auto flex max-w-5xl gap-5 text-sm font-bold">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-sm transition-colors hover:text-blue focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      {children}
    </div>
  );
}
