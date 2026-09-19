import { PageShell } from "@/components/page-shell";
import { DraftBoard } from "@/components/draft-board";
import { DRAFT_2026_PICKS } from "@/lib/draft/draft-2026-picks";

export default function DraftPage() {
  return (
    <PageShell>
      <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">
        Draft Database · 2026
      </p>
      <h1 className="mb-2 text-[36px] font-semibold tracking-tight">2026 NBA Draft</h1>
      <p className="mb-7 text-sm text-muted">
        1巡目・2巡目の指名順一覧です。トレード対象ピックは指名先・トレード情報として表示しています。
      </p>
      <DraftBoard picks={DRAFT_2026_PICKS} />
    </PageShell>
  );
}
