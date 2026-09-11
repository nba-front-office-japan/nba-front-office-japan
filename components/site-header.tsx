"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/teams", label: "Teams" },
  { href: "/players", label: "Players" },
  { href: "/stats", label: "Stats" },
  { href: "/contracts", label: "Contracts" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="border-b border-black/[.08] dark:border-white/[.145]">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          NBA Front Office Japan
        </Link>
        <nav className="flex flex-wrap gap-x-5 gap-y-1 text-sm font-medium">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  isActive
                    ? "text-accent"
                    : "text-zinc-600 transition-colors hover:text-foreground dark:text-zinc-400"
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
