"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  GLOSSARY_LEVEL_PAGES,
  GLOSSARY_SECTIONS,
  glossarySectionPath,
  glossaryTermPath,
  parseGlossaryLevel,
  withGlossaryLevel,
  type GlossaryLevelFilter,
  type GlossarySectionKey,
} from "@/lib/glossary-categories";
import { CategoryMark } from "@/components/glossary-mark";
import type { GlossaryFeaturedByLevel, GlossaryLevelCounts } from "@/lib/glossary-pages";

// NBA用語辞典の難易度(初級・中級・上級)の選択。難易度は「ページ」ではなく、画面の中で切り替える選択。
// 選んだ難易度は URL の ?level=〜 に入れる(戻る・共有・分類ページへの持ち越しのため)。「すべて」は ?level なし。
// ページ自体は静的に作り、選択はブラウザ側で URL を読んで反映する(初回の HTML は「すべて」の状態)。

// URL の ?level= を読む。setLevel は URL も書き換える(履歴は増やさない)
export function useGlossaryLevel(): [GlossaryLevelFilter, (lv: GlossaryLevelFilter) => void] {
  const [level, setLevelState] = useState<GlossaryLevelFilter>("all");
  useEffect(() => {
    const read = () => setLevelState(parseGlossaryLevel(new URLSearchParams(location.search).get("level")));
    read();
    window.addEventListener("popstate", read);
    return () => window.removeEventListener("popstate", read);
  }, []);
  const setLevel = useCallback((lv: GlossaryLevelFilter) => {
    setLevelState(lv);
    const params = new URLSearchParams(location.search);
    if (lv === "all") params.delete("level");
    else params.set("level", lv);
    const q = params.toString();
    history.replaceState(history.state, "", `${location.pathname}${q ? `?${q}` : ""}${location.hash}`);
  }, []);
  return [level, setLevel];
}

const LEVEL_LABEL: Record<GlossaryLevelFilter, string> = { all: "すべて", beginner: "初級", intermediate: "中級", advanced: "上級" };
export const glossaryLevelLabel = (lv: GlossaryLevelFilter) => LEVEL_LABEL[lv];
const total = (c: Record<GlossarySectionKey, number>) => Object.values(c).reduce((a, b) => a + b, 0);

// 難易度の点(初級●○○・中級●●○・上級●●●)
function LevelDots({ n }: { n: number }) {
  return (
    <span aria-hidden className="inline-flex gap-0.5">
      {[0, 1, 2].map((d) => (
        <span key={d} className={`inline-block size-2 bg-current ${d < n ? "" : "opacity-25"}`} />
      ))}
    </span>
  );
}

// 用語集トップの「どこから読む？」(難易度の選択)と「分類から探す」(9分類のカード)。
// 難易度を選ぶと、分類カードの語数と代表的な用語がその難易度の分になり、0語の分類は出さない。
export function GlossaryTopLevels({ counts, featured }: { counts: GlossaryLevelCounts; featured: GlossaryFeaturedByLevel }) {
  const [level, setLevel] = useGlossaryLevel();
  const sections = GLOSSARY_SECTIONS.filter((c) => counts[level][c.key] > 0);

  return (
    <>
      <section aria-labelledby="glossary-levels-title" className="mb-10">
        <h2 id="glossary-levels-title" className="mb-3 flex flex-wrap items-baseline gap-x-3 border-b-4 border-foreground pb-2 text-xl font-black tracking-tight sm:text-2xl">
          どこから読む？
          <span className="text-sm font-semibold text-muted">難易度を選ぶと、下の分類がその難易度の用語だけになります</span>
        </h2>
        <ul className="grid gap-2.5 sm:grid-cols-3">
          {GLOSSARY_LEVEL_PAGES.map((l, i) => {
            const on = level === l.key;
            return (
              <li key={l.key}>
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => setLevel(on ? "all" : l.key)}
                  className={`group flex h-full w-full flex-col border px-4 py-4 text-left ${
                    on ? "border-navy bg-navy text-white" : "border-foreground bg-surface hover:bg-background"
                  }`}
                >
                  <span className="flex w-full items-center gap-2">
                    <LevelDots n={i + 1} />
                    <span className="text-lg font-black group-hover:underline">{l.label}</span>
                    <span className={`text-xs font-semibold tabular-nums ${on ? "text-white/70" : "text-muted"}`}>{total(counts[l.key])}語</span>
                    <span
                      aria-hidden
                      className={`ml-auto inline-flex size-6 items-center justify-center border text-sm font-black ${
                        on ? "border-gold bg-gold text-navy" : "border-line text-transparent"
                      }`}
                    >
                      ✓
                    </span>
                  </span>
                  <span className={`mt-1.5 text-sm leading-6 ${on ? "text-white/80" : "text-muted"}`}>{l.lead}</span>
                </button>
              </li>
            );
          })}
        </ul>
        <p className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <span className="font-bold">
            表示中：<span className={level === "all" ? "" : "text-blue"}>{glossaryLevelLabel(level)}</span>
            <span className="ml-1 font-semibold text-muted tabular-nums">（{total(counts[level])}語）</span>
          </span>
          <button
            type="button"
            onClick={() => setLevel("all")}
            disabled={level === "all"}
            className="inline-flex min-h-9 items-center border border-foreground bg-surface px-3 text-xs font-bold hover:bg-navy hover:text-white disabled:cursor-default disabled:border-line disabled:text-muted disabled:hover:bg-surface"
          >
            すべての用語に戻す（{total(counts.all)}語）
          </button>
        </p>
      </section>

      <section aria-labelledby="glossary-categories-title">
        <h2 id="glossary-categories-title" className="mb-4 border-b-4 border-foreground pb-2 text-xl font-black tracking-tight sm:text-2xl">
          分類から探す
          <span className="ml-2 text-sm font-semibold text-muted tabular-nums">
            {level === "all" ? `${sections.length}分類` : `${glossaryLevelLabel(level)}の用語がある${sections.length}分類`}
          </span>
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map((c) => (
            <li key={c.key} className="flex flex-col border border-line border-t-4 bg-surface" style={{ borderTopColor: c.color }}>
              <Link href={withGlossaryLevel(glossarySectionPath(c.key), level)} className="group flex items-center gap-2.5 px-4 pb-1 pt-3.5">
                <CategoryMark c={c} size="md" />
                <span className="min-w-0 flex-1">
                  <span className="block text-[17px] font-bold leading-snug [word-break:auto-phrase] group-hover:text-blue">{c.label}</span>
                  <span className="text-xs font-semibold text-muted tabular-nums">
                    {level !== "all" && `${glossaryLevelLabel(level)} `}
                    {counts[level][c.key]}語
                  </span>
                </span>
                <span aria-hidden className="text-lg font-black text-muted group-hover:text-blue">
                  →
                </span>
              </Link>
              <p className="px-4 text-[13px] leading-6 text-muted">{c.lead}</p>
              <ul className="mt-auto flex flex-wrap gap-1.5 px-4 pb-4 pt-3" aria-label={`${c.label}の代表的な用語`}>
                {featured[level][c.key].map((t) => (
                  <li key={t.id}>
                    <Link
                      href={withGlossaryLevel(glossaryTermPath(t.id, c.key), level)}
                      className="inline-flex items-center border border-line bg-background px-2 py-1 text-xs font-bold hover:border-foreground hover:text-blue"
                    >
                      {t.term}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

// 分類ページの「前の分類・次の分類」。難易度を選んでいるときは、その難易度の用語がある分類だけを順にたどる
export function GlossarySectionNeighbors({ current, counts }: { current: GlossarySectionKey; counts: GlossaryLevelCounts }) {
  const [level] = useGlossaryLevel();
  const list = GLOSSARY_SECTIONS.filter((c) => c.key === current || counts[level][c.key] > 0);
  const i = list.findIndex((c) => c.key === current);
  const prev = list[i - 1];
  const next = list[i + 1];
  return (
    <nav aria-label="前後の分類" className="mt-10 grid max-w-4xl gap-2.5 sm:grid-cols-2">
      {prev ? (
        <Link
          href={withGlossaryLevel(glossarySectionPath(prev.key), level)}
          className="group flex items-center gap-2.5 border border-line bg-surface px-4 py-3 hover:border-foreground"
        >
          <span aria-hidden className="text-muted">←</span>
          <CategoryMark c={prev} />
          <span className="min-w-0">
            <span className="block text-[11px] font-bold text-muted">前の分類</span>
            <span className="font-bold group-hover:text-blue">{prev.label}</span>
          </span>
        </Link>
      ) : (
        <span className="hidden sm:block" />
      )}
      {next && (
        <Link
          href={withGlossaryLevel(glossarySectionPath(next.key), level)}
          className="group flex items-center justify-end gap-2.5 border border-line bg-surface px-4 py-3 text-right hover:border-foreground"
        >
          <span className="min-w-0">
            <span className="block text-[11px] font-bold text-muted">次の分類</span>
            <span className="font-bold group-hover:text-blue">{next.label}</span>
          </span>
          <CategoryMark c={next} />
          <span aria-hidden className="text-muted">→</span>
        </Link>
      )}
    </nav>
  );
}
