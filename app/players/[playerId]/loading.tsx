import { PageShell } from "@/components/page-shell";

// 選手ページの読み込み中に出す仮の画面。
// 選手ページはアクセスのたびにDBから作る(動的ページ)ため、これが無いと、リンクを押してから
// 表示が切り替わるまで画面が何も変わらず「押せていない」ように見える。
// これを置くと、押した直後にヘッダーと枠が出て、中身はデータが届きしだい差し替わる。
// (Next.js はこのファイルがある動的ページを、リンクが画面に入った時点で途中まで先読みする)
export default function PlayerPageLoading() {
  return (
    <PageShell>
      <div aria-busy="true" aria-live="polite">
        <span className="sr-only">選手ページを読み込み中…</span>
        <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">
          Player Database
        </p>
        <div className="animate-pulse">
          <div className="mt-2 h-9 w-64 max-w-full rounded bg-line" />
          <div className="mt-3 h-4 w-40 rounded bg-line" />
          <div className="mb-6 mt-2 h-4 w-56 max-w-full rounded bg-line" />
          <div className="mb-4 flex gap-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-9 w-20 rounded-lg bg-line" />
            ))}
          </div>
          <div className="mt-6 border border-line bg-surface p-5 sm:p-6">
            <div className="h-5 w-48 rounded bg-line" />
            <div className="mt-4 grid grid-cols-3 gap-x-4 gap-y-3 sm:grid-cols-6">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i}>
                  <div className="h-3 w-12 rounded bg-line" />
                  <div className="mt-2 h-4 w-10 rounded bg-line" />
                </div>
              ))}
            </div>
          </div>
          <div className="mt-8 border border-line bg-surface p-5 sm:p-6">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="mt-3 h-4 w-full rounded bg-line first:mt-0" />
            ))}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
