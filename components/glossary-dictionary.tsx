"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  GLOSSARY_CATEGORIES,
  GLOSSARY_LEVELS,
  GLOSSARY_TERMS,
  type GlossaryCategory,
  type GlossaryLevel,
  type GlossaryTerm,
} from "@/lib/glossary-terms";

// NBA用語辞典の本体。
// ・用語カードをクリックすると、その用語の解説をポップアップ(<dialog>)で開く。
// ・全用語の解説はサーバー側でHTMLに含める(閉じた<dialog>の中身として出力するので、検索エンジンも読める)。
// ・URL の #用語ID で直接開ける(共有用)。?level=beginner などでレベルを選んだ状態で開ける。
// ・音声読み上げはブラウザ標準の speechSynthesis(費用なし)。「ゆっくり」「ふつう」の2速度。

const CATEGORY_BY_KEY = Object.fromEntries(GLOSSARY_CATEGORIES.map((c) => [c.key, c])) as Record<
  GlossaryCategory,
  (typeof GLOSSARY_CATEGORIES)[number]
>;
const LEVEL_LABEL = Object.fromEntries(GLOSSARY_LEVELS.map((l) => [l.key, l.label])) as Record<GlossaryLevel, string>;
const TERM_IDS = new Set(GLOSSARY_TERMS.map((t) => t.id));
const dialogId = (id: string) => `term-${id}`;

type LevelFilter = GlossaryLevel | "all";
type Speed = "slow" | "normal";
const RATES: Record<Speed, number> = { slow: 0.75, normal: 1.05 };

// useSyncExternalStore 用(表示中に変わらない値を読むだけなので購読は不要)
const subscribeNoop = () => () => {};
const readSpeechSupported = () => "speechSynthesis" in window;
const readUrlLevel = (): LevelFilter | null => {
  const lv = new URLSearchParams(location.search).get("level");
  return lv === "beginner" || lv === "intermediate" || lv === "advanced" ? lv : null;
};
const serverNull = () => null;
const serverFalse = () => false;

// 読み上げ用に、記号や略語を読みやすい形に置き換える。
function toSpeechText(t: GlossaryTerm): string {
  const parts = [t.yomi ?? t.term, "。", t.short];
  if (t.detail) parts.push(t.detail);
  if (t.example) parts.push("NBAでの実例。", t.example);
  return parts
    .join("")
    .replace(/＋\/−|\+\/-/g, "プラスマイナス")
    .replace(/＆/g, "アンド")
    .replace(/3P/g, "スリーポイント")
    .replace(/eFG%/g, "実効フィールドゴール率")
    .replace(/FG%/g, "フィールドゴール成功率")
    .replace(/TS%/g, "トゥルーシューティング")
    .replace(/USG%/g, "ユーセージ率")
    .replace(/(\d)-(\d{2})シーズン/g, "$1、$2シーズン")
    .replace(/[（(]/g, "、")
    .replace(/[）)]/g, "、");
}

// 日本語の声を選ぶ。自然に聞こえやすい声(Edge の Natural/Online、Google、iPhone の Kyoko など)を優先する。
function pickJapaneseVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices().filter((v) => v.lang.replace("_", "-").toLowerCase().startsWith("ja"));
  if (voices.length === 0) return null;
  const preferred = [/Natural/i, /Online/i, /Nanami/i, /Google/i, /Kyoko/i, /O-ren/i];
  for (const re of preferred) {
    const v = voices.find((voice) => re.test(voice.name));
    if (v) return v;
  }
  return voices[0];
}

function useSpeech() {
  const supported = useSyncExternalStore(subscribeNoop, readSpeechSupported, serverFalse);
  const [speaking, setSpeaking] = useState<{ id: string; speed: Speed } | null>(null);
  const runRef = useRef(0);

  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    // 一部のブラウザ(Chrome など)は声の一覧を後から読み込むため、先に読み込みを始めておく
    window.speechSynthesis.getVoices();
    return () => window.speechSynthesis.cancel();
  }, []);

  const stop = useCallback(() => {
    runRef.current += 1;
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    setSpeaking(null);
  }, []);

  const speak = useCallback(
    (term: GlossaryTerm, speed: Speed) => {
      if (!("speechSynthesis" in window)) return;
      const synth = window.speechSynthesis;
      synth.cancel();
      const run = ++runRef.current;
      const voice = pickJapaneseVoice();
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
    },
    [],
  );

  return { supported, speaking, speak, stop };
}

function CategoryBadge({ category }: { category: GlossaryCategory }) {
  const c = CATEGORY_BY_KEY[category];
  return (
    <span
      className="inline-flex items-center gap-1.5 border px-2 py-0.5 text-[11px] font-extrabold"
      style={{ color: c.color, borderColor: c.color, backgroundColor: c.tint }}
    >
      <span aria-hidden className="inline-block size-1.5 rounded-full" style={{ backgroundColor: c.color }} />
      {c.label}
    </span>
  );
}

function LevelBadge({ level }: { level: GlossaryLevel }) {
  const dots = level === "beginner" ? 1 : level === "intermediate" ? 2 : 3;
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-muted">
      <span aria-hidden className="inline-flex gap-0.5">
        {[1, 2, 3].map((n) => (
          <span key={n} className={`inline-block size-1.5 ${n <= dots ? "bg-foreground" : "bg-line"}`} />
        ))}
      </span>
      {LEVEL_LABEL[level]}
    </span>
  );
}

function SpeechControls({
  term,
  speech,
}: {
  term: GlossaryTerm;
  speech: ReturnType<typeof useSpeech>;
}) {
  if (!speech.supported) return null;
  const active = speech.speaking?.id === term.id ? speech.speaking.speed : null;
  const button = (speed: Speed, label: string) => (
    <button
      type="button"
      onClick={() => (active === speed ? speech.stop() : speech.speak(term, speed))}
      aria-pressed={active === speed}
      className={`inline-flex items-center gap-1.5 border px-3 py-1.5 text-xs font-bold transition-colors ${
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
    </div>
  );
}

function TermDialog({
  term,
  onClose,
  speech,
}: {
  term: GlossaryTerm;
  onClose: () => void;
  speech: ReturnType<typeof useSpeech>;
}) {
  const c = CATEGORY_BY_KEY[term.category];
  return (
    <dialog
      id={dialogId(term.id)}
      aria-labelledby={`${dialogId(term.id)}-title`}
      onClose={onClose}
      onClick={(e) => {
        // 背景(ダイアログの外側)をクリックしたら閉じる
        if (e.target === e.currentTarget) e.currentTarget.close();
      }}
      className="glossary-dialog m-auto max-h-[88dvh] w-[calc(100%-24px)] max-w-[680px] overflow-y-auto border border-line bg-surface p-0 text-foreground shadow-2xl backdrop:bg-black/60"
    >
      <div
        className="relative border-b px-5 pb-5 pt-6 sm:px-8 sm:pt-8"
        style={{ borderColor: c.color, background: `linear-gradient(180deg, ${c.tint} 0%, var(--surface) 100%)` }}
      >
        <form method="dialog" className="absolute right-3 top-3">
          <button
            type="submit"
            aria-label="閉じる"
            className="flex size-9 items-center justify-center text-2xl leading-none text-muted hover:text-foreground"
          >
            ×
          </button>
        </form>
        <div className="mb-3 flex flex-wrap items-center gap-3 pr-10">
          <CategoryBadge category={term.category} />
          <LevelBadge level={term.level} />
        </div>
        <h2
          id={`${dialogId(term.id)}-title`}
          className="text-balance text-[26px] font-bold leading-tight tracking-tight [word-break:auto-phrase] sm:text-[32px]"
        >
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

        {term.detail && (
          <div>
            <p className="mb-2 text-[11px] font-extrabold tracking-[1px] text-muted">詳しい解説</p>
            <p className="text-pretty text-[15px] leading-8 [word-break:auto-phrase]">{term.detail}</p>
          </div>
        )}

        {term.example && (
          <div>
            <p className="mb-2 text-[11px] font-extrabold tracking-[1px] text-muted">NBAでの実例</p>
            <p className="text-pretty border-l-2 border-line pl-4 text-[15px] leading-8 text-muted [word-break:auto-phrase]">
              {term.example}
            </p>
          </div>
        )}

        {term.category === "injury" && (
          <p className="text-xs leading-6 text-muted">
            ※ 一般的な意味の説明です。選手ごとの状態・診断や復帰時期は、チームやNBAの発表を確認してください。
          </p>
        )}

        {term.href && (
          <Link
            href={term.href}
            className="inline-block border border-blue px-4 py-2 text-sm font-bold text-blue hover:bg-blue hover:text-white"
          >
            詳しく読む：{term.linkLabel} →
          </Link>
        )}
      </div>
    </dialog>
  );
}

export function GlossaryDictionary() {
  // レベル: 画面で選んだもの > URL の ?level= > すべて
  const [chosenLevel, setLevel] = useState<LevelFilter | null>(null);
  const urlLevel = useSyncExternalStore(subscribeNoop, readUrlLevel, serverNull);
  const level: LevelFilter = chosenLevel ?? urlLevel ?? "all";
  const [category, setCategory] = useState<GlossaryCategory | "all">("all");
  const speech = useSpeech();
  const { stop } = speech;

  const open = useCallback((id: string) => {
    const el = document.getElementById(dialogId(id));
    if (el instanceof HTMLDialogElement && !el.open) {
      el.showModal();
      history.replaceState(null, "", `${location.pathname}${location.search}#${id}`);
    }
  }, []);

  const handleClose = useCallback(() => {
    stop();
    if (location.hash) history.replaceState(null, "", `${location.pathname}${location.search}`);
  }, [stop]);

  // 初回表示: #用語ID があればその用語を開く
  useEffect(() => {
    const hash = decodeURIComponent(location.hash.slice(1));
    if (TERM_IDS.has(hash)) open(hash);
  }, [open]);

  const selectLevel = (lv: LevelFilter) => {
    setLevel(lv);
    const url = lv === "all" ? location.pathname : `${location.pathname}?level=${lv}`;
    history.replaceState(null, "", url);
  };

  const inLevel = GLOSSARY_TERMS.filter((t) => level === "all" || t.level === level);
  const visible = inLevel.filter((t) => category === "all" || t.category === category);
  const levelsToShow = level === "all" ? GLOSSARY_LEVELS : GLOSSARY_LEVELS.filter((l) => l.key === level);

  return (
    <>
      {/* レベル選択 */}
      <div role="tablist" aria-label="レベル" className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {(
          [
            { key: "all", label: "すべて", count: GLOSSARY_TERMS.length },
            ...GLOSSARY_LEVELS.map((l) => ({
              key: l.key,
              label: l.label,
              count: GLOSSARY_TERMS.filter((t) => t.level === l.key).length,
            })),
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
              className={`flex items-center justify-between border px-4 py-3 text-left text-sm font-bold transition-colors ${
                selected ? "border-foreground bg-navy text-white" : "border-line bg-surface hover:border-foreground"
              }`}
            >
              <span className="flex items-center gap-2">
                {tab.key !== "all" && (
                  <span aria-hidden className="inline-flex gap-0.5">
                    {[1, 2, 3].map((n) => {
                      const dots = tab.key === "beginner" ? 1 : tab.key === "intermediate" ? 2 : 3;
                      return (
                        <span
                          key={n}
                          className={`inline-block size-1.5 ${
                            n <= dots ? (selected ? "bg-gold" : "bg-foreground") : selected ? "bg-white/30" : "bg-line"
                          }`}
                        />
                      );
                    })}
                  </span>
                )}
                {tab.label}
              </span>
              <span className={`text-xs tabular-nums ${selected ? "text-white/70" : "text-muted"}`}>{tab.count}</span>
            </button>
          );
        })}
      </div>

      {/* 分類の絞り込み */}
      <div aria-label="分類" className="mb-8 flex flex-wrap gap-2">
        {[{ key: "all" as const, label: "すべての分類", color: "var(--foreground)" }, ...GLOSSARY_CATEGORIES].map((c) => {
          const count = inLevel.filter((t) => c.key === "all" || t.category === c.key).length;
          if (count === 0) return null;
          const selected = category === c.key;
          return (
            <button
              key={c.key}
              type="button"
              aria-pressed={selected}
              onClick={() => setCategory(c.key)}
              className="border px-3 py-1.5 text-xs font-bold transition-colors"
              style={
                selected
                  ? { backgroundColor: c.color, borderColor: c.color, color: "#fff" }
                  : { borderColor: "var(--line)", backgroundColor: "var(--surface)" }
              }
            >
              {c.label}
              <span className="ml-1.5 tabular-nums opacity-70">{count}</span>
            </button>
          );
        })}
      </div>

      {visible.length === 0 && <p className="text-sm text-muted">この条件に当てはまる用語はありません。</p>}

      <div className="space-y-10">
        {levelsToShow.map((lv) => {
          const terms = visible.filter((t) => t.level === lv.key);
          if (terms.length === 0) return null;
          return (
            <section key={lv.key} aria-labelledby={`level-${lv.key}`}>
              <div className="mb-4 border-b-2 border-foreground pb-2">
                <h2 id={`level-${lv.key}`} className="text-xl font-bold tracking-tight">
                  {lv.label}
                  <span className="ml-2 text-sm font-semibold text-muted tabular-nums">{terms.length}語</span>
                </h2>
                <p className="mt-1 text-sm text-muted">{lv.lead}</p>
              </div>
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {terms.map((t) => {
                  const c = CATEGORY_BY_KEY[t.category];
                  return (
                    <li key={t.id}>
                      <a
                        href={`#${t.id}`}
                        onClick={(e) => {
                          e.preventDefault();
                          open(t.id);
                        }}
                        className="group flex h-full flex-col border border-line border-t-[3px] bg-surface p-4 transition-shadow hover:shadow-md"
                        style={{ borderTopColor: c.color }}
                      >
                        <span className="mb-2 text-[11px] font-extrabold" style={{ color: c.color }}>
                          {c.label}
                        </span>
                        <span className="text-[17px] font-bold leading-snug [word-break:auto-phrase] group-hover:text-blue">
                          {t.term}
                        </span>
                        <span lang="en" className="mt-0.5 text-[11px] font-semibold uppercase tracking-[1px] text-muted">
                          {t.en}
                        </span>
                        <span className="mt-2 line-clamp-2 text-sm leading-6 text-muted">{t.short}</span>
                        <span className="mt-auto pt-3 text-xs font-bold text-blue">解説を見る →</span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>

      {/* 全用語の解説(ポップアップ)。閉じた状態でもHTMLに含まれる */}
      {GLOSSARY_TERMS.map((t) => (
        <TermDialog key={t.id} term={t} onClose={handleClose} speech={speech} />
      ))}
    </>
  );
}
