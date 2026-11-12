"use client";

import { Fragment, useCallback, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import Link from "next/link";
import {
  GLOSSARY_CATEGORIES,
  GLOSSARY_CATEGORY_GROUPS,
  GLOSSARY_LEVELS,
  GLOSSARY_TERMS,
  type GlossaryCategory,
  type GlossaryLevel,
  type GlossaryTerm,
} from "@/lib/glossary-terms";
import { GLOSSARY_KANA_TABLE, type GlossaryIndex } from "@/lib/glossary-index";
import { GlossaryFigureView, PositionCourt } from "@/components/glossary-figures";
import { toSpeechText } from "@/lib/glossary-speech";
import GLOSSARY_AUDIO from "@/lib/glossary-audio.json";

// NBA用語辞典の本体。
// ・用語は「分類」ごとの見出しの下に並べる(分類は色だけでなく、1文字のマークと名前で区別する)。
//   分類は「基本の用語」と「スラング・ニックネーム」の2つのまとまりに分けて、目次と見出しを出す。
//   分類の中に小見出し(term.group)がある用語は、小見出しごとに並べる(選手のニックネームの「レジェンド」など)。
// ・ニックネームなどの選手は、選手名鑑と照合できた場合だけ「選手名鑑」へのリンクを出す(playerIds。照合はサーバー側)。
// ・検索・レベル(初心者/中級者/上級者)・あいうえお索引・分類ボタンは、使いたい人のための補助として上に置く。
// ・ザッピングして眺める読み物として、最初から全用語のカード(用語名＋ひとことで言うと)を分類の順に流す。
// ・カードを押すと、その場で開いて(アコーディオン)全文・読み上げ・選手名鑑へのリンクを出す。ページ移動やポップアップはしない。
// ・全用語の解説はサーバー側でHTMLに含める(閉じたカードは hidden で隠すだけなので、検索エンジンも読める)。
// ・URL の #term-用語ID(例: #term-too-small)で直接開ける(共有用)。前の形式の #用語ID も開ける。?level=beginner などでレベルを選んだ状態で開ける。
// ・あいうえお索引(あいうえお順/ABC順)は「索引」ボタンで開く。用語名を押すと、そのカードを開いてその位置へ移動する。
// ・音声読み上げは「ゆっくり」「ふつう」の2速度。Googleの音声で作ったファイルを再生し、ファイルが無い用語だけブラウザ標準の speechSynthesis で読む。

type Category = (typeof GLOSSARY_CATEGORIES)[number];
const CATEGORY_BY_KEY = Object.fromEntries(GLOSSARY_CATEGORIES.map((c) => [c.key, c])) as Record<GlossaryCategory, Category>;
const LEVEL_LABEL = Object.fromEntries(GLOSSARY_LEVELS.map((l) => [l.key, l.label])) as Record<GlossaryLevel, string>;
const TERM_BY_ID = Object.fromEntries(GLOSSARY_TERMS.map((t) => [t.id, t])) as Record<string, GlossaryTerm>;
const dialogId = (id: string) => `term-${id}`;
// URL の # に付ける形(#term-用語ID)。ポップアップの要素IDと同じ
const termHash = (id: string) => `#${dialogId(id)}`;
// URL の # から用語IDを取り出す(#term-用語ID と、前の形式の #用語ID の両方に対応)。用語でなければ ""
function termIdFromHash(hash: string): string {
  let raw = hash.replace(/^#/, "");
  try {
    raw = decodeURIComponent(raw);
  } catch {
    return "";
  }
  if (raw.startsWith("term-") && TERM_BY_ID[raw.slice(5)]) return raw.slice(5);
  return TERM_BY_ID[raw] ? raw : "";
}
const sectionId = (c: GlossaryCategory) => `cat-${c}`;
const LEVEL_DOTS: Record<GlossaryLevel, number> = { beginner: 1, intermediate: 2, advanced: 3 };
const groupId = (g: string) => `group-${g}`;
const GROUP_LABEL = Object.fromEntries(GLOSSARY_CATEGORY_GROUPS.map((g) => [g.key, g.label])) as Record<string, string>;
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

type LevelFilter = GlossaryLevel | "all";
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
const readUrlLevel = (): LevelFilter | null => {
  const lv = new URLSearchParams(location.search).get("level");
  return lv === "beginner" || lv === "intermediate" || lv === "advanced" ? lv : null;
};
const serverNull = () => null;
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

// 分類のマーク(1文字)。色だけに頼らず文字でも見分けられるようにする
function CategoryMark({ c, size = "sm" }: { c: Category; size?: "sm" | "lg" }) {
  const cls = size === "lg" ? "size-12 text-2xl" : "size-6 text-[13px]";
  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 items-center justify-center font-black text-white ${cls}`}
      style={{ backgroundColor: c.color }}
    >
      {c.mark}
    </span>
  );
}

function LevelDots({ level, light = false }: { level: GlossaryLevel; light?: boolean }) {
  const dots = LEVEL_DOTS[level];
  return (
    <span aria-hidden className="inline-flex gap-0.5">
      {[1, 2, 3].map((n) => (
        <span
          key={n}
          className={`inline-block size-1.5 ${n <= dots ? (light ? "bg-gold" : "bg-foreground") : light ? "bg-white/30" : "bg-line"}`}
        />
      ))}
    </span>
  );
}

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
}: {
  term: GlossaryTerm;
  expanded: boolean;
  onToggle: (id: string) => void;
  onOpen: (id: string) => void;
  speech: Speech;
  showFigure: boolean;
  playerIds: Record<string, string>;
}) {
  const c = CATEGORY_BY_KEY[term.category];
  const players = (term.players ?? [])
    .map((pl) => ({ ja: pl.ja, id: playerIds[playerKey(pl.draft)] }))
    .filter((pl): pl is { ja: string; id: string } => !!pl.id);
  const related = (term.related ?? []).map((id) => TERM_BY_ID[id]).filter(Boolean);
  const bodyId = `${dialogId(term.id)}-body`;
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
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-muted">
                <LevelDots level={term.level} />
                {LEVEL_LABEL[term.level]}
              </span>
              {term.figure && <span className="border border-line px-1.5 text-[10px] font-bold text-muted">図解あり</span>}
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

        {/* 図解はページを軽くするため、一度開いた用語だけ描く */}
        {term.figure && showFigure && <GlossaryFigureView figure={term.figure} />}

        {term.detail && (
          <div>
            <SectionLabel>詳しい解説</SectionLabel>
            <p className="text-pretty text-[15px] leading-8 [word-break:auto-phrase]">{term.detail}</p>
            {players.length > 0 && (
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
            )}
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

        {term.category === "injury" && (
          <p className="text-xs leading-6 text-muted">※ 一般的な意味の説明です。選手ごとの状態・診断や復帰時期は、チームやNBAの発表を確認してください。</p>
        )}

        {related.length > 0 && (
          <div>
            <SectionLabel>あわせて読みたい用語</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {related.map((r) => (
                <a
                  key={r.id}
                  href={termHash(r.id)}
                  onClick={(e) => {
                    e.preventDefault();
                    onOpen(r.id);
                  }}
                  className="inline-flex items-center gap-1.5 border border-line bg-surface px-2.5 py-1.5 text-xs font-bold hover:border-foreground"
                >
                  <CategoryMark c={CATEGORY_BY_KEY[r.category]} />
                  {r.term}
                </a>
              ))}
            </div>
          </div>
        )}

        {term.href && (
          <Link href={term.href} className="selection-button selection-blue inline-block border border-blue px-4 py-2 text-sm font-bold text-blue">
            詳しく読む：{term.linkLabel} →
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

const INDEX_ID = "term-index";
type IndexOrder = "kana" | "abc";

// ページ上部の索引(全用語)。用語名をチップ(ボタン状)で並べ、押すとその用語の解説(ポップアップ)を開く。
// 並びはサーバー側で決めたもの(lib/glossary-index.ts)。レベルの絞り込みと検索に合わせて、当てはまる用語だけ出す。
// 索引の上に50音表(ABC順はA〜Z)を置き、1文字目を押すとその文字の用語へ飛ぶ(スマホでも「文字→用語」の2タップで開ける)。
function TermIndex({ index, visible, onOpen }: { index: GlossaryIndex; visible: GlossaryTerm[]; onOpen: (id: string) => void }) {
  const [order, setOrder] = useState<IndexOrder>("kana");
  const shown = new Set(visible.map((t) => t.id));
  const groups = index[order]
    .map((g) => ({ label: g.label, subs: g.subs, terms: g.ids.filter((id) => shown.has(id)).map((id) => TERM_BY_ID[id]) }))
    .filter((g) => g.terms.length > 0);
  const total = groups.reduce((n, g) => n + g.terms.length, 0);
  const tabs: { key: IndexOrder; label: string }[] = [
    { key: "kana", label: "あいうえお順" },
    { key: "abc", label: "ABC順（英字）" },
  ];
  const rowId = (label: string) => `${INDEX_ID}-${order}-${label}`;
  const charId = (ch: string) => `${INDEX_ID}-kana-c-${ch}`;
  const rowLabel = (label: string) => (order === "kana" && label !== "他" ? `${label}行` : label);
  const jumpId = `${INDEX_ID}-jump`;
  // 表示中の1文字目(用語がない文字は押せない表示にする)
  const kanaChars = new Set<string>();
  if (order === "kana") for (const g of groups) for (const sub of g.subs ?? []) if (sub.ids.some((id) => shown.has(id))) kanaChars.add(sub.label);
  const rowsShown = new Set(groups.map((g) => g.label));
  const jumpButton = "inline-flex h-11 items-center justify-center border text-base font-black";
  const jumpOn = "border-line bg-surface hover:border-foreground hover:text-blue";
  const jumpOff = "pointer-events-none border-transparent bg-background text-muted/40";
  return (
    <section id={INDEX_ID} aria-labelledby={`${INDEX_ID}-title`} className="mb-10 scroll-mt-16">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3 border-b-4 border-foreground pb-3">
        <div>
          <p className="text-[11px] font-extrabold tracking-[2px] text-muted">INDEX</p>
          <h2 id={`${INDEX_ID}-title`} className="text-2xl font-black tracking-tight sm:text-3xl">
            索引から探す
            <span className="ml-2 text-sm font-semibold text-muted tabular-nums">{total}語</span>
          </h2>
          <p className="mt-1 text-sm text-muted">最初の文字を選んで、用語名を押すと解説が開きます。</p>
        </div>
        <div role="tablist" aria-label="索引の並び" className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
          {tabs.map((tab) => {
            const selected = order === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setOrder(tab.key)}
                className={`selection-button min-h-11 border px-4 py-2 text-sm font-bold ${
                  selected ? "border-foreground bg-navy text-white" : "border-line bg-surface hover:border-foreground"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {total === 0 ? (
        <p className="py-4 text-sm text-muted">当てはまる用語はありません。</p>
      ) : (
        <>
          {/* 50音表 / A〜Z(押すとその文字の用語へ移動) */}
          <nav id={jumpId} aria-label="最初の文字から探す" className="scroll-mt-16 border-b border-line pb-4">
            {order === "kana" ? (
              <div className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
                {GLOSSARY_KANA_TABLE.map(({ row, chars }) => (
                  <div key={row} className="grid grid-cols-[3.5rem_repeat(5,minmax(0,1fr))] gap-1.5">
                    <a href={`#${rowId(row)}`} className={`${jumpButton} ${rowsShown.has(row) ? "border-navy bg-navy text-white hover:opacity-90" : jumpOff}`}>
                      {row}行
                    </a>
                    {chars.map((ch) => (
                      <a key={ch} href={`#${charId(ch)}`} aria-disabled={!kanaChars.has(ch)} className={`${jumpButton} ${kanaChars.has(ch) ? jumpOn : jumpOff}`}>
                        {ch}
                      </a>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-6 gap-1.5 sm:flex sm:flex-wrap">
                {groups.map((g) => (
                  <a key={g.label} href={`#${rowId(g.label)}`} className={`${jumpButton} px-2 sm:min-w-11 ${jumpOn}`}>
                    {g.label}
                  </a>
                ))}
              </div>
            )}
          </nav>
          <div className="space-y-6 pt-5">
            {groups.map((g) => {
              // あいうえお順は1文字目ごとに分け、各文字の最初の用語に飛び先(id)を付ける
              const parts = order === "kana" && g.subs ? g.subs.map((sub) => ({ ch: sub.label, terms: sub.ids.filter((id) => shown.has(id)).map((id) => TERM_BY_ID[id]) })) : [{ ch: "", terms: g.terms }];
              return (
                <div key={g.label} id={rowId(g.label)} className="scroll-mt-16">
                  <h3 className="mb-3 flex items-baseline gap-3 border-b border-line pb-2">
                    <span className="inline-flex min-w-12 items-center justify-center bg-navy px-2 py-1 text-2xl font-black leading-none text-white sm:text-3xl">
                      {rowLabel(g.label)}
                    </span>
                    <span className="text-xs font-semibold text-muted tabular-nums">{g.terms.length}語</span>
                    <a href={`#${jumpId}`} className="ml-auto text-xs font-bold text-blue hover:underline">
                      ↑ 文字の一覧へ
                    </a>
                  </h3>
                  <ul className="flex flex-wrap gap-2">
                    {parts.flatMap(({ ch, terms }) =>
                      terms.map((t, ti) => (
                        <li key={t.id} id={ch && ti === 0 ? charId(ch) : undefined} className="scroll-mt-16">
                          <a
                            href={termHash(t.id)}
                            onClick={(e) => {
                              e.preventDefault();
                              onOpen(t.id);
                            }}
                            lang={order === "abc" ? "en" : undefined}
                            className="selection-button inline-flex min-h-11 items-center border border-line border-l-4 bg-surface px-3 py-2 text-sm font-bold leading-snug hover:border-foreground hover:text-blue [word-break:auto-phrase]"
                            style={{ borderLeftColor: CATEGORY_BY_KEY[t.category].color }}
                          >
                            {order === "abc" ? t.en : t.term}
                          </a>
                        </li>
                      )),
                    )}
                  </ul>
                </div>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}

// 検索語に当てはまるか(用語名・英語名・ひとことで言うと)
function matchesQuery(t: GlossaryTerm, query: string): boolean {
  const q = query.trim().toLowerCase();
  return !q || t.term.toLowerCase().includes(q) || t.en.toLowerCase().includes(q) || t.short.toLowerCase().includes(q);
}

export function GlossaryDictionary({
  playerIds = {},
  termIndex,
}: {
  playerIds?: Record<string, string>;
  termIndex?: GlossaryIndex;
}) {
  // レベル: 画面で選んだもの > URL の ?level= > すべて
  const [chosenLevel, setLevel] = useState<LevelFilter | null>(null);
  const urlLevel = useSyncExternalStore(subscribeNoop, readUrlLevel, serverNull);
  const level: LevelFilter = chosenLevel ?? urlLevel ?? "all";
  const [query, setQuery] = useState("");
  // 開いているカード(複数開ける)と、一度でも開いたカード(図解は一度開いた用語だけ描く)
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(() => new Set());
  const [opened, setOpened] = useState<ReadonlySet<string>>(() => new Set());
  const [showIndex, setShowIndex] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const speech = useSpeech();
  const { stop, speaking } = speech;
  // openTerm から今の絞り込みを読むため(openTerm 自体は作り直さない)
  const filterRef = useRef({ level, query });
  useEffect(() => {
    filterRef.current = { level, query };
  }, [level, query]);

  // カードを開く。scroll=true のときは開いたカードの位置まで移動する(索引・関連用語・#リンクから開いたとき)
  const openTerm = useCallback((id: string, scroll: boolean) => {
    const term = TERM_BY_ID[id];
    if (!term) return;
    // レベルの絞り込みや検索で隠れている用語なら、絞り込みを外して見えるようにする
    const f = filterRef.current;
    if (f.level !== "all" && f.level !== term.level) setLevel("all");
    if (!matchesQuery(term, f.query)) setQuery("");
    setExpanded((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
    setOpened((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
    history.replaceState(null, "", `${location.pathname}${location.search}${termHash(id)}`);
    if (scroll) {
      window.setTimeout(() => document.getElementById(dialogId(id))?.scrollIntoView({ block: "start" }), 30);
    }
  }, []);

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
      if (termIdFromHash(location.hash) === id) history.replaceState(null, "", `${location.pathname}${location.search}`);
    },
    [expanded, openTerm, speaking, stop],
  );

  // 初回表示: #term-用語ID(前の形式の #用語ID も)があればそのカードを開く。表示中に # だけ変わったとき(URL を貼り直した・戻るボタンなど)も開く
  useEffect(() => {
    const id = termIdFromHash(location.hash);
    // 表示が終わってから開く(開いたカードの位置へ移動するため)
    const timer = id ? window.setTimeout(() => openTerm(id, true), 0) : undefined;
    const onHashChange = () => {
      const next = termIdFromHash(location.hash);
      if (next) openTerm(next, true);
    };
    window.addEventListener("hashchange", onHashChange);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("hashchange", onHashChange);
    };
  }, [openTerm]);

  // 一覧の先頭(カードの流れの最初)。絞り込みを変えたとき、下の方にいたらここへ戻す
  const backToListTop = () => {
    const el = document.getElementById("glossary-list");
    if (el && el.getBoundingClientRect().top < 0) el.scrollIntoView({ block: "start" });
  };
  const changeQuery = (v: string) => {
    setQuery(v);
    backToListTop();
  };
  // 索引を開いたら、索引の位置へ移動する(バーは上に固定なので、下の方から押しても見えるように)
  const toggleIndex = () => {
    const next = !showIndex;
    setShowIndex(next);
    if (next) window.setTimeout(() => document.getElementById("term-index")?.scrollIntoView({ block: "start" }), 0);
  };
  const selectLevel = (lv: LevelFilter) => {
    setLevel(lv);
    const url = lv === "all" ? location.pathname : `${location.pathname}?level=${lv}`;
    history.replaceState(null, "", url);
    backToListTop();
  };

  const q = query.trim().toLowerCase();
  const inLevel = GLOSSARY_TERMS.filter((t) => level === "all" || t.level === level);
  const visible = inLevel.filter((t) => matchesQuery(t, query));
  const sections = GLOSSARY_CATEGORIES.map((c) => ({ c, terms: visible.filter((t) => t.category === c.key) })).filter((s) => s.terms.length > 0);
  const showPositionCourt = !q && (level === "all" || level === "beginner");

  const levelTabs = [
    { key: "all", label: "すべて", short: "すべて", count: GLOSSARY_TERMS.length },
    ...GLOSSARY_LEVELS.map((l) => ({ key: l.key, label: l.label, short: l.label.replace("向け", ""), count: GLOSSARY_TERMS.filter((t) => t.level === l.key).length })),
  ] as { key: LevelFilter; label: string; short: string; count: number }[];

  return (
    <>
      {/* 補助の道具(検索・レベル・索引・分類)を1本のバーにまとめて上に固定する。
          用語のカードは最初から全部並べ、このバーは使いたい人だけ使う(スマホでも最初の画面にカードが見えるよう、高さを抑える) */}
      <div className="sticky top-0 z-10 -mx-4 mb-5 border-y border-line bg-background/95 px-4 py-2 backdrop-blur sm:mx-0 sm:border-x sm:px-3">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            aria-expanded={showSearch}
            aria-controls="glossary-search"
            aria-label="用語を検索"
            onClick={() => {
              setShowSearch((v) => !v);
              window.setTimeout(() => document.getElementById("glossary-search-input")?.focus(), 0);
            }}
            className={`inline-flex h-9 shrink-0 items-center gap-1 border px-2.5 text-xs font-bold sm:hidden ${showSearch || query ? "border-foreground bg-navy text-white" : "border-line bg-surface"}`}
          >
            <svg aria-hidden viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="8.5" cy="8.5" r="6" />
              <path d="M13 13l5 5" />
            </svg>
            検索
          </button>
          <label className="hidden h-9 w-64 shrink-0 items-center gap-2 border border-line bg-surface px-2.5 focus-within:border-foreground sm:flex">
            <svg aria-hidden viewBox="0 0 20 20" className="size-4 text-muted" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="8.5" cy="8.5" r="6" />
              <path d="M13 13l5 5" />
            </svg>
            <input
              type="search"
              value={query}
              onChange={(e) => changeQuery(e.target.value)}
              placeholder="用語を探す（例：TS%）"
              aria-label="用語を検索"
              className="w-full min-w-0 bg-transparent text-sm outline-none"
            />
          </label>
          <label className="relative shrink-0">
            <span className="sr-only">レベル</span>
            <select
              value={level}
              onChange={(e) => selectLevel(e.target.value as LevelFilter)}
              className={`h-9 appearance-none border py-0 pl-2.5 pr-6 text-xs font-bold sm:text-sm ${level !== "all" ? "border-foreground bg-navy text-white" : "border-line bg-surface"}`}
            >
              {levelTabs.map((tab) => (
                <option key={tab.key} value={tab.key}>
                  {tab.key === "all" ? `全レベル（${tab.count}）` : `${tab.label}（${tab.count}）`}
                </option>
              ))}
            </select>
            <span aria-hidden className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px]">▼</span>
          </label>
          {termIndex && (
            <button
              type="button"
              aria-expanded={showIndex}
              aria-controls="term-index"
              onClick={toggleIndex}
              className={`inline-flex h-9 shrink-0 items-center border px-2.5 text-xs font-bold sm:text-sm ${showIndex ? "border-foreground bg-navy text-white" : "border-line bg-surface hover:border-foreground"}`}
            >
              <span className="sm:hidden">索引</span>
              <span className="hidden sm:inline">あいうえお索引</span>
            </button>
          )}
          {/* 分類(押すとその分類の見出しへ移動)。横にスクロール */}
          <nav aria-label="分類" className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto border-l border-line pl-1.5">
            {GLOSSARY_CATEGORY_GROUPS.map((g) => (
              <Fragment key={g.key}>
                <span className="shrink-0 pl-1 text-[11px] font-extrabold text-muted first:pl-0">{g.short}</span>
                {GLOSSARY_CATEGORIES.filter((c) => c.group === g.key).map((c) => {
                  const count = visible.filter((t) => t.category === c.key).length;
                  return (
                    <a
                      key={c.key}
                      href={`#${sectionId(c.key)}`}
                      aria-disabled={count === 0}
                      className={`inline-flex h-9 shrink-0 items-center gap-1.5 border bg-surface pl-1 pr-2.5 text-xs font-bold transition-colors hover:border-foreground ${
                        count === 0 ? "pointer-events-none opacity-40" : ""
                      }`}
                      style={{ borderColor: c.color }}
                    >
                      <CategoryMark c={c} />
                      {c.label}
                      <span className="tabular-nums text-muted">{count}</span>
                    </a>
                  );
                })}
              </Fragment>
            ))}
          </nav>
        </div>
        {/* スマホの検索窓(「検索」を押したときだけ出す) */}
        {(showSearch || query) && (
          <label id="glossary-search" className="mt-2 flex items-center gap-2 border border-line bg-surface px-3 py-2 focus-within:border-foreground sm:hidden">
            <input
              id="glossary-search-input"
              type="search"
              value={query}
              onChange={(e) => changeQuery(e.target.value)}
              placeholder="用語を探す（例：トラベリング、TS%）"
              aria-label="用語を検索"
              className="w-full min-w-0 bg-transparent text-sm outline-none"
            />
          </label>
        )}
      </div>
      {level !== "all" && <p className="mb-3 text-sm text-muted">{GLOSSARY_LEVELS.find((l) => l.key === level)?.lead}</p>}

      {/* 索引(「索引」を押したときだけ出す)。用語名を押すと、そのカードを開いてその位置へ移動する */}
      {termIndex && showIndex && <TermIndex index={termIndex} visible={visible} onOpen={open} />}


      {sections.length === 0 && <p className="text-sm text-muted">「{query}」に当てはまる用語はありません。</p>}

      {/* 全用語のカード。分類の順にそのまま流し、分類の見出しは区切りとして出すだけ */}
      <div id="glossary-list" className="max-w-4xl scroll-mt-16 space-y-10">
        {sections.map(({ c, terms }, i) => (
          <Fragment key={c.key}>
          {/* まとまり(基本の用語/スラング)の見出し。スマホでは最初の見出しを省いて、最初の画面にカードが多く見えるようにする */}
          {(i === 0 || sections[i - 1].c.group !== c.group) && (
            <div id={groupId(c.group)} className={`mb-3! scroll-mt-16 border-t-[3px] border-foreground pt-1.5 ${i === 0 ? "hidden sm:block" : ""}`}>
              <h2 className="text-lg font-black tracking-tight sm:text-2xl">{GROUP_LABEL[c.group]}</h2>
              {c.group === "slang" && (
                <p className="mt-0.5 text-sm text-muted">実況やSNSで見かけるスラング、決めポーズ、選手のニックネームの由来など。</p>
              )}
            </div>
          )}
          <section id={sectionId(c.key)} aria-labelledby={`${sectionId(c.key)}-title`} className="scroll-mt-16">
            <div className="mb-3 flex items-center gap-2.5 border-b-2 pb-2" style={{ borderColor: c.color }}>
              <CategoryMark c={c} />
              <h2 id={`${sectionId(c.key)}-title`} className="shrink-0 text-lg font-bold tracking-tight sm:text-xl">
                {c.label}
                <span className="ml-2 text-xs font-semibold text-muted tabular-nums">{terms.length}語</span>
              </h2>
              <p className="hidden text-sm text-muted md:block">{c.lead}</p>
            </div>

            {c.key === "position" && showPositionCourt && (
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
                    ].map(([n, name, role, id]) => (
                      <li key={id}>
                        <button type="button" onClick={() => open(id)} className="flex w-full items-center gap-2 text-left hover:text-blue">
                          <span className="inline-flex size-6 shrink-0 items-center justify-center bg-navy text-xs font-black text-white">{n}</span>
                          <span className="font-bold">{name}</span>
                          <span className="text-xs text-muted">{role}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {subgroups(terms).map(({ group, terms: groupTerms }) => (
              <div key={group ?? "-"} className={group ? "mt-6 first:mt-0" : undefined}>
                {group && (
                  <h3 className="mb-2.5 flex items-center gap-2 text-base font-bold">
                    <span aria-hidden className="inline-block h-4 w-1" style={{ backgroundColor: c.color }} />
                    {group}
                    <span className="text-xs font-semibold text-muted tabular-nums">{groupTerms.length}語</span>
                  </h3>
                )}
                <ul className="space-y-2.5">
                  {groupTerms.map((t) => (
                    <li key={t.id}>
                      <TermEntry
                        term={t}
                        expanded={expanded.has(t.id)}
                        onToggle={toggle}
                        onOpen={open}
                        speech={speech}
                        showFigure={opened.has(t.id)}
                        playerIds={playerIds}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
          </Fragment>
        ))}
      </div>
    </>
  );
}
