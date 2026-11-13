"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import Link from "next/link";
import {
  GLOSSARY_EXTRA_GUIDE_LINKS,
  GLOSSARY_SECTIONS,
  GLOSSARY_TOP_PATH,
  glossarySectionPath,
  glossaryTermHash,
  glossaryTermPath,
  type GlossarySectionKey,
  type GlossaryTerm,
} from "@/lib/glossary-categories";
import { CategoryMark, GLOSSARY_SECTION_BY_KEY as SECTION_BY_KEY } from "@/components/glossary-mark";
import { GlossaryFigureView, PositionCourt } from "@/components/glossary-figures";
import { toSpeechText } from "@/lib/glossary-speech";
import GLOSSARY_AUDIO from "@/lib/glossary-audio.json";

// NBA用語辞典のカードを流す部品(分類ページ /guide/glossary/<分類> と、難易度別リスト beginner・intermediate・advanced で使う)。
// ・渡された分類(blocks)の順に、分類の見出しを区切りにしてカードを並べる。
//   NBAカルチャーは小見出し(ニックネーム・実況表現など)ごと、さらに用語データの小見出し(term.group)ごとに並べる。
// ・カードを押すと、その場で開いて(アコーディオン)全文・図解・読み上げ・選手名鑑へのリンク・あわせて読みたい用語を出す。
// ・見出しの上には「図解あり」「由来あり」のバッジだけを出す(難易度のバッジは出さない)。
// ・全用語の解説はサーバー側でHTMLに含める(閉じたカードは hidden で隠すだけなので、検索エンジンも読める)。
// ・URL の #term-用語ID(前の形式の #用語ID も)で、そのカードを開いた状態で表示する。
//   このページに無い用語の # で開かれたときは、その用語の分類ページへ移る。
// ・用語データ(lib/glossary-terms.ts)はここでは読み込まない(ブラウザに送る量を減らすため)。必要な分だけ props で受け取る。
// ・音声読み上げは「ゆっくり」「ふつう」の2速度。Googleの音声で作ったファイルを再生し、ファイルが無い用語だけブラウザ標準の speechSynthesis で読む。

// 全用語の「名前と分類」だけの表(あわせて読みたい用語のリンクと、# からの振り替えに使う。lib/glossary-pages.ts で作る)
export type GlossaryLookup = Record<string, { term: string; section: GlossarySectionKey }>;
export type GlossaryBlock = { key: GlossarySectionKey; groups: { label?: string; terms: GlossaryTerm[] }[] };

const dialogId = (id: string) => `term-${id}`;
// URL の # から用語IDを取り出す(#term-用語ID と、前の形式の #用語ID の両方に対応)。用語でなければ ""
function termIdFromHash(hash: string, lookup: GlossaryLookup): string {
  let raw = hash.replace(/^#/, "");
  try {
    raw = decodeURIComponent(raw);
  } catch {
    return "";
  }
  if (raw.startsWith("term-") && lookup[raw.slice(5)]) return raw.slice(5);
  return lookup[raw] ? raw : "";
}
const sectionId = (c: GlossarySectionKey) => `sec-${c}`;
// 分類の中の小見出し(term.group)ごとに分ける。小見出しのない用語はそのまま1つにまとめる(並び順はデータの順)
function subgroups(terms: GlossaryTerm[]): { group: string | undefined; terms: GlossaryTerm[] }[] {
  const out: { group: string | undefined; terms: GlossaryTerm[] }[] = [];
  for (const t of terms) {
    const last = out[out.length - 1];
    if (last && last.group === t.group) last.terms.push(t);
    else out.push({ group: t.group, terms: [t] });
  }
  return out;
}
const playerKey = (draft: [number, number]) => `${draft[0]}-${draft[1]}`;
// 「由来あり」の用語(選手のニックネーム。detail に必ず由来を書く決まり)
const isOriginTerm = (t: GlossaryTerm) => t.category === "nickname" && !!t.detail;

type Speed = "slow" | "normal";
// 速さ。「ふつう」は声の標準(1.0)だと遅く聞こえるため少し速め、「ゆっくり」は差がはっきりわかる程度に
const RATES: Record<Speed, number> = { slow: 0.85, normal: 1.3 };
// 事前に作った音声ファイル(Googleの音声で作成)。「ゆっくり」「ふつう」で声と速さを変えて別々に作ってあるので、等倍で再生する
// (scripts/generate-glossary-audio.ts が public/audio/glossary/<slow|normal>/ と lib/glossary-audio.json に書き出す)
const AUDIO_ITEMS: Record<Speed, Record<string, string>> = {
  slow: GLOSSARY_AUDIO.slow.items as Record<string, string>,
  normal: GLOSSARY_AUDIO.normal.items as Record<string, string>,
};
const audioSrc = (id: string, speed: Speed) => {
  const v = AUDIO_ITEMS[speed][id];
  return v ? `/audio/glossary/${speed}/${id}.mp3?v=${v}` : null;
};
const VOICE_KEY = "glossary-voice";

// useSyncExternalStore 用(表示中に変わらない値を読むだけなので購読は不要)
const subscribeNoop = () => () => {};
const readSpeechSupported = () => "speechSynthesis" in window;
const serverFalse = () => false;

// 端末にある日本語の声。自然に聞こえやすい順に並べる
// (Edge の「Natural/Online」(ニューラル音声) > Chrome の「Google 日本語」 > iPhone/Mac の Kyoko・O-ren > その他)
const VOICE_RANK = [/Natural/i, /Online/i, /Google/i, /Kyoko|O-ren|Otoya|Hattori/i, /Nanami|Keita/i];
function japaneseVoices(): SpeechSynthesisVoice[] {
  const rank = (v: SpeechSynthesisVoice) => {
    const i = VOICE_RANK.findIndex((re) => re.test(v.name));
    return i === -1 ? VOICE_RANK.length : i;
  };
  return window.speechSynthesis
    .getVoices()
    .filter((v) => v.lang.replace("_", "-").toLowerCase().startsWith("ja"))
    .sort((a, b) => rank(a) - rank(b));
}
function readSavedVoice(): string {
  try {
    return localStorage.getItem(VOICE_KEY) ?? "";
  } catch {
    return "";
  }
}

function useSpeech() {
  const supported = useSyncExternalStore(subscribeNoop, readSpeechSupported, serverFalse);
  const [speaking, setSpeaking] = useState<{ id: string; speed: Speed } | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceName, setVoiceNameState] = useState("");
  const runRef = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const synth = window.speechSynthesis;
    // 声の一覧は後から読み込まれるブラウザ(Chrome など)があるため、読み込み完了の知らせを待つ
    const load = () => {
      setVoices(japaneseVoices());
      setVoiceNameState(readSavedVoice());
    };
    synth.addEventListener("voiceschanged", load);
    const timer = window.setTimeout(load, 0);
    return () => {
      synth.removeEventListener("voiceschanged", load);
      window.clearTimeout(timer);
      synth.cancel();
      audioRef.current?.pause();
    };
  }, []);

  const setVoiceName = useCallback((name: string) => {
    setVoiceNameState(name);
    try {
      localStorage.setItem(VOICE_KEY, name);
    } catch {
      // 保存できない環境(プライベートモードなど)では、この画面の間だけ有効
    }
  }, []);

  const stop = useCallback(() => {
    runRef.current += 1;
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    audioRef.current?.pause();
    audioRef.current = null;
    setSpeaking(null);
  }, []);

  const speak = useCallback((term: GlossaryTerm, speed: Speed) => {
    const run = ++runRef.current;
    audioRef.current?.pause();
    audioRef.current = null;
    // 音声ファイルがあればそれを再生する(どの端末でも同じ自然な声)
    const src = audioSrc(term.id, speed);
    if (src) {
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
      const audio = new Audio(src);
      audio.onended = () => {
        if (runRef.current === run) setSpeaking(null);
      };
      audio.onerror = () => {
        if (runRef.current === run) setSpeaking(null);
      };
      audioRef.current = audio;
      setSpeaking({ id: term.id, speed });
      audio.play().catch(() => {
        if (runRef.current === run) setSpeaking(null);
      });
      return;
    }
    if (!("speechSynthesis" in window)) return;
    const synth = window.speechSynthesis;
    synth.cancel();
    const list = japaneseVoices();
    const voice = list.find((v) => v.name === voiceName) ?? list[0] ?? null;
    // 長い文を一度に渡すと途中で止まるブラウザがあるため、文ごとに分けて順番に読む
    const sentences = toSpeechText(term)
      .split(/(?<=。)/)
      .map((s) => s.trim())
      .filter(Boolean);
    setSpeaking({ id: term.id, speed });
    sentences.forEach((sentence, i) => {
      const u = new SpeechSynthesisUtterance(sentence);
      u.lang = "ja-JP";
      if (voice) u.voice = voice;
      u.rate = RATES[speed];
      if (i === sentences.length - 1) {
        u.onend = () => {
          if (runRef.current === run) setSpeaking(null);
        };
      }
      u.onerror = () => {
        if (runRef.current === run) setSpeaking(null);
      };
      synth.speak(u);
    });
  }, [voiceName]);

  return { supported, speaking, speak, stop, voices, voiceName, setVoiceName };
}
type Speech = ReturnType<typeof useSpeech>;

function SpeechControls({ term, speech }: { term: GlossaryTerm; speech: Speech }) {
  // 両方の速さの音声ファイルがあれば端末の声は使わない(声の選択も出さない)
  const hasAudio = !!audioSrc(term.id, "slow") && !!audioSrc(term.id, "normal");
  if (!speech.supported && !hasAudio) return null;
  const active = speech.speaking?.id === term.id ? speech.speaking.speed : null;
  const button = (speed: Speed, label: string) => (
    <button
      type="button"
      onClick={() => (active === speed ? speech.stop() : speech.speak(term, speed))}
      aria-pressed={active === speed}
      className={`selection-button inline-flex items-center gap-1.5 border px-3 py-1.5 text-xs font-bold ${
        active === speed ? "border-foreground bg-foreground text-surface" : "border-line bg-surface hover:border-foreground"
      }`}
    >
      <span aria-hidden>{active === speed ? "■" : "▶"}</span>
      {active === speed ? "停止" : label}
    </button>
  );
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[11px] font-extrabold tracking-[1px] text-muted">音声で聞く</span>
      {button("slow", "ゆっくり")}
      {button("normal", "ふつう")}
      {!hasAudio && speech.voices.length > 1 && (
        <label className="inline-flex items-center gap-1.5 text-[11px] font-bold text-muted">
          声
          <select
            value={speech.voiceName || speech.voices[0]?.name}
            onChange={(e) => {
              speech.stop();
              speech.setVoiceName(e.target.value);
            }}
            className="max-w-[180px] border border-line bg-surface px-1.5 py-1 text-xs text-foreground"
          >
            {speech.voices.map((v) => (
              <option key={v.name} value={v.name}>
                {v.name.replace(/^Microsoft\s+/, "").replace(/\s*-\s*Japanese \(Japan\)/, "")}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return <p className="mb-2 text-[11px] font-extrabold tracking-[1px] text-muted">{children}</p>;
}

// 用語カード(アコーディオン)。閉じている間は用語名と「ひとことで言うと」を見せ、押すとその場で開いて全文・音声・選手名鑑へのリンクを出す。
// 開いていない間も解説はHTMLに含める(hidden で隠すだけなので、検索エンジンも読める)。
function TermEntry({
  term,
  expanded,
  onToggle,
  onOpen,
  speech,
  showFigure,
  playerIds,
  lookup,
  onPage,
}: {
  term: GlossaryTerm;
  expanded: boolean;
  onToggle: (id: string) => void;
  onOpen: (id: string) => void;
  speech: Speech;
  showFigure: boolean;
  playerIds: Record<string, string>;
  lookup: GlossaryLookup;
  onPage: ReadonlySet<string>;
}) {
  const c = SECTION_BY_KEY[lookup[term.id].section];
  const players = (term.players ?? [])
    .map((pl) => ({ ja: pl.ja, id: playerIds[playerKey(pl.draft)] }))
    .filter((pl): pl is { ja: string; id: string } => !!pl.id);
  const related = (term.related ?? []).filter((id) => lookup[id]).map((id) => ({ id, ...lookup[id] }));
  const bodyId = `${dialogId(term.id)}-body`;
  // 対応するガイド記事(用語データの href か、lib/glossary-categories.ts の GLOSSARY_EXTRA_GUIDE_LINKS)
  const guide = term.href ? { href: term.href, label: term.linkLabel ?? "" } : GLOSSARY_EXTRA_GUIDE_LINKS[term.id];
  // 由来: 選手のニックネームは、用語データの detail が由来の説明(lib/glossary-slang.ts の決まり)なので「由来」として出す
  const hasOrigin = isOriginTerm(term);
  const playerLinks = players.length > 0 && (
    <p className="mt-3 flex flex-wrap gap-2">
      {players.map((pl) => (
        <Link
          key={pl.id}
          href={`/players/${pl.id}`}
          className="selection-button selection-blue inline-flex items-center gap-1 border border-blue px-3 py-1.5 text-xs font-bold text-blue"
        >
          選手名鑑：{pl.ja} →
        </Link>
      ))}
    </p>
  );
  return (
    <article
      id={dialogId(term.id)}
      className={`scroll-mt-20 border border-line border-l-4 bg-surface transition-shadow ${expanded ? "shadow-lg" : ""}`}
      style={{ borderLeftColor: c.color }}
    >
      <h3>
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={bodyId}
          onClick={() => onToggle(term.id)}
          className="group flex w-full items-start gap-3 px-3.5 py-3 text-left sm:px-5 sm:py-4"
          style={expanded ? { background: `linear-gradient(180deg, ${c.tint} 0%, var(--surface) 100%)` } : undefined}
        >
          <span className="min-w-0 flex-1">
            <span className="mb-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
              {term.figure && <span className="border border-line px-1.5 text-[10px] font-bold text-muted">図解あり</span>}
              {hasOrigin && <span className="border border-line px-1.5 text-[10px] font-bold text-muted">由来あり</span>}
            </span>
            <span className="flex flex-wrap items-baseline gap-x-3">
              <span className="text-[17px] font-bold leading-snug [word-break:auto-phrase] group-hover:text-blue sm:text-[20px]">{term.term}</span>
              <span lang="en" className="text-[11px] font-semibold uppercase tracking-[1px] text-muted">
                {term.en}
              </span>
            </span>
            <span className="mt-1 block text-pretty text-[14px] leading-6 text-foreground/80 [word-break:auto-phrase] sm:text-[15px] sm:leading-7">{term.short}</span>
          </span>
          <span
            aria-hidden
            className={`mt-1 inline-flex size-8 shrink-0 items-center justify-center border text-sm font-black transition-transform ${
              expanded ? "rotate-180 border-foreground bg-foreground text-surface" : "border-line text-muted group-hover:border-foreground group-hover:text-foreground"
            }`}
          >
            ▼
          </span>
        </button>
      </h3>

      <div id={bodyId} hidden={!expanded} className="space-y-6 border-t border-line px-4 pb-5 pt-5 sm:px-5">
        <SpeechControls term={term} speech={speech} />

        {/* カードの型: 一言(見出しの下) → 解説(詳しい解説・ポイント・観戦・実例) → 図解 → 由来 → あわせて読みたい用語 → 詳しく読む。無い要素は飛ばす */}
        {term.detail && !hasOrigin && (
          <div>
            <SectionLabel>詳しい解説</SectionLabel>
            <p className="text-pretty text-[15px] leading-8 [word-break:auto-phrase]">{term.detail}</p>
            {playerLinks}
          </div>
        )}

        {term.points && term.points.length > 0 && (
          <div>
            <SectionLabel>覚えておきたいポイント</SectionLabel>
            <ul className="space-y-2">
              {term.points.map((p) => (
                <li key={p} className="flex gap-2.5 text-[15px] leading-7">
                  <span aria-hidden className="mt-2.5 inline-block size-2 shrink-0" style={{ backgroundColor: c.color }} />
                  <span className="text-pretty [word-break:auto-phrase]">{p}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {term.watch && (
          <div className="border border-line bg-background px-4 py-3">
            <p className="mb-1 text-[11px] font-extrabold tracking-[1px] text-blue">観戦のときはここを見る</p>
            <p className="text-pretty text-[15px] leading-7 [word-break:auto-phrase]">{term.watch}</p>
          </div>
        )}

        {term.example && (
          <div>
            <SectionLabel>NBAでの実例</SectionLabel>
            <p className="text-pretty border-l-2 border-line pl-4 text-[15px] leading-8 text-muted [word-break:auto-phrase]">{term.example}</p>
          </div>
        )}

        {/* 図解はページを軽くするため、一度開いた用語だけ描く */}
        {term.figure && showFigure && <GlossaryFigureView figure={term.figure} />}

        {/* 由来(選手のニックネーム) */}
        {term.detail && hasOrigin && (
          <div>
            <SectionLabel>由来</SectionLabel>
            <p className="text-pretty text-[15px] leading-8 [word-break:auto-phrase]">{term.detail}</p>
            {playerLinks}
          </div>
        )}

        {term.category === "injury" && (
          <p className="text-xs leading-6 text-muted">※ 一般的な意味の説明です。選手ごとの状態・診断や復帰時期は、チームやNBAの発表を確認してください。</p>
        )}

        {related.length > 0 && (
          <div>
            <SectionLabel>あわせて読みたい用語</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {related.map((r) => {
                const cls = "inline-flex items-center gap-1.5 border border-line bg-surface px-2.5 py-1.5 text-xs font-bold hover:border-foreground";
                const body = (
                  <>
                    <CategoryMark c={SECTION_BY_KEY[r.section]} />
                    {r.term}
                  </>
                );
                // 同じページにある用語はその場で開く。別の分類の用語は、その分類ページの該当カード(開いた状態)へ
                return onPage.has(r.id) ? (
                  <a
                    key={r.id}
                    href={glossaryTermHash(r.id)}
                    onClick={(e) => {
                      e.preventDefault();
                      onOpen(r.id);
                    }}
                    className={cls}
                  >
                    {body}
                  </a>
                ) : (
                  <Link key={r.id} href={glossaryTermPath(r.id, r.section)} className={cls}>
                    {body}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {guide && (
          <Link href={guide.href} className="selection-button selection-blue inline-block border border-blue px-4 py-2 text-sm font-bold text-blue">
            詳しく読む：{guide.label} →
          </Link>
        )}

        <button
          type="button"
          onClick={() => onToggle(term.id)}
          className="inline-flex items-center gap-1.5 border border-line px-3 py-1.5 text-xs font-bold text-muted hover:border-foreground hover:text-foreground"
        >
          <span aria-hidden>▲</span>閉じる
        </button>
      </div>
    </article>
  );
}

// 上に固定する分類のナビ(用語集トップへ戻る＋17分類。今いる分類は塗りつぶし)
// 上に固定する分類のナビ(用語集トップへ戻る＋9分類。今いる分類は塗りつぶし)。
// blocks を渡したとき(難易度別リスト)は、ページの中の分類の見出しへ移動するボタンにする(語数はこのページの語数)
function CategoryNav({
  current,
  counts,
  blocks,
}: {
  current?: GlossarySectionKey;
  counts: Record<GlossarySectionKey, number>;
  blocks?: GlossaryBlock[];
}) {
  const inPage = blocks ? new Map(blocks.map((x) => [x.key, x.groups.reduce((n, g) => n + g.terms.length, 0)])) : null;
  const navRef = useRef<HTMLElement>(null);
  // 今いる分類のボタンが見えるように、横スクロールの位置を合わせる(スマホで後ろの分類を開いたとき)
  useEffect(() => {
    const nav = navRef.current;
    const here = nav?.querySelector<HTMLElement>('[aria-current="page"]');
    if (nav && here) nav.scrollLeft = here.offsetLeft - 120;
  }, [current]);
  return (
    <div className="sticky top-0 z-10 -mx-4 mb-5 border-y border-line bg-background/95 px-4 py-2 backdrop-blur sm:mx-0 sm:border-x sm:px-3">
      <nav ref={navRef} aria-label="用語集の分類" className="relative flex items-center gap-1.5 overflow-x-auto">
        <Link
          href={GLOSSARY_TOP_PATH}
          className="inline-flex h-9 shrink-0 items-center gap-1 border border-foreground bg-surface px-2.5 text-xs font-bold hover:bg-navy hover:text-white"
        >
          <span aria-hidden>←</span>用語集トップ
        </Link>
        <span aria-hidden className="h-6 shrink-0 border-l border-line" />
        {GLOSSARY_SECTIONS.filter((c) => !inPage || inPage.has(c.key)).map((c) => {
          const here = c.key === current;
          return (
            <Link
              key={c.key}
              href={inPage ? `#${sectionId(c.key)}` : glossarySectionPath(c.key)}
              aria-current={here ? "page" : undefined}
              className={`inline-flex h-9 shrink-0 items-center gap-1.5 border pl-1 pr-2.5 text-xs font-bold transition-colors ${
                here ? "text-white" : "bg-surface hover:border-foreground"
              }`}
              style={here ? { backgroundColor: c.color, borderColor: c.color } : { borderColor: c.color }}
            >
              <CategoryMark c={c} />
              {c.label}
              <span className={`tabular-nums ${here ? "text-white/80" : "text-muted"}`}>{inPage ? inPage.get(c.key) : counts[c.key]}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function GlossaryDictionary({
  blocks,
  lookup,
  counts,
  current,
  playerIds = {},
}: {
  blocks: GlossaryBlock[];
  lookup: GlossaryLookup;
  counts: Record<GlossarySectionKey, number>;
  // 分類ページのときはその分類(ナビで塗りつぶす)。難易度別リストでは省略
  current?: GlossarySectionKey;
  playerIds?: Record<string, string>;
}) {
  // 開いているカード(複数開ける)と、一度でも開いたカード(図解は一度開いた用語だけ描く)
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(() => new Set());
  const [opened, setOpened] = useState<ReadonlySet<string>>(() => new Set());
  const speech = useSpeech();
  const { stop, speaking } = speech;
  // このページに並んでいる用語
  const onPageKey = blocks.map((b) => b.groups.map((g) => g.terms.map((t) => t.id).join(",")).join(",")).join(",");
  const onPage = useMemo<ReadonlySet<string>>(() => new Set(onPageKey.split(",")), [onPageKey]);
  // 分類の見出しは、複数の分類を流すページ(難易度別リスト)でだけ出す(分類ページはページの見出しが分類名)
  const multi = !current;

  // カードを開く。scroll=true のときは開いたカードの位置まで移動する(関連用語・#リンクから開いたとき)
  const openTerm = useCallback(
    (id: string, scroll: boolean) => {
      if (!onPage.has(id)) return;
      setExpanded((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
      setOpened((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
      history.replaceState(history.state, "", `${location.pathname}${location.search}${glossaryTermHash(id)}`);
      if (scroll) {
        window.setTimeout(() => document.getElementById(dialogId(id))?.scrollIntoView({ block: "start" }), 30);
      }
    },
    [onPage],
  );

  const open = useCallback((id: string) => openTerm(id, true), [openTerm]);

  const toggle = useCallback(
    (id: string) => {
      if (!expanded.has(id)) {
        openTerm(id, false);
        return;
      }
      if (speaking?.id === id) stop();
      setExpanded((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      if (termIdFromHash(location.hash, lookup) === id) history.replaceState(history.state, "", `${location.pathname}${location.search}`);
    },
    [expanded, openTerm, speaking, stop, lookup],
  );

  // 初回表示: #term-用語ID(前の形式の #用語ID も)があればそのカードを開く。このページに無い用語なら、その用語の分類ページへ移る。
  // 表示中に # だけ変わったとき(URL を貼り直した・戻るボタンなど)も同じようにする
  useEffect(() => {
    const go = () => {
      const id = termIdFromHash(location.hash, lookup);
      if (!id) return;
      if (onPage.has(id)) openTerm(id, true);
      else location.replace(glossaryTermPath(id, lookup[id].section));
    };
    // 表示が終わってから開く(開いたカードの位置へ移動するため)
    const timer = window.setTimeout(go, 0);
    window.addEventListener("hashchange", go);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("hashchange", go);
    };
  }, [openTerm, onPage, lookup]);

  const card = (t: GlossaryTerm) => (
    <li key={t.id}>
      <TermEntry
        term={t}
        expanded={expanded.has(t.id)}
        onToggle={toggle}
        onOpen={open}
        speech={speech}
        showFigure={opened.has(t.id)}
        playerIds={playerIds}
        lookup={lookup}
        onPage={onPage}
      />
    </li>
  );

  return (
    <>
      <CategoryNav current={current} counts={counts} blocks={multi ? blocks : undefined} />

      {/* 用語のカード。分類の順にそのまま流し、見出しは区切りとして出すだけ */}
      <div id="glossary-list" className="max-w-4xl scroll-mt-16 space-y-10">
        {blocks.map(({ key, groups }) => {
          const c = SECTION_BY_KEY[key];
          const n = groups.reduce((m, g) => m + g.terms.length, 0);
          return (
            <section key={key} id={sectionId(key)} aria-label={c.label} className="scroll-mt-16">
              {multi && (
                <div className="mb-3 flex items-center gap-2.5 border-b-2 pb-2" style={{ borderColor: c.color }}>
                  <CategoryMark c={c} />
                  <h2 className="shrink-0 text-lg font-bold tracking-tight sm:text-xl">
                    <Link href={glossarySectionPath(key)} className="hover:text-blue hover:underline">
                      {c.label}
                    </Link>
                    <span className="ml-2 text-xs font-semibold text-muted tabular-nums">{n}語</span>
                  </h2>
                  <p className="hidden text-sm text-muted md:block">{c.lead}</p>
                </div>
              )}

              {key === "players-positions" && groups.some((g) => g.terms.some((t) => t.id === "point-guard")) && (
                <div className="mb-5 grid items-center gap-4 border border-line bg-surface p-4 sm:grid-cols-[minmax(0,420px)_1fr] sm:p-5">
                  <PositionCourt onOpen={open} />
                  <div>
                    <p className="text-[11px] font-extrabold tracking-[1px]" style={{ color: c.color }}>
                      まずはここから
                    </p>
                    <h3 className="mt-1 text-lg font-bold">5つのポジション</h3>
                    <p className="mt-2 text-sm leading-7 text-muted">
                      バスケットボールは1チーム5人。役割に合わせて1番〜5番と呼びます。コート上の番号を押すと、そのポジションの解説が開きます。
                    </p>
                    <ul className="mt-3 grid gap-1.5 text-sm">
                      {[
                        ["1", "ポイントガード（PG）", "司令塔", "point-guard"],
                        ["2", "シューティングガード（SG）", "得点役", "shooting-guard"],
                        ["3", "スモールフォワード（SF）", "万能型", "small-forward"],
                        ["4", "パワーフォワード（PF）", "体を張る", "power-forward"],
                        ["5", "センター（C）", "ゴール下の柱", "center"],
                      ].map(([num, name, role, id]) => (
                        <li key={id}>
                          <button type="button" onClick={() => open(id)} className="flex w-full items-center gap-2 text-left hover:text-blue">
                            <span className="inline-flex size-6 shrink-0 items-center justify-center bg-navy text-xs font-black text-white">{num}</span>
                            <span className="font-bold">{name}</span>
                            <span className="text-xs text-muted">{role}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {groups.map((g) => (
                <div key={g.label ?? "-"} className={g.label ? "mt-8 first:mt-0" : undefined}>
                  {g.label && (
                    <h3 className="mb-3 flex items-baseline gap-2 border-b border-line pb-1.5 text-lg font-black tracking-tight">
                      <span aria-hidden className="inline-block h-4 w-1.5 self-center" style={{ backgroundColor: c.color }} />
                      {g.label}
                      <span className="text-xs font-semibold text-muted tabular-nums">{g.terms.length}語</span>
                    </h3>
                  )}
                  {subgroups(g.terms).map(({ group, terms }) => (
                    <div key={group ?? "-"} className={group ? "mt-5 first:mt-0" : undefined}>
                      {group && (
                        <h4 className="mb-2.5 flex items-center gap-2 text-sm font-bold text-muted">
                          {group}
                          <span className="text-xs font-semibold tabular-nums">{terms.length}語</span>
                        </h4>
                      )}
                      <ul className="space-y-2.5">{terms.map(card)}</ul>
                    </div>
                  ))}
                </div>
              ))}
            </section>
          );
        })}
      </div>
    </>
  );
}
