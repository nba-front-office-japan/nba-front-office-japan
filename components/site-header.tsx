"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "HOME" },
  { href: "/news", label: "NEWS" },
  { href: "/teams", label: "TEAMS" },
  { href: "/players", label: "PLAYERS" },
  { href: "/stats", label: "STATS LAB" },
  { href: "/contracts", label: "CONTRACTS" },
  { href: "/premium", label: "PREMIUM" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <>
      <div className="h-[5px] bg-gold" />
      <header className="bg-navy text-white">
        <div className="mx-auto w-full max-w-6xl px-4 pt-5 sm:px-7">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <Link
              href="/"
              className="font-serif text-xl tracking-tight sm:text-[25px]"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              NBA Front Office Japan
            </Link>
            <span className="text-[10px] tracking-[1.6px] text-slate-400">
              THE BUSINESS OF BASKETBALL
            </span>
          </div>
          <nav className="mt-6 flex gap-6 overflow-x-auto text-[13px] font-bold sm:gap-7">
            {navItems.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`whitespace-nowrap border-b-[3px] pb-[15px] transition-colors ${
                    isActive
                      ? "border-gold text-white"
                      : "border-transparent text-slate-300 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
    </>
  );
}
