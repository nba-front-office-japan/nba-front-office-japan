import type { ReactNode } from "react";
import Link from "next/link";
import {
  OFFICIAL_SOURCES,
  SYSTEM_LEVELS_2026_27,
  SYSTEM_LEVELS_SOURCE_NOTE,
  type OfficialSource,
  type SystemLevel,
} from "@/lib/guide-official";

// NBAガイドの詳細ページ(/guide/*)で共通に使う部品。

// 見出しの折り返し: 文節の途中で切らず(word-break: auto-phrase)、行の長さをそろえて
// 1文字だけの行ができないようにする(text-wrap: balance)。
export const HEADING_WRAP = "text-balance [word-break:auto-phrase]";

// 「NBAガイド › カテゴリー › ページ名」の現在地表示と、カテゴリー・ページ名のラベル
export function GuideHeader({ category, current }: { category: string; current: string }) {
  return (
    <>
      <nav aria-label="パンくずリスト" className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
        <Link href="/guide" className="font-semibold text-blue hover:underline">
          NBAガイド
        </Link>
        <span aria-hidden>›</span>
        <span>{category}</span>
        <span aria-hidden>›</span>
        <span className="font-semibold text-foreground">{current}</span>
      </nav>
      <div className="mb-3 flex flex-wrap gap-2">
        <span className="inline-block bg-[#eaf1ff] px-1.5 py-1 text-[11px] font-extrabold text-[#2457b7]">{category}</span>
        <span className="inline-block border border-line px-1.5 py-1 text-[11px] font-extrabold text-muted">{current}</span>
      </div>
    </>
  );
}

// ページ見出し。狭い画面では「NBA○○」と「とは？」の間で改行する。
// 「NBAラグジュアリータックス」のように画面幅より長い場合だけ、その中でも折り返す(max-w-full)。
// 「NBAトレードの基本」のように「とは？」を付けない見出しは suffix="" を指定する。
export function GuideTitle({ subject, suffix = "とは？" }: { subject: string; suffix?: string }) {
  return (
    <h1 className={`mb-3 text-[26px] font-semibold leading-tight tracking-tight sm:text-[36px] ${HEADING_WRAP}`}>
      <span className="inline-block max-w-full">{subject}</span>
      {suffix && <span className="inline-block">{suffix}</span>}
    </h1>
  );
}

export function SummarySection({ items }: { items: string[] }) {
  return (
    <section className="border-l-4 border-gold bg-navy p-5 text-white sm:p-7">
      <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[1.3px] text-[#84b0ff]">Summary</p>
      <h2 className="mb-3 text-xl font-semibold">まず結論</h2>
      <ul className="space-y-2 text-sm leading-7 text-slate-200">
        {items.map((item) => (
          <li key={item}>・{item}</li>
        ))}
      </ul>
    </section>
  );
}

export function Section({ kicker, title, children }: { kicker: string; title: ReactNode; children: ReactNode }) {
  return (
    <section className="border border-line bg-surface p-5 sm:p-7">
      <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">{kicker}</p>
      <h2 className={`mb-4 text-xl font-semibold tracking-tight ${HEADING_WRAP}`}>{title}</h2>
      <div className="space-y-3 text-sm leading-7">{children}</div>
    </section>
  );
}

export function Bullets({ items }: { items: ReactNode[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2">
          <span aria-hidden className="mt-[11px] h-1.5 w-1.5 flex-none bg-gold" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

// 2026-27シーズンの基準額。PCは表、スマホは縦並び。highlight の行だけ強調する。
export function SystemLevelsTable({ highlight }: { highlight?: SystemLevel["key"] | SystemLevel["key"][] }) {
  const highlighted = new Set(Array.isArray(highlight) ? highlight : highlight ? [highlight] : []);
  return (
    <div className="pt-2">
      <h3 className="mb-2 text-sm font-bold">2026-27シーズンの基準額</h3>
      <div className="hidden border border-line sm:block">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-foreground text-left text-[11px] font-extrabold tracking-[0.6px] text-muted">
              <th scope="col" className="px-4 py-2.5">項目</th>
              <th scope="col" className="px-4 py-2.5 text-right">金額（公式発表）</th>
              <th scope="col" className="px-4 py-2.5 text-right">日本語表記</th>
            </tr>
          </thead>
          <tbody>
            {SYSTEM_LEVELS_2026_27.map((level) => (
              <tr
                key={level.label}
                className={`border-b border-line last:border-b-0 ${highlighted.has(level.key) ? "bg-[#fff6e0] dark:bg-white/[.06]" : ""}`}
              >
                <th scope="row" className="px-4 py-3 text-left align-top font-bold">
                  {level.label}
                  <span className="mt-0.5 block text-xs font-normal text-muted">{level.note}</span>
                </th>
                <td className="whitespace-nowrap px-4 py-3 text-right align-top font-bold">{level.usd}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right align-top text-muted">{level.ja}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <dl className="border border-line sm:hidden">
        {SYSTEM_LEVELS_2026_27.map((level) => (
          <div
            key={level.label}
            className={`border-b border-line px-4 py-3 last:border-b-0 ${highlighted.has(level.key) ? "bg-[#fff6e0] dark:bg-white/[.06]" : ""}`}
          >
            <dt className="font-bold">{level.label}</dt>
            <dd className="text-xs text-muted">{level.note}</dd>
            <dd className="mt-1 font-bold">
              {level.usd}
              <span className="ml-2 text-xs font-normal text-muted">{level.ja}</span>
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-2 text-xs leading-6 text-muted">{SYSTEM_LEVELS_SOURCE_NOTE}</p>
    </div>
  );
}

// 基準額の段階(サラリーキャップ → タックスライン → 1st Apron → 2nd Apron)
export function LevelLadder({ steps, highlight }: { steps: [string, string][]; highlight?: string | string[] }) {
  const highlighted = new Set(Array.isArray(highlight) ? highlight : highlight ? [highlight] : []);
  return (
    <ol className="space-y-2">
      {steps.map(([name, text], i) => (
        <li
          key={name}
          className={`flex items-start gap-3 border px-3 py-2.5 ${highlighted.has(name) ? "border-gold bg-[#fff6e0] dark:bg-white/[.06]" : "border-line"}`}
        >
          <span className="grid h-6 w-6 flex-none place-items-center bg-navy text-xs font-bold text-white">{i + 1}</span>
          <span>
            <b>{name}</b>
            <span className="block text-muted sm:inline sm:before:content-['：']">{text}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

// 関連用語。href がある用語だけ、作成済みの詳細ガイドへリンクする。
export function GlossarySection({ terms }: { terms: { term: string; description: string; href?: string }[] }) {
  const hasUnlinked = terms.some((t) => !t.href);
  return (
    <Section kicker="Glossary" title="関連用語">
      <dl className="divide-y divide-line border-y border-line">
        {terms.map((t) => (
          <div key={t.term} className="py-3 sm:grid sm:grid-cols-[290px_1fr] sm:gap-4">
            <dt className="font-bold [word-break:auto-phrase]">
              {t.href ? (
                <Link href={t.href} className="text-blue underline underline-offset-4 hover:no-underline">
                  {t.term}
                </Link>
              ) : (
                t.term
              )}
            </dt>
            <dd className="text-muted">{t.description}</dd>
          </div>
        ))}
      </dl>
      {hasUnlinked && (
        <p className="text-xs text-muted">
          {terms.some((t) => t.href) ? "リンクのない用語の詳しいガイドは準備中です。" : "各用語の詳しいガイドは準備中です。"}
        </p>
      )}
    </Section>
  );
}

// 公式一次資料。ページごとに確認に使った資料が違う場合は sources で指定する。
export function OfficialSourcesSection({ sources = OFFICIAL_SOURCES }: { sources?: OfficialSource[] }) {
  return (
    <Section kicker="Official sources" title="公式一次資料">
      <ul className="divide-y divide-line border-y border-line">
        {sources.map((s) => (
          <li key={s.href} className="py-3">
            <a href={s.href} target="_blank" rel="noreferrer noopener" className="break-words font-semibold text-blue hover:underline">
              {s.title} ↗
            </a>
            <p className="mt-0.5 text-xs text-muted">
              <span className="whitespace-nowrap">{s.publisher}</span> ・{" "}
              <span className="whitespace-nowrap">{s.date}</span>
            </p>
            <p className="text-xs text-muted">{s.note}</p>
          </li>
        ))}
      </ul>
      <p className="text-xs leading-6 text-muted">
        このページは上記の公式資料をもとにした当サイト独自の解説です。協定の条文を転載・翻訳したものではありません。
      </p>
    </Section>
  );
}

// 別の詳細ガイドへの案内(作成済みのページへだけ使う)
export function RelatedGuideLink({ href, label }: { href: string; label: string }) {
  return (
    <p className="border-l-4 border-blue bg-[#eaf1ff] px-4 py-3 text-sm dark:bg-white/[.06]">
      関連ガイド：
      <Link href={href} className="font-bold text-blue underline underline-offset-4 hover:no-underline">
        {label}
      </Link>
    </p>
  );
}

export function BackToGuide() {
  return (
    <Link href="/guide" className="mt-8 inline-block text-sm font-extrabold text-blue">
      ← NBAガイド一覧に戻る
    </Link>
  );
}
