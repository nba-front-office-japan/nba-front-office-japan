import type { ReactNode } from "react";
import { PageShell } from "@/components/page-shell";

// 運営者情報・お問い合わせ・プライバシーポリシー・利用規約の共通レイアウト。
export function LegalPage({ title, updated, children }: { title: string; updated?: string; children: ReactNode }) {
  return (
    <PageShell>
      <article className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold sm:text-3xl" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
          {title}
        </h1>
        {updated && <p className="mt-2 text-xs text-muted">最終更新日：{updated}</p>}
        <div className="mt-8 space-y-8 text-[15px] leading-8">{children}</div>
      </article>
    </PageShell>
  );
}

export function LegalSection({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 border-l-4 border-gold pl-3 text-lg font-bold">{heading}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
