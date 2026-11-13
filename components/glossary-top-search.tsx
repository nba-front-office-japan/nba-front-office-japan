"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  GLOSSARY_LEGACY_CATEGORY_SECTION,
  glossarySectionPath,
  glossaryTermPath,
  type GlossaryCategory,
  type GlossarySectionKey,
} from "@/lib/glossary-categories";
import { CategoryMark, GLOSSARY_SECTION_BY_KEY } from "@/components/glossary-mark";

// 用語集トップの検索窓。検索の仕組みは前の用語辞典と同じ(用語名・英語名・ひとことで言うと に含まれるか)。
// 結果の用語を押すと、その分類ページでカードが開いた状態に着地する。
// あわせて、前の URL(/guide/glossary#term-用語ID、#用語ID、#cat-前の分類、#group-slang)で開かれたときに、分類ページへ振り替える。
export type GlossarySearchItem = { id: string; term: string; en: string; short: string; section: GlossarySectionKey };

const LIMIT = 30;

function termIdFromHash(hash: string, ids: Set<string>): string {
  let raw = hash.replace(/^#/, "");
  try {
    raw = decodeURIComponent(raw);
  } catch {
    return "";
  }
  if (raw.startsWith("term-") && ids.has(raw.slice(5))) return raw.slice(5);
  return ids.has(raw) ? raw : "";
}

export function GlossaryTopSearch({ items }: { items: GlossarySearchItem[] }) {
  const [query, setQuery] = useState("");

  // 前の URL からの振り替え
  useEffect(() => {
    const byId = new Map(items.map((t) => [t.id, t]));
    const go = () => {
      const id = termIdFromHash(location.hash, new Set(byId.keys()));
      if (id) {
        location.replace(glossaryTermPath(id, byId.get(id)!.section));
        return;
      }
      const cat = location.hash.match(/^#cat-(.+)$/)?.[1];
      const legacy = cat ? GLOSSARY_LEGACY_CATEGORY_SECTION[cat as GlossaryCategory] : undefined;
      if (legacy) location.replace(glossarySectionPath(legacy));
      else if (location.hash === "#group-slang") location.replace(glossarySectionPath("culture"));
    };
    go();
    window.addEventListener("hashchange", go);
    return () => window.removeEventListener("hashchange", go);
  }, [items]);

  const q = query.trim().toLowerCase();
  const hits = q ? items.filter((t) => t.term.toLowerCase().includes(q) || t.en.toLowerCase().includes(q) || t.short.toLowerCase().includes(q)) : [];

  return (
    <div>
      <label className="flex h-12 items-center gap-2.5 border-2 border-foreground bg-surface px-3.5 focus-within:border-blue">
        <svg aria-hidden viewBox="0 0 20 20" className="size-5 shrink-0 text-muted" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="8.5" cy="8.5" r="6" />
          <path d="M13 13l5 5" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="用語を探す（例：トラベリング、TS%、シェフ・カリー）"
          aria-label="用語を検索"
          className="w-full min-w-0 bg-transparent text-base outline-none"
        />
      </label>
      {q && (
        <div className="mt-2 border border-line bg-surface" aria-live="polite">
          <p className="border-b border-line px-3.5 py-2 text-xs font-bold text-muted tabular-nums">
            {hits.length === 0 ? `「${query.trim()}」に当てはまる用語はありません。` : `${hits.length}語見つかりました${hits.length > LIMIT ? `（上位${LIMIT}語を表示）` : ""}`}
          </p>
          {hits.length > 0 && (
            <ul className="divide-y divide-line">
              {hits.slice(0, LIMIT).map((t) => {
                const c = GLOSSARY_SECTION_BY_KEY[t.section];
                return (
                  <li key={t.id}>
                    <Link href={glossaryTermPath(t.id, t.section)} className="group flex items-start gap-2.5 px-3.5 py-2.5 hover:bg-background">
                      <CategoryMark c={c} />
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-baseline gap-x-2">
                          <span className="font-bold group-hover:text-blue">{t.term}</span>
                          <span lang="en" className="text-[11px] font-semibold uppercase tracking-[1px] text-muted">
                            {t.en}
                          </span>
                          <span className="text-[11px] font-bold text-muted">{c.label}</span>
                        </span>
                        <span className="block text-sm leading-6 text-foreground/80 [word-break:auto-phrase]">{t.short}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
