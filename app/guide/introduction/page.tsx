import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { BackToGuide, HEADING_WRAP } from "@/components/guide-article";
import { INTRODUCTION_SECTIONS, type IntroBlock, type IntroRun } from "@/lib/guide/introduction";

export const metadata: Metadata = {
  title: "NBAを試合結果だけで終わらせない | NBAガイド | NBA Front Office Japan",
  description:
    "NBAは、試合だけ見ていては半分しか分からない。契約・ドラフト・トレード・オーナー・放映権・戦力均衡まで、NBA Front Office JapanがNBAをもう一段深く見る理由を紹介する、GUIDEの導入ページです。",
};

// 本文は運営者が作成した文書「はじめに」をそのまま掲載している(lib/guide/introduction.ts)。

function Runs({ runs }: { runs: IntroRun[] }) {
  return (
    <>
      {runs.map((r, i) =>
        r.bold ? (
          <strong key={i} className="font-bold text-foreground">
            {r.text}
          </strong>
        ) : (
          <span key={i}>{r.text}</span>
        )
      )}
    </>
  );
}

function Block({ block }: { block: IntroBlock }) {
  if (block.kind === "h3") {
    return <h3 className={`pt-3 text-lg font-bold ${HEADING_WRAP}`}>{block.text}</h3>;
  }
  if (block.kind === "list") {
    return (
      <ul className="space-y-1.5 border-l-4 border-line bg-[#f6f9ff] px-4 py-3 dark:bg-white/[.04]">
        {block.items.map((item, i) => (
          <li key={i} className="pl-[1em] -indent-[1em] text-pretty">
            ・<Runs runs={item} />
          </li>
        ))}
      </ul>
    );
  }
  return (
    <p className="text-pretty">
      <Runs runs={block.runs} />
    </p>
  );
}

export default function GuideIntroductionPage() {
  const [lead, ...sections] = INTRODUCTION_SECTIONS;

  return (
    <PageShell>
      <nav aria-label="パンくずリスト" className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
        <Link href="/guide" className="font-semibold text-blue hover:underline">
          NBAガイド
        </Link>
        <span aria-hidden>›</span>
        <span className="font-semibold text-foreground">はじめに</span>
      </nav>
      <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">Introduction</p>
      <h1 className={`mb-6 text-[28px] font-semibold leading-tight tracking-tight sm:text-[38px] ${HEADING_WRAP}`}>
        NBAを試合結果だけで終わらせない
      </h1>

      <div className="mx-auto max-w-3xl space-y-8">
        {/* 冒頭(元の文書の導入部分) */}
        <section className="border-l-4 border-gold bg-navy p-6 text-white sm:p-8">
          <h2 className={`mb-4 text-xl font-semibold sm:text-2xl ${HEADING_WRAP}`}>{lead.title}</h2>
          <div className="space-y-2 text-[15px] leading-8 text-slate-200">
            {lead.blocks.map((block, i) => (
              <Block key={i} block={block} />
            ))}
          </div>
        </section>

        {/* 目次 */}
        <nav aria-label="目次" className="border border-line bg-surface p-5">
          <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">Contents</p>
          <ol className="list-decimal space-y-1 pl-5 text-sm leading-7">
            {sections.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-blue hover:underline">
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {sections.map((s) => (
          <section key={s.id} id={s.id} className="scroll-mt-6 border-t border-line pt-6">
            <h2 className={`mb-4 text-xl font-semibold tracking-tight sm:text-2xl ${HEADING_WRAP}`}>{s.title}</h2>
            <div className="space-y-3 text-[15px] leading-8 text-foreground/90">
              {s.blocks.map((block, i) => (
                <Block key={i} block={block} />
              ))}
            </div>
          </section>
        ))}

      </div>

      <BackToGuide />
    </PageShell>
  );
}
