import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";

// teamColor を渡すと、グローバルヘッダーより下の全幅をその色にし、配色を .team-theme に切り替える
// (チームページ専用。色は lib/team-colors.ts の teamThemeBackground() で読みやすさを補正したもの)。
export function PageShell({
  children,
  teamColor = null,
}: {
  children: ReactNode;
  teamColor?: string | null;
}) {
  const main = (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-7 sm:py-10">{children}</main>
  );

  return (
    <div className="flex flex-1 flex-col bg-background text-foreground">
      <SiteHeader />
      {teamColor ? (
        <div className="team-theme flex flex-1 flex-col" style={{ backgroundColor: teamColor }}>
          {main}
        </div>
      ) : (
        main
      )}
    </div>
  );
}
