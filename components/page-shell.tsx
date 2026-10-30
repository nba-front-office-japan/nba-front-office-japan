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
          {/* 紙の縁をギザギザにするフィルタ(背景の紙だけに掛け、文字には掛けない) */}
          <svg aria-hidden width="0" height="0" className="absolute">
            <filter id="np-rough" x="-2%" y="-2%" width="104%" height="104%">
              <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="7" />
              <feDisplacementMap in="SourceGraphic" scale="12" />
            </filter>
          </svg>
          <div className="mx-auto w-full max-w-6xl flex-1 px-3 py-6 sm:px-8 sm:py-10">
            <div className="np-sheet">
              <div aria-hidden className="np-sheet-under np-sheet-under-2" />
              <div aria-hidden className="np-sheet-under np-sheet-under-1" />
              <div aria-hidden className="np-sheet-face" />
              <div aria-hidden className="np-sheet-curl" />
              <main className="relative w-full px-4 py-8 sm:px-10 sm:py-10">{children}</main>
            </div>
          </div>
        </div>
      ) : (
        main
      )}
    </div>
  );
}
