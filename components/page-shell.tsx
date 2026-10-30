import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";

// newspaper を渡すと、ヘッダーより下を新聞紙風の地色・配色(globals.css の .newspaper)にする(試合結果ページ専用)。値は書体の className。
// teamColor を渡すと、グローバルヘッダーより下の全幅をその色にし、配色を .team-theme に切り替える
// (チームページ専用。色は lib/team-colors.ts の teamThemeBackground() で読みやすさを補正したもの)。
export function PageShell({
  children,
  teamColor = null,
  newspaper,
}: {
  children: ReactNode;
  teamColor?: string | null;
  newspaper?: string;
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
      ) : newspaper !== undefined ? (
        <div className={`newspaper flex flex-1 flex-col ${newspaper}`}>
          <div className="mx-auto w-full max-w-6xl flex-1 px-3 py-6 sm:px-8 sm:py-10">
            <div className="np-sheet">
              <div aria-hidden className="np-sheet-face" />
              <main className="np-sheet-body relative w-full">{children}</main>
            </div>
          </div>
        </div>
      ) : (
        main
      )}
    </div>
  );
}
