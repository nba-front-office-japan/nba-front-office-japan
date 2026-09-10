import Link from "next/link";

const navItems = [
  { href: "/teams", label: "Teams" },
  { href: "/players", label: "Players" },
  { href: "/stats", label: "Stats" },
  { href: "/contracts", label: "Contracts" },
];

export function SiteHeader() {
  return (
    <header className="border-b border-black/[.08] dark:border-white/[.145]">
      <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          NBA Front Office Japan
        </Link>
        <nav className="flex gap-6 text-sm font-medium">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-zinc-600 transition-colors hover:text-foreground dark:text-zinc-400"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
