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
import { GlossaryFigureView, PositionCourt } from "@/components/glossary-figures";
import { toSpeechText } from "@/lib/glossary-speech";
import GLOSSARY_AUDIO from "@/lib/glossary-audio.json";

// NBA用語辞典の本体。
// ・用語は「分類」ごとの見出しの下に並べる(分類は色だけでなく、1文字のマークと名前で区別する)。
//   分類は「基本の用語」と「スラング・ニックネーム」の2つのまとまりに分けて、目次と見出しを出す。
//   分類の中に小見出し(term.group)がある用語は、小見出しごとに並べる(選手のニックネームの「レジェンド」など)。
// ・ニックネームなどの選手は、選手名鑑と照合できた場合だけ「選手名鑑」へのリンクを出す(playerIds。照合はサーバー側)。
// ・上部の分類ボタンで、その分類の見出しへ移動する。レベル(初心者/中級者/上級者)と検索で絞り込める。
// ・用語カードをクリックすると、その用語の解説をポップアップ(<dialog>)で開く。
// ・全用語の解説はサーバー側でHTMLに含める(閉じた<dialog>の中身として出力するので、検索エンジンも読める)。
// ・URL の #用語ID で直接開ける(共有用)。?level=beginner などでレベルを選んだ状態で開ける。
// ・音声読み上げは「ゆっくり」「ふつう」の2速度。Googleの音声で作ったファイルを再生し、ファイルが無い用語だけブラウザ標準の speechSynthesis で読む。

type Category = (typeof GLOSSARY_CATEGORIES)[number];
const CATEGORY_BY_KEY = Object.fromEntries(GLOSSARY_CATEGORIES.map((c) => [c.key, c])) as Record<GlossaryCategory, Category>;
const LEVEL_LABEL = Object.fromEntries(GLOSSARY_LEVELS.map((l) => [l.key, l.label])) as Record<GlossaryLevel, string>;
const TERM_BY_ID = Object.fromEntries(GLOSSARY_TERMS.map((t) => [t.id, t])) as Record<string, GlossaryTerm>;
const dialogId = (id: string) => `term-${id}`;
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
const readUrlTerm = () => decodeURIComponent(location.hash.slice(1));
const serverNull = () => null;
const serverEmpty = () => "";
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

function TermDialog({
  term,
  onClose,
  onOpen,
  speech,
  showFigure,
  playerIds,
}: {
  term: GlossaryTerm;
  onClose: () => void;
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
  return (
    <dialog
      id={dialogId(term.id)}
      aria-labelledby={`${dialogId(term.id)}-title`}
      onClose={onClose}
      onClick={(e) => {
        // 背景(ダイアログの外側)をクリックしたら閉じる
        if (e.target === e.currentTarget) e.currentTarget.close();
      }}
      className="m-auto max-h-[90dvh] w-[calc(100%-20px)] max-w-[720px] overflow-y-auto border border-line bg-surface p-0 text-foreground shadow-2xl backdrop:bg-black/60"
    >
      <div
        className="relative border-b-2 px-5 pb-5 pt-6 sm:px-8 sm:pt-8"
        style={{ borderColor: c.color, background: `linear-gradient(180deg, ${c.tint} 0%, var(--surface) 100%)` }}
      >
        <form method="dialog" className="absolute right-3 top-3">
          <button
            type="submit"
            aria-label="閉じる"
            className="flex size-9 items-center justify-center text-2xl leading-none text-muted outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-foreground"
          >
            ×
          </button>
        </form>
        <div className="mb-3 flex flex-wrap items-center gap-3 pr-10">
          <span className="inline-flex items-center gap-2 text-xs font-extrabold" style={{ color: c.color }}>
            <CategoryMark c={c} />
            {c.label}
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-muted">
            <LevelDots level={term.level} />
            {LEVEL_LABEL[term.level]}
          </span>
        </div>
        <h2 id={`${dialogId(term.id)}-title`} tabIndex={-1} data-autofocus className="text-balance outline-none text-[26px] font-bold leading-tight tracking-tight [word-break:auto-phrase] sm:text-[32px]">
          {term.term}
        </h2>
        <p lang="en" className="mt-1 text-xs font-semibold uppercase tracking-[1.5px] text-muted">
          {term.en}
        </p>
      </div>

      <div className="space-y-6 px-5 py-6 sm:px-8 sm:py-7">
        <SpeechControls term={term} speech={speech} />

        <div className="border-l-4 px-4 py-4 sm:px-5" style={{ borderColor: c.color, backgroundColor: c.tint }}>
          <p className="mb-1.5 text-[11px] font-extrabold tracking-[1px]" style={{ color: c.color }}>
            ひとことで言うと
          </p>
          <p className="text-pretty text-[16px] font-bold leading-7 [word-break:auto-phrase] sm:text-[17px]">{term.short}</p>
        </div>

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
                  href={`#${r.id}`}
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
      </div>
    </dialog>
  );
}

function TermCard({ t, onOpen }: { t: GlossaryTerm; onOpen: (id: string) => void }) {
  const c = CATEGORY_BY_KEY[t.category];
  return (
    <a
      href={`#${t.id}`}
      onClick={(e) => {
        e.preventDefault();
        onOpen(t.id);
      }}
      className="selection-card group flex h-full flex-col border border-line border-l-4 bg-surface p-4"
      style={{ borderLeftColor: c.color }}
    >
      <span className="mb-1.5 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-muted">
          <LevelDots level={t.level} />
          {LEVEL_LABEL[t.level]}
        </span>
        {t.figure && <span className="border border-line px-1.5 text-[10px] font-bold text-muted">図解あり</span>}
      </span>
      <span className="text-[17px] font-bold leading-snug [word-break:auto-phrase] group-hover:text-blue">{t.term}</span>
      <span lang="en" className="mt-0.5 text-[11px] font-semibold uppercase tracking-[1px] text-muted">
        {t.en}
      </span>
      <span className="mt-2 line-clamp-2 text-sm leading-6 text-muted">{t.short}</span>
      <span className="mt-auto pt-3 text-xs font-bold text-blue">解説を見る →</span>
    </a>
  );
}

export function GlossaryDictionary({ playerIds = {} }: { playerIds?: Record<string, string> }) {
  // レベル: 画面で選んだもの > URL の ?level= > すべて
  const [chosenLevel, setLevel] = useState<LevelFilter | null>(null);
  const urlLevel = useSyncExternalStore(subscribeNoop, readUrlLevel, serverNull);
  // URL の #用語ID(最初に開く用語)。その用語の図解も描く
  const urlTerm = useSyncExternalStore(subscribeNoop, readUrlTerm, serverEmpty);
  const level: LevelFilter = chosenLevel ?? urlLevel ?? "all";
  const [query, setQuery] = useState("");
  const [opened, setOpened] = useState<ReadonlySet<string>>(() => new Set());
  const speech = useSpeech();
  const { stop } = speech;

  // ポップアップを開く(DOM操作だけ)
  const showDialog = useCallback((id: string) => {
    // 開いているポップアップがあれば閉じてから開く(関連用語から移動するとき)
    document.querySelectorAll<HTMLDialogElement>("dialog[open]").forEach((d) => {
      if (d.id !== dialogId(id)) d.close();
    });
    const el = document.getElementById(dialogId(id));
    if (el instanceof HTMLDialogElement && !el.open) {
      el.showModal();
      // 閉じるボタンではなく見出しにフォーカスを置く(開いた直後に枠線が出ないように)
      el.querySelector<HTMLElement>("[data-autofocus]")?.focus();
      el.scrollTop = 0;
      history.replaceState(null, "", `${location.pathname}${location.search}#${id}`);
    }
  }, []);

  const open = useCallback(
    (id: string) => {
      stop();
      setOpened((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
      showDialog(id);
    },
    [stop, showDialog],
  );

  const handleClose = useCallback(() => {
    stop();
    if (!document.querySelector("dialog[open]") && location.hash) {
      history.replaceState(null, "", `${location.pathname}${location.search}`);
    }
  }, [stop]);

  // 初回表示: #用語ID があればその用語を開く
  useEffect(() => {
    const hash = decodeURIComponent(location.hash.slice(1));
    if (TERM_BY_ID[hash]) showDialog(hash);
  }, [showDialog]);

  const selectLevel = (lv: LevelFilter) => {
    setLevel(lv);
    const url = lv === "all" ? location.pathname : `${location.pathname}?level=${lv}`;
    history.replaceState(null, "", url);
  };

  const q = query.trim().toLowerCase();
  const inLevel = GLOSSARY_TERMS.filter((t) => level === "all" || t.level === level);
  const visible = inLevel.filter(
    (t) => !q || t.term.toLowerCase().includes(q) || t.en.toLowerCase().includes(q) || t.short.toLowerCase().includes(q),
  );
  const sections = GLOSSARY_CATEGORIES.map((c) => ({ c, terms: visible.filter((t) => t.category === c.key) })).filter((s) => s.terms.length > 0);
  const showPositionCourt = !q && (level === "all" || level === "beginner");

  return (
    <>
      {/* レベル選択 */}
      <div role="tablist" aria-label="レベル" className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {(
          [
            { key: "all", label: "すべて", count: GLOSSARY_TERMS.length },
            ...GLOSSARY_LEVELS.map((l) => ({ key: l.key, label: l.label, count: GLOSSARY_TERMS.filter((t) => t.level === l.key).length })),
          ] as { key: LevelFilter; label: string; count: number }[]
        ).map((tab) => {
          const selected = level === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => selectLevel(tab.key)}
              className={`selection-button selection-blue flex items-center justify-between border px-4 py-3 text-left text-sm font-bold ${
                selected ? "border-foreground bg-navy text-white" : "border-line bg-surface"
              }`}
            >
              <span className="flex items-center gap-2">
                {tab.key !== "all" && <LevelDots level={tab.key} light={selected} />}
                {tab.label}
              </span>
              <span className={`text-xs tabular-nums ${selected ? "text-white/70" : "selection-blue-muted text-muted"}`}>{tab.count}語</span>
            </button>
          );
        })}
      </div>
      {level !== "all" && <p className="-mt-1 mb-4 text-sm text-muted">{GLOSSARY_LEVELS.find((l) => l.key === level)?.lead}</p>}

      {/* 検索 */}
      <div className="mb-4">
        <label className="flex items-center gap-2 border border-line bg-surface px-3 py-2.5 focus-within:border-foreground">
          <span aria-hidden className="text-muted">
            <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="8.5" cy="8.5" r="6" />
              <path d="M13 13l5 5" />
            </svg>
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="用語を探す（例：トラベリング、TS%、エプロン）"
            aria-label="用語を検索"
            className="w-full bg-transparent text-sm outline-none"
          />
        </label>
      </div>

      {/* 分類の目次(押すとその分類の見出しへ移動) */}
      <nav aria-label="分類" className="sticky top-0 z-10 -mx-4 mb-8 border-y border-line bg-background/95 px-4 py-2.5 backdrop-blur sm:mx-0 sm:border-x sm:px-3">
        <p className="mb-1.5 text-[11px] font-extrabold tracking-[1px] text-muted">分類から探す</p>
        {GLOSSARY_CATEGORY_GROUPS.map((g) => (
        // 分類が多いので、まとまりごとに1行で横にスクロールさせる(見出しに固定する目次の高さを抑えるため)
        <div key={g.key} className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="sticky left-0 z-[1] shrink-0 bg-background/95 pr-1 text-[11px] font-extrabold text-muted">
            <span className="sm:hidden">{g.short}</span>
            <span className="hidden sm:inline">{g.label}</span>
          </span>
          {GLOSSARY_CATEGORIES.filter((c) => c.group === g.key).map((c) => {
            const count = visible.filter((t) => t.category === c.key).length;
            return (
              <a
                key={c.key}
                href={`#${sectionId(c.key)}`}
                aria-disabled={count === 0}
                className={`inline-flex shrink-0 items-center gap-1.5 border bg-surface py-1 pl-1 pr-2.5 text-xs font-bold transition-colors hover:border-foreground ${
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
        </div>
        ))}
      </nav>

      {sections.length === 0 && <p className="text-sm text-muted">「{query}」に当てはまる用語はありません。</p>}

      <div className="space-y-12">
        {sections.map(({ c, terms }, i) => (
          <Fragment key={c.key}>
          {(i === 0 || sections[i - 1].c.group !== c.group) && (
            <div id={groupId(c.group)} className="scroll-mt-40 border-t-4 border-foreground pt-3">
              <p className="text-[11px] font-extrabold tracking-[2px] text-muted">CATEGORY</p>
              <h2 className="text-2xl font-black tracking-tight sm:text-3xl">{GROUP_LABEL[c.group]}</h2>
              {c.group === "slang" && (
                <p className="mt-1 text-sm text-muted">実況やSNSで見かけるスラング、決めポーズ、選手のニックネームの由来など。</p>
              )}
            </div>
          )}
          <section id={sectionId(c.key)} aria-labelledby={`${sectionId(c.key)}-title`} className="scroll-mt-40">
            <div className="mb-4 flex items-center gap-3 border-b-2 pb-3" style={{ borderColor: c.color }}>
              <CategoryMark c={c} size="lg" />
              <div className="min-w-0">
                <h2 id={`${sectionId(c.key)}-title`} className="text-xl font-bold tracking-tight sm:text-2xl">
                  {c.label}
                  <span className="ml-2 text-sm font-semibold text-muted tabular-nums">{terms.length}語</span>
                </h2>
                <p className="mt-0.5 text-sm text-muted">{c.lead}</p>
              </div>
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
                  <h3 className="mb-3 flex items-center gap-2 text-base font-bold">
                    <span aria-hidden className="inline-block h-4 w-1" style={{ backgroundColor: c.color }} />
                    {group}
                    <span className="text-xs font-semibold text-muted tabular-nums">{groupTerms.length}語</span>
                  </h3>
                )}
                <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {groupTerms.map((t) => (
                    <li key={t.id}>
                      <TermCard t={t} onOpen={open} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
          </Fragment>
        ))}
      </div>

      {/* 全用語の解説(ポップアップ)。閉じた状態でもHTMLに含まれる */}
      {GLOSSARY_TERMS.map((t) => (
        <TermDialog
          key={t.id}
          term={t}
          onClose={handleClose}
          onOpen={open}
          speech={speech}
          showFigure={opened.has(t.id) || urlTerm === t.id}
          playerIds={playerIds}
        />
      ))}
    </>
  );
}
