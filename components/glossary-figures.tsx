"use client";

import { useEffect, useRef, type ReactNode } from "react";
import type { GlossaryFigure } from "@/lib/glossary-terms";
import { SYSTEM_LEVELS_2026_27 } from "@/lib/guide-official";

// NBA用語辞典の図解。すべて当サイトで描いたSVG(写真・外部画像は使わない)。
// ・コートはハーフコート(実寸の1フィート=10単位。幅500×奥行470、ゴールは上側)。
// ・動く図は SVG の animate(SMIL)で、5秒前後でくり返す。「動きを減らす」設定の端末では止めて表示する。
// ・青丸(数字)=攻撃の選手、赤丸=守備の選手、オレンジ=ボール。

const C = {
  floor: "#f7efe2",
  line: "#a8987f",
  paint: "#efdcc4",
  off: "#1f63e9",
  def: "#c8323c",
  ball: "#f08a24",
  ok: "#13866f",
  ng: "#c8323c",
  text: "#101827",
  muted: "#647184",
  highlight: "rgba(31,99,233,0.14)",
};
const RIM = { x: 250, y: 52 };
const DUR = "5s";

// ── 共通部品 ──────────────────────────────────────────

function useReducedMotionPause() {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const svg = ref.current;
    if (!svg) return;
    // ブラウザによっては、ページ読み込み時(ハイドレーション前後)に作られた animate が動かないことがあるため、
    // 同じ要素を入れ直して確実に動かす
    svg.querySelectorAll("animate, animateTransform, animateMotion").forEach((a) => a.replaceWith(a.cloneNode(true)));
    if (typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => (mq.matches ? svg.pauseAnimations() : svg.unpauseAnimations());
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return ref;
}

function Svg({ viewBox, label, children }: { viewBox: string; label: string; children: ReactNode }) {
  const ref = useReducedMotionPause();
  return (
    <svg ref={ref} viewBox={viewBox} role="img" aria-label={label} className="block h-auto w-full" style={{ fontFamily: "inherit" }}>
      <defs>
        <marker id="gf-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill={C.text} />
        </marker>
        <marker id="gf-arrow-off" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill={C.off} />
        </marker>
        <marker id="gf-arrow-def" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill={C.def} />
        </marker>
        <marker id="gf-arrow-ball" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill={C.ball} />
        </marker>
      </defs>
      {children}
    </svg>
  );
}

// ハーフコートの線。highlight で一部を色付けする
function Court({ paint = false, arc = false, children }: { paint?: boolean; arc?: boolean; children?: ReactNode }) {
  // スリーポイントライン: コーナーは x=30/470 の直線(y=0〜142)、その先はゴール中心から半径237.5の弧
  const arcPath = "M30,0 L30,142 A237.5,237.5 0 0 0 470,142 L470,0";
  return (
    <g>
      <rect x="0" y="0" width="500" height="470" fill={C.floor} stroke={C.line} strokeWidth="3" />
      <rect x="170" y="0" width="160" height="190" fill={paint ? "rgba(200,50,60,0.22)" : C.paint} stroke={C.line} strokeWidth="3" />
      <circle cx="250" cy="190" r="60" fill="none" stroke={C.line} strokeWidth="3" />
      <path d="M210,52 A40,40 0 0 0 290,52" fill="none" stroke={C.line} strokeWidth="2.5" />
      <path d={arcPath} fill="none" stroke={arc ? C.off : C.line} strokeWidth={arc ? 7 : 3} />
      <line x1="220" y1="40" x2="280" y2="40" stroke={C.text} strokeWidth="4" />
      <circle cx={RIM.x} cy={RIM.y} r="8" fill="none" stroke={C.ball} strokeWidth="3.5" />
      <path d="M190,470 A60,60 0 0 1 310,470" fill="none" stroke={C.line} strokeWidth="3" />
      {children}
    </g>
  );
}

function Player({ n, color = C.off, label }: { n: string; color?: string; label?: string }) {
  return (
    <g>
      <circle r="22" fill={color} stroke="#fff" strokeWidth="3" />
      <text textAnchor="middle" dy="8" fontSize="22" fontWeight="800" fill="#fff">
        {n}
      </text>
      {label && (
        <text textAnchor="middle" y="44" fontSize="17" fontWeight="800" fill={color}>
          {label}
        </text>
      )}
    </g>
  );
}
const O = ({ x, y, n, label }: { x: number; y: number; n: string; label?: string }) => (
  <g transform={`translate(${x} ${y})`}>
    <Player n={n} label={label} />
  </g>
);
const D = ({ x, y, n = "D", label }: { x: number; y: number; n?: string; label?: string }) => (
  <g transform={`translate(${x} ${y})`}>
    <Player n={n} color={C.def} label={label} />
  </g>
);
const Ball = ({ x = 0, y = 0 }: { x?: number; y?: number }) => (
  <circle cx={x} cy={y} r="10" fill={C.ball} stroke="#8a4a0e" strokeWidth="2" />
);

// points の位置を、times(0〜1)のタイミングで順に動く。子要素は (0,0) を中心に描く
function Mover({ points, times, children, dur = DUR }: { points: [number, number][]; times: number[]; children: ReactNode; dur?: string }) {
  const values = points.map(([x, y]) => `${x} ${y}`).join(";");
  return (
    <g transform={`translate(${points[0][0]} ${points[0][1]})`}>
      <animateTransform attributeName="transform" type="translate" values={values} keyTimes={times.join(";")} dur={dur} repeatCount="indefinite" />
      {children}
    </g>
  );
}

// 一定の時間帯(from〜to、0〜1)だけ表示する(矢印やラベルを順番に見せる)
function Appear({ from, to, children, dur = DUR }: { from: number; to: number; children: ReactNode; dur?: string }) {
  const { values, keyTimes } = windowKeys(from, to);
  return (
    <g opacity={from <= 0 ? 1 : 0}>
      <animate attributeName="opacity" calcMode="discrete" values={values} keyTimes={keyTimes} dur={dur} repeatCount="indefinite" />
      {children}
    </g>
  );
}
// discrete アニメーション用: from〜to の間だけ 1、それ以外は 0
function windowKeys(from: number, to: number, off = "0") {
  // keyTimes は 0 で始まり 1 で終わる形にする(ブラウザによっては 1 で終わらないと動かない)
  if (from <= 0 && to >= 1) return { values: "1;1", keyTimes: "0;1" };
  if (from <= 0) return { values: `1;${off};${off}`, keyTimes: `0;${to.toFixed(3)};1` };
  if (to >= 1) return { values: `${off};1;1`, keyTimes: `0;${from.toFixed(3)};1` };
  return { values: `${off};1;${off};${off}`, keyTimes: `0;${from.toFixed(3)};${to.toFixed(3)};1` };
}

function Label({ x, y, children, color = C.text, size = 19, anchor = "middle" }: { x: number; y: number; children: ReactNode; color?: string; size?: number; anchor?: "start" | "middle" | "end" }) {
  return (
    <text x={x} y={y} textAnchor={anchor} fontSize={size} fontWeight="800" fill={color} stroke="#fff" strokeWidth="5" paintOrder="stroke">
      {children}
    </text>
  );
}

function Arrow({ d, color = "text", dashed = false, width = 3.5 }: { d: string; color?: "text" | "off" | "def" | "ball"; dashed?: boolean; width?: number }) {
  const stroke = color === "off" ? C.off : color === "def" ? C.def : color === "ball" ? C.ball : C.text;
  const marker = color === "text" ? "gf-arrow" : `gf-arrow-${color}`;
  return <path d={d} fill="none" stroke={stroke} strokeWidth={width} strokeDasharray={dashed ? "9 7" : undefined} markerEnd={`url(#${marker})`} />;
}

const COURT_VIEW = "-24 -14 548 500";

// ── 各図 ──────────────────────────────────────────

function CourtAreas() {
  return (
    <Svg viewBox={COURT_VIEW} label="コートの各エリア">
      <Court paint arc />
      <Label x={250} y={122} color={C.def}>ペイント</Label>
      <Label x={250} y={146} size={15} color={C.def}>（3秒ルールのエリア）</Label>
      <Label x={250} y={214}>フリースローライン</Label>
      <Label x={250} y={318} color={C.off}>スリーポイントライン</Label>
      <Label x={250} y={340} size={16} color={C.off}>正面は約7.24m</Label>
      <Label x={62} y={80} size={16} color={C.off} anchor="start">コーナー</Label>
      <Label x={62} y={100} size={14} color={C.off} anchor="start">約6.71m</Label>
      <Label x={438} y={80} size={16} color={C.off} anchor="end">コーナー</Label>
      <Label x={438} y={100} size={14} color={C.off} anchor="end">約6.71m</Label>
      <Label x={250} y={430} color={C.muted} size={16}>センターライン方向</Label>
    </Svg>
  );
}

function Positions() {
  return (
    <Svg viewBox={COURT_VIEW} label="5つのポジションの基本の立ち位置">
      <Court />
      <O x={250} y={340} n="1" label="PG" />
      <O x={430} y={250} n="2" label="SG" />
      <O x={70} y={250} n="3" label="SF" />
      <O x={350} y={150} n="4" label="PF" />
      <O x={200} y={95} n="5" label="C" />
    </Svg>
  );
}

function Scoring() {
  return (
    <Svg viewBox={COURT_VIEW} label="場所による得点の違い">
      <Court arc />
      <g transform="translate(250 380)">
        <circle r="26" fill={C.off} />
        <text textAnchor="middle" dy="9" fontSize="26" fontWeight="900" fill="#fff">3</text>
      </g>
      <Label x={250} y={428} color={C.off}>ラインの外 → 3点</Label>
      <g transform="translate(370 120)">
        <circle r="26" fill={C.ok} />
        <text textAnchor="middle" dy="9" fontSize="26" fontWeight="900" fill="#fff">2</text>
      </g>
      <Label x={370} y={168} color={C.ok}>ラインの内側 → 2点</Label>
      <g transform="translate(250 190)">
        <circle r="26" fill={C.ball} />
        <text textAnchor="middle" dy="9" fontSize="26" fontWeight="900" fill="#fff">1</text>
      </g>
      <Label x={250} y={238} color="#a8560e">フリースロー → 1点</Label>
    </Svg>
  );
}

function ThreeSeconds() {
  return (
    <Svg viewBox={COURT_VIEW} label="3秒ルール">
      <Court paint />
      <O x={250} y={110} n="5" />
      <g transform="translate(330 70)">
        <rect x="-4" y="-30" width="120" height="42" rx="6" fill={C.text} />
      </g>
      <Label x={250} y={240} color={C.def}>ペイントに3秒を超えて</Label>
      <Label x={250} y={264} color={C.def}>留まると反則</Label>
      <Label x={250} y={330} size={16} color={C.muted}>守備側も「ディフェンス3秒」がある</Label>
      <Seconds />
    </Svg>
  );
}
// 「1→2→3」と数える表示
function Seconds() {
  return (
    <g transform="translate(386 70)">
      {["1", "2", "3"].map((s, i) => {
        const k = windowKeys(i / 3, (i + 1) / 3);
        return (
          <text key={s} textAnchor="middle" fontSize="26" fontWeight="900" fill={i === 2 ? "#ffb3b8" : "#fff"} opacity={i === 0 ? 1 : 0}>
            {s}
            <animate attributeName="opacity" calcMode="discrete" values={k.values} keyTimes={k.keyTimes} dur="3s" repeatCount="indefinite" />
          </text>
        );
      })}
    </g>
  );
}

function ShotClock() {
  return (
    <Svg viewBox="0 0 520 230" label="ショットクロック">
      <rect x="0" y="0" width="520" height="230" fill="#fff" />
      <text x="20" y="34" fontSize="19" fontWeight="800" fill={C.text}>攻撃開始：24秒</text>
      <rect x="20" y="48" width="480" height="30" fill="#eef1f5" />
      <rect x="20" y="48" width="480" height="30" fill={C.off}>
        <animate attributeName="width" values="480;0;0" keyTimes="0;0.9;1" dur="6s" repeatCount="indefinite" />
      </rect>
      {[24, 18, 12, 6, 0].map((s, i) => (
        <text key={s} x={20 + i * 120} y="100" textAnchor={i === 0 ? "start" : i === 4 ? "end" : "middle"} fontSize="15" fontWeight="700" fill={C.muted}>
          {s}秒
        </text>
      ))}
      <text x="500" y="128" textAnchor="end" fontSize="16" fontWeight="800" fill={C.ng}>0秒になるとバイオレーション（相手ボール）</text>
      <text x="20" y="168" fontSize="19" fontWeight="800" fill={C.text}>オフェンスリバウンドを取ったら：14秒から</text>
      <rect x="20" y="182" width="480" height="30" fill="#eef1f5" />
      <rect x="20" y="182" width="280" height="30" fill={C.ok} />
      <text x="310" y="203" fontSize="15" fontWeight="700" fill={C.muted}>← 14秒にリセット</text>
    </Svg>
  );
}

function Quarters() {
  const seg = (x: number, label: string, w = 100, fill: string = C.off) => (
    <g key={label}>
      <rect x={x} y="40" width={w} height="44" fill={fill} />
      <text x={x + w / 2} y="68" textAnchor="middle" fontSize="18" fontWeight="800" fill="#fff">
        {label}
      </text>
    </g>
  );
  return (
    <Svg viewBox="0 0 520 170" label="試合時間の流れ">
      <rect width="520" height="170" fill="#fff" />
      {seg(4, "第1Q")}
      {seg(108, "第2Q")}
      {seg(244, "第3Q")}
      {seg(348, "第4Q")}
      <rect x="452" y="40" width="64" height="44" fill="#fff" stroke={C.def} strokeWidth="3" strokeDasharray="6 5" />
      <text x="484" y="68" textAnchor="middle" fontSize="17" fontWeight="800" fill={C.def}>OT</text>
      <text x="226" y="30" textAnchor="middle" fontSize="15" fontWeight="700" fill={C.muted}>ハーフタイム</text>
      <line x1="226" y1="38" x2="226" y2="88" stroke={C.muted} strokeWidth="2" strokeDasharray="4 4" />
      <text x="226" y="118" textAnchor="middle" fontSize="17" fontWeight="800" fill={C.text}>各12分 × 4 ＝ 48分</text>
      <text x="484" y="118" textAnchor="middle" fontSize="15" fontWeight="800" fill={C.def}>同点なら</text>
      <text x="484" y="140" textAnchor="middle" fontSize="15" fontWeight="800" fill={C.def}>5分ずつ</text>
    </Svg>
  );
}

function Traveling() {
  const steps = [
    { x: 60, label: "ドリブル", sub: "" },
    { x: 180, label: "ギャザー", sub: "ボールをつかむ" },
    { x: 290, label: "1歩", sub: "" },
    { x: 380, label: "2歩", sub: "→ シュートかパス" },
  ];
  return (
    <Svg viewBox="0 0 520 220" label="トラベリングの歩数">
      <rect width="520" height="220" fill="#fff" />
      {steps.map((s, i) => (
        <g key={s.label} opacity="0.25">
          <animate attributeName="opacity" calcMode="discrete" values={windowKeys(i * 0.2 + 0.02, 0.95, "0.25").values} keyTimes={windowKeys(i * 0.2 + 0.02, 0.95, "0.25").keyTimes} dur={DUR} repeatCount="indefinite" />
          {i === 0 ? (
            <Ball x={s.x} y={90} />
          ) : (
            <ellipse cx={s.x} cy={90} rx="16" ry="26" fill={i === 1 ? C.ball : C.off} transform={`rotate(${i % 2 ? -12 : 12} ${s.x} 90)`} />
          )}
          <text x={s.x} y="150" textAnchor="middle" fontSize="19" fontWeight="800" fill={C.text}>
            {s.label}
          </text>
          {s.sub && (
            <text x={s.x} y="174" textAnchor="middle" fontSize="14" fontWeight="700" fill={C.muted}>
              {s.sub}
            </text>
          )}
        </g>
      ))}
      <g opacity="0">
        <animate attributeName="opacity" calcMode="discrete" values="0;1;0;0" keyTimes="0;0.8;0.95;1" dur={DUR} repeatCount="indefinite" />
        <ellipse cx="470" cy="90" rx="16" ry="26" fill="none" stroke={C.ng} strokeWidth="4" strokeDasharray="6 4" />
        <text x="470" y="150" textAnchor="middle" fontSize="19" fontWeight="900" fill={C.ng}>3歩目</text>
        <text x="470" y="174" textAnchor="middle" fontSize="14" fontWeight="800" fill={C.ng}>トラベリング</text>
      </g>
    </Svg>
  );
}

function Goaltending() {
  const arc = "M40,250 Q260,-40 430,120";
  return (
    <Svg viewBox="0 0 520 280" label="ゴールテンディングになるタイミング">
      <rect width="520" height="280" fill="#fff" />
      <line x1="470" y1="40" x2="470" y2="200" stroke={C.text} strokeWidth="6" />
      <line x1="430" y1="130" x2="470" y2="130" stroke={C.ball} strokeWidth="5" />
      <path d="M40,250 Q150,105 245,105" fill="none" stroke={C.ok} strokeWidth="6" strokeDasharray="10 7" />
      <path d="M245,105 Q350,105 430,120" fill="none" stroke={C.ng} strokeWidth="6" strokeDasharray="10 7" />
      <circle r="12" fill={C.ball} stroke="#8a4a0e" strokeWidth="2">
        <animateMotion path={arc} dur="3s" repeatCount="indefinite" />
      </circle>
      <text x="110" y="120" textAnchor="middle" fontSize="18" fontWeight="800" fill={C.ok}>上がっている途中</text>
      <text x="110" y="144" textAnchor="middle" fontSize="16" fontWeight="800" fill={C.ok}>→ ブロックできる</text>
      <text x="350" y="70" textAnchor="middle" fontSize="18" fontWeight="800" fill={C.ng}>落ち始めたら</text>
      <text x="350" y="94" textAnchor="middle" fontSize="16" fontWeight="800" fill={C.ng}>→ 触ると反則</text>
      <text x="470" y="230" textAnchor="middle" fontSize="15" fontWeight="700" fill={C.muted}>ボードとリング</text>
    </Svg>
  );
}

function Bonus() {
  return (
    <Svg viewBox="0 0 520 190" label="チームファウルとボーナス">
      <rect width="520" height="190" fill="#fff" />
      <text x="20" y="34" fontSize="18" fontWeight="800" fill={C.text}>1クォーターのチームファウル</text>
      {[1, 2, 3, 4, 5].map((n, i) => (
        <g key={n} transform={`translate(${30 + i * 96} 56)`}>
          <rect width="80" height="64" rx="8" fill={n === 5 ? C.ng : "#eef1f5"} stroke={n === 5 ? C.ng : C.line} strokeWidth="2" />
          <text x="40" y="44" textAnchor="middle" fontSize="28" fontWeight="900" fill={n === 5 ? "#fff" : C.text}>
            {n}
          </text>
        </g>
      ))}
      <text x="454" y="148" textAnchor="middle" fontSize="17" fontWeight="900" fill={C.ng}>ここから</text>
      <text x="454" y="172" textAnchor="middle" fontSize="17" fontWeight="900" fill={C.ng}>フリースロー2本</text>
      <text x="20" y="160" fontSize="15" fontWeight="700" fill={C.muted}>クォーターごとに0から数え直し</text>
    </Svg>
  );
}

function Backcourt() {
  return (
    <Svg viewBox="0 0 560 270" label="バックコート・バイオレーション">
      <rect x="10" y="20" width="540" height="200" fill={C.floor} stroke={C.line} strokeWidth="3" />
      <line x1="280" y1="20" x2="280" y2="220" stroke={C.line} strokeWidth="3" />
      <circle cx="280" cy="120" r="34" fill="none" stroke={C.line} strokeWidth="3" />
      <circle cx="530" cy="120" r="8" fill="none" stroke={C.ball} strokeWidth="3.5" />
      <text x="145" y="52" textAnchor="middle" fontSize="18" fontWeight="800" fill={C.muted}>バックコート（自陣）</text>
      <text x="415" y="52" textAnchor="middle" fontSize="18" fontWeight="800" fill={C.off}>フロントコート（攻める側）</text>
      <Arrow d="M70,120 L300,120" color="off" width={5} />
      <text x="185" y="104" textAnchor="middle" fontSize="18" fontWeight="900" fill={C.off}>8秒以内に越える</text>
      <Arrow d="M340,170 L230,170" color="def" dashed width={4} />
      <text x="285" y="204" textAnchor="middle" fontSize="16" fontWeight="900" fill={C.ng}>越えた後に戻すと反則</text>
      <Mover points={[[70, 120], [300, 120], [300, 120]]} times={[0, 0.7, 1]} dur="4s">
        <Ball />
      </Mover>
      <text x="280" y="252" textAnchor="middle" fontSize="15" fontWeight="700" fill={C.muted}>センターライン</text>
    </Svg>
  );
}

function ChargeBlock() {
  return (
    <Svg viewBox="0 0 540 250" label="チャージングとブロッキングの違い">
      <rect width="540" height="250" fill="#fff" />
      <g>
        <text x="135" y="30" textAnchor="middle" fontSize="18" fontWeight="900" fill={C.off}>チャージング</text>
        <text x="135" y="52" textAnchor="middle" fontSize="14" fontWeight="700" fill={C.muted}>攻撃側の反則</text>
        <Mover points={[[40, 140], [108, 140], [108, 140], [40, 140]]} times={[0, 0.5, 0.85, 1]} dur="3s">
          <Player n="1" />
        </Mover>
        <D x={160} y={140} />
        <rect x="140" y="170" width="40" height="8" fill={C.ok} />
        <text x="160" y="205" textAnchor="middle" fontSize="15" fontWeight="800" fill={C.ok}>先に止まっている</text>
      </g>
      <line x1="270" y1="20" x2="270" y2="230" stroke={C.line} strokeWidth="2" />
      <g>
        <text x="405" y="30" textAnchor="middle" fontSize="18" fontWeight="900" fill={C.def}>ブロッキング</text>
        <text x="405" y="52" textAnchor="middle" fontSize="14" fontWeight="700" fill={C.muted}>守備側の反則</text>
        <Mover points={[[310, 140], [370, 140], [370, 140], [310, 140]]} times={[0, 0.5, 0.85, 1]} dur="3s">
          <Player n="1" />
        </Mover>
        <Mover points={[[470, 110], [416, 140], [416, 140], [470, 110]]} times={[0, 0.5, 0.85, 1]} dur="3s">
          <Player n="D" color={C.def} />
        </Mover>
        <text x="430" y="205" textAnchor="middle" fontSize="15" fontWeight="800" fill={C.def}>動きながらぶつかる</text>
      </g>
    </Svg>
  );
}

// ── 攻撃の動く図 ──

function PickAndRoll({ pop = false }: { pop?: boolean }) {
  const endScreener: [number, number] = pop ? [410, 300] : [255, 95];
  return (
    <Svg viewBox={COURT_VIEW} label={pop ? "ピック＆ポップの動き" : "ピック＆ロールの動き"}>
      <Court />
      {/* 守備: ボールマンの守備は壁に引っかかる */}
      <Mover points={[[250, 300], [250, 300], [268, 290], [268, 290]]} times={[0, 0.3, 0.5, 1]}>
        <Player n="D" color={C.def} />
      </Mover>
      <Mover points={[[340, 200], [300, 250], [300, 250], pop ? [330, 230] : [290, 170], pop ? [330, 230] : [290, 170]]} times={[0, 0.25, 0.4, 0.7, 1]}>
        <Player n="D" color={C.def} />
      </Mover>
      {/* 攻撃 */}
      <Mover points={[[340, 190], [290, 300], [290, 300], endScreener, endScreener]} times={[0, 0.25, 0.4, 0.7, 1]}>
        <Player n="5" />
      </Mover>
      <Mover points={[[250, 360], [250, 360], [330, 330], [330, 230], [330, 230]]} times={[0, 0.25, 0.45, 0.65, 1]}>
        <Player n="1" />
      </Mover>
      {/* ボール: 1が持ち、最後に5へパス */}
      <Mover points={[[268, 345], [268, 345], [348, 315], [348, 215], endScreener, endScreener]} times={[0, 0.25, 0.45, 0.65, 0.8, 1]}>
        <Ball />
      </Mover>
      <Appear from={0.25} to={0.45}>
        <Label x={250} y={420}>① 5番がボールマンの守備に壁を作る</Label>
      </Appear>
      <Appear from={0.45} to={0.66}>
        <Label x={250} y={420}>② 1番が壁を使ってドリブル</Label>
      </Appear>
      <Appear from={0.66} to={1}>
        <Label x={250} y={420} color={C.off}>{pop ? "③ 5番は外へ開いてシュート" : "③ 5番はゴールへ走り込んでパスを受ける"}</Label>
      </Appear>
    </Svg>
  );
}

function FastBreak() {
  return (
    <Svg viewBox={COURT_VIEW} label="速攻の動き">
      <Court />
      <Mover points={[[180, 470], [200, 250], [215, 110], [215, 110]]} times={[0, 0.45, 0.75, 1]}>
        <Player n="1" />
      </Mover>
      <Mover points={[[340, 480], [330, 260], [280, 70], [280, 70]]} times={[0, 0.45, 0.8, 1]}>
        <Player n="2" />
      </Mover>
      <Mover points={[[250, 230], [250, 190], [235, 120], [235, 120]]} times={[0, 0.45, 0.75, 1]}>
        <Player n="D" color={C.def} />
      </Mover>
      <Mover points={[[198, 455], [218, 235], [228, 98], [282, 62], [250, 52], [250, 52]]} times={[0, 0.45, 0.72, 0.82, 0.9, 1]}>
        <Ball />
      </Mover>
      <Label x={250} y={300} color={C.off}>2対1の速攻</Label>
      <Appear from={0.72} to={1}>
        <Label x={360} y={130} color={C.off} size={17}>守備が1人寄ったら、パスで決める</Label>
      </Appear>
    </Svg>
  );
}

function DriveKick() {
  return (
    <Svg viewBox={COURT_VIEW} label="ドライブ＆キックの動き">
      <Court />
      <Mover points={[[250, 340], [240, 160], [240, 160]]} times={[0, 0.45, 1]}>
        <Player n="1" />
      </Mover>
      <D x={250} y={290} />
      <Mover points={[[60, 70], [60, 70], [175, 140], [130, 90], [130, 90]]} times={[0, 0.25, 0.5, 0.8, 1]}>
        <Player n="D" color={C.def} />
      </Mover>
      <O x={15} y={40} n="3" />
      <Mover points={[[258, 322], [248, 142], [30, 40], [30, 40]]} times={[0, 0.45, 0.65, 1]}>
        <Ball />
      </Mover>
      <Appear from={0.2} to={0.5}>
        <Label x={300} y={420}>① ドライブで守備を引きつける</Label>
      </Appear>
      <Appear from={0.5} to={1}>
        <Label x={300} y={420} color={C.off}>② 空いたコーナーへパス → スリー</Label>
      </Appear>
    </Svg>
  );
}

function AlleyOop() {
  return (
    <Svg viewBox={COURT_VIEW} label="アリウープの動き">
      <Court />
      <O x={250} y={340} n="1" />
      <Mover points={[[70, 230], [180, 120], [235, 62], [235, 62]]} times={[0, 0.45, 0.7, 1]}>
        <Player n="3" />
      </Mover>
      <Mover points={[[268, 325], [268, 325], [200, 80], [242, 55], [250, 52], [250, 52]]} times={[0, 0.3, 0.6, 0.72, 0.8, 1]}>
        <g>
          <Ball />
        </g>
      </Mover>
      <Arrow d="M265,320 Q300,150 245,70" color="ball" dashed />
      <Appear from={0.6} to={1}>
        <Label x={360} y={110} color={C.off}>空中でキャッチして</Label>
        <Label x={360} y={134} color={C.off}>そのままダンク</Label>
      </Appear>
    </Svg>
  );
}

function EuroStep() {
  return (
    <Svg viewBox={COURT_VIEW} label="ユーロステップの動き">
      <Court />
      <D x={235} y={190} />
      <Mover points={[[250, 360], [240, 270], [180, 210], [290, 150], [255, 75], [255, 75]]} times={[0, 0.3, 0.5, 0.7, 0.85, 1]}>
        <Player n="1" />
      </Mover>
      <path d="M240,270 L180,210 L290,150 L255,75" fill="none" stroke={C.off} strokeWidth="3" strokeDasharray="8 6" />
      <Label x={110} y={215} color={C.off} size={17}>1歩目：左へ</Label>
      <Label x={360} y={150} color={C.off} size={17}>2歩目：右へ</Label>
      <Label x={250} y={420}>左右にずらして守備をかわす</Label>
    </Svg>
  );
}

function StepBack() {
  return (
    <Svg viewBox={COURT_VIEW} label="ステップバックの動き">
      <Court arc />
      <Mover points={[[250, 230], [250, 230], [250, 210], [250, 210]]} times={[0, 0.35, 0.5, 1]}>
        <Player n="D" color={C.def} />
      </Mover>
      <Mover points={[[250, 340], [250, 270], [250, 350], [250, 350]]} times={[0, 0.35, 0.6, 1]}>
        <Player n="1" />
      </Mover>
      <Appear from={0.35} to={0.6}>
        <Label x={360} y={260}>ドライブすると見せて…</Label>
      </Appear>
      <Appear from={0.6} to={1}>
        <Label x={360} y={330} color={C.off}>後ろへ下がって</Label>
        <Label x={360} y={354} color={C.off}>ラインの外から打つ</Label>
      </Appear>
    </Svg>
  );
}

function Screen() {
  return (
    <Svg viewBox={COURT_VIEW} label="スクリーンの仕組み">
      <Court />
      <O x={250} y={340} n="1" />
      <Ball x={268} y={325} />
      <Mover points={[[200, 70], [200, 70], [330, 230], [330, 230]]} times={[0, 0.3, 0.7, 1]}>
        <Player n="2" />
      </Mover>
      <Mover points={[[175, 95], [175, 95], [240, 160], [240, 160]]} times={[0, 0.3, 0.55, 1]}>
        <Player n="D" color={C.def} />
      </Mover>
      <Mover points={[[320, 190], [255, 175], [255, 175]]} times={[0, 0.3, 1]}>
        <Player n="5" />
      </Mover>
      <Appear from={0} to={0.3}>
        <Label x={250} y={420}>① 5番が2番の守備の進路に立つ</Label>
      </Appear>
      <Appear from={0.3} to={1}>
        <Label x={250} y={420} color={C.off}>② 守備が壁に引っかかり、2番がフリーに</Label>
      </Appear>
    </Svg>
  );
}

function Spacing() {
  const spots: [number, number, string][] = [
    [250, 340, "1"],
    [440, 250, "2"],
    [60, 250, "3"],
    [12, 40, "4"],
    [488, 40, "5"],
  ];
  return (
    <Svg viewBox={COURT_VIEW} label="スペーシングの例（5人が外に広がる配置）">
      <Court arc />
      <rect x="150" y="10" width="200" height="250" fill={C.highlight} stroke={C.off} strokeDasharray="8 6" strokeWidth="2" />
      <Label x={250} y={150} color={C.off}>ドライブの</Label>
      <Label x={250} y={174} color={C.off}>スペースが広がる</Label>
      {spots.map(([x, y, n]) => (
        <O key={n} x={x} y={y} n={n} />
      ))}
      <Label x={250} y={420}>5人全員がスリーポイントラインの外に立つ形</Label>
    </Svg>
  );
}

// ── 守備の図 ──

function BoxOut() {
  return (
    <Svg viewBox={COURT_VIEW} label="ボックスアウト">
      <Court />
      <O x={250} y={200} n="4" />
      <D x={250} y={150} />
      <Label x={375} y={156} color={C.def}>背中で押さえる</Label>
      <Arrow d="M250,125 L250,80" color="def" />
      <Mover points={[[250, 52], [230, 20], [250, 52]]} times={[0, 0.5, 1]} dur="2.5s">
        <Ball />
      </Mover>
      <Label x={250} y={300}>相手とゴールの間に体を入れる</Label>
      <Label x={250} y={420} size={16} color={C.muted}>外れたボールを相手に取らせない</Label>
    </Svg>
  );
}

function ManToMan() {
  const pairs: [number, number][] = [
    [250, 340],
    [440, 250],
    [60, 250],
    [350, 150],
    [200, 95],
  ];
  return (
    <Svg viewBox={COURT_VIEW} label="マンツーマン・ディフェンス">
      <Court />
      {pairs.map(([x, y], i) => {
        const dx = (RIM.x - x) * 0.16;
        const dy = (RIM.y - y) * 0.16;
        return (
          <g key={i}>
            <line x1={x} y1={y} x2={x + dx} y2={y + dy} stroke={C.muted} strokeWidth="2" strokeDasharray="4 4" />
            <O x={x} y={y} n={String(i + 1)} />
            <D x={x + dx} y={y + dy} />
          </g>
        );
      })}
      <Label x={250} y={430}>守備（赤）は1人ずつ担当の相手につく</Label>
    </Svg>
  );
}

function Zone() {
  const ds: [number, number][] = [
    [190, 230],
    [310, 230],
    [110, 90],
    [250, 110],
    [390, 90],
  ];
  return (
    <Svg viewBox={COURT_VIEW} label="2-3ゾーン">
      <Court />
      <path d="M30,140 L250,140 L250,330 L60,300 Z" fill="rgba(200,50,60,0.10)" />
      <path d="M250,140 L470,140 L440,300 L250,330 Z" fill="rgba(200,50,60,0.18)" />
      <path d="M0,0 L170,0 L170,140 L0,140 Z" fill="rgba(200,50,60,0.14)" />
      <path d="M170,0 L330,0 L330,140 L170,140 Z" fill="rgba(200,50,60,0.22)" />
      <path d="M330,0 L500,0 L500,140 L330,140 Z" fill="rgba(200,50,60,0.14)" />
      {ds.map(([x, y], i) => (
        <D key={i} x={x} y={y} />
      ))}
      <Label x={250} y={380} color={C.def}>前に2人・後ろに3人（2-3ゾーン）</Label>
      <Label x={250} y={410} size={16} color={C.muted}>色の範囲に入ってきた相手を守る</Label>
    </Svg>
  );
}

function Switch() {
  return (
    <Svg viewBox={COURT_VIEW} label="スイッチ">
      <Court />
      <O x={250} y={340} n="1" />
      <Ball x={268} y={325} />
      <O x={300} y={290} n="5" />
      <Mover points={[[250, 300], [250, 300], [320, 250], [320, 250]]} times={[0, 0.35, 0.7, 1]}>
        <Player n="D1" color={C.def} />
      </Mover>
      <Mover points={[[330, 250], [330, 250], [250, 305], [250, 305]]} times={[0, 0.35, 0.7, 1]}>
        <Player n="D5" color={C.def} />
      </Mover>
      <Appear from={0.7} to={1}>
        <Label x={250} y={420} color={C.def}>守る相手を入れ替える</Label>
        <Label x={250} y={444} size={15} color={C.muted}>小さい選手が5番を守る「ミスマッチ」が起きることも</Label>
      </Appear>
      <Appear from={0} to={0.7}>
        <Label x={250} y={420}>5番が壁を作ると…</Label>
      </Appear>
    </Svg>
  );
}

function HelpDefense() {
  return (
    <Svg viewBox={COURT_VIEW} label="ヘルプディフェンスとローテーション">
      <Court />
      <Mover points={[[250, 340], [235, 170], [235, 170]]} times={[0, 0.4, 1]}>
        <Player n="1" />
      </Mover>
      <D x={260} y={300} />
      <O x={430} y={250} n="2" />
      <Mover points={[[400, 220], [400, 220], [270, 150], [270, 150]]} times={[0, 0.3, 0.55, 1]}>
        <Player n="D" color={C.def} />
      </Mover>
      <O x={15} y={40} n="3" />
      <Mover points={[[55, 75], [55, 75], [55, 75], [340, 220], [340, 220]]} times={[0, 0.3, 0.55, 0.85, 1]}>
        <Player n="D" color={C.def} />
      </Mover>
      <Appear from={0.3} to={0.6}>
        <Label x={250} y={420} color={C.def}>① 抜かれたら近くの守備が助けに入る</Label>
      </Appear>
      <Appear from={0.6} to={1}>
        <Label x={250} y={420} color={C.def}>② 空いた相手を別の守備が埋める</Label>
      </Appear>
    </Svg>
  );
}

function DoubleTeam() {
  return (
    <Svg viewBox={COURT_VIEW} label="ダブルチーム">
      <Court />
      <O x={430} y={250} n="2" />
      <Ball x={448} y={235} />
      <D x={400} y={215} />
      <Mover points={[[300, 290], [300, 290], [415, 290], [415, 290]]} times={[0, 0.3, 0.6, 1]}>
        <Player n="D" color={C.def} />
      </Mover>
      <O x={250} y={340} n="1" />
      <circle cx="250" cy="340" r="36" fill="none" stroke={C.off} strokeWidth="3" strokeDasharray="6 5" />
      <Appear from={0.6} to={1}>
        <Label x={250} y={410} color={C.off}>1番がフリーになる → 素早いパスが鍵</Label>
      </Appear>
      <Label x={380} y={170} color={C.def}>2人で囲む</Label>
    </Svg>
  );
}

function Drop() {
  return (
    <Svg viewBox={COURT_VIEW} label="ドロップカバレッジ">
      <Court />
      <rect x="185" y="60" width="130" height="140" fill="rgba(200,50,60,0.14)" stroke={C.def} strokeDasharray="7 5" strokeWidth="2" />
      <O x={290} y={300} n="5" />
      <Mover points={[[250, 360], [250, 360], [320, 330], [330, 250], [330, 250]]} times={[0, 0.2, 0.4, 0.6, 1]}>
        <Player n="1" />
      </Mover>
      <Mover points={[[300, 250], [270, 200], [255, 150], [255, 150]]} times={[0, 0.3, 0.6, 1]}>
        <Player n="D" color={C.def} />
      </Mover>
      <Label x={250} y={225} color={C.def} size={16}>ゴール近くで待つ</Label>
      <Appear from={0.6} to={1}>
        <Label x={390} y={250} color={C.off} size={16}>空いた中間距離から</Label>
        <Label x={390} y={272} color={C.off} size={16}>プルアップを打たれやすい</Label>
      </Appear>
    </Svg>
  );
}

// ── 表・トーナメントの図 ──

function StatLine() {
  const stats: [string, number][] = [
    ["PTS", 24],
    ["REB", 11],
    ["AST", 10],
    ["STL", 2],
    ["BLK", 1],
  ];
  return (
    <div className="border border-line bg-surface p-4">
      <p className="mb-2 text-xs font-bold text-muted">例：ある選手の1試合の記録</p>
      <div className="grid grid-cols-5 border border-line text-center">
        {stats.map(([k, v]) => (
          <div key={k} className={`border-r border-line last:border-r-0 ${v >= 10 ? "bg-[#e6f5f1]" : ""}`}>
            <div className="border-b border-line py-1 text-[11px] font-extrabold text-muted">{k}</div>
            <div className={`py-2 text-xl font-extrabold tabular-nums ${v >= 10 ? "text-[#13866f]" : ""}`}>{v}</div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-sm leading-6">
        10以上（緑）が<b>2つ</b>ならダブルダブル、<b>3つ</b>ならトリプルダブル。この例は<b className="text-[#13866f]">トリプルダブル</b>です。
      </p>
    </div>
  );
}

function PlayIn() {
  const box = (x: number, y: number, label: string, tone: "off" | "plain" | "ok" | "ng" = "plain") => {
    const fill = tone === "ok" ? C.ok : tone === "off" ? C.off : tone === "ng" ? "#eef1f5" : "#fff";
    const color = tone === "ok" || tone === "off" ? "#fff" : C.text;
    return (
      <g transform={`translate(${x} ${y})`}>
        <rect width="120" height="40" rx="6" fill={fill} stroke={C.line} strokeWidth="2" />
        <text x="60" y="26" textAnchor="middle" fontSize="16" fontWeight="800" fill={color}>
          {label}
        </text>
      </g>
    );
  };
  return (
    <Svg viewBox="0 0 540 262" label="プレーイン・トーナメントの仕組み">
      <rect width="540" height="262" fill="#fff" />
      {box(10, 20, "7位")}
      {box(10, 70, "8位")}
      <path d="M130,40 H160 V90 H130 M160,65 H190" fill="none" stroke={C.line} strokeWidth="2.5" />
      {box(190, 45, "勝者", "ok")}
      <path d="M310,65 H340" stroke={C.ok} strokeWidth="3" markerEnd="url(#gf-arrow)" />
      {box(345, 45, "第7シード", "off")}
      {box(10, 150, "9位")}
      {box(10, 200, "10位")}
      <path d="M130,170 H160 V220 H130 M160,195 H190" fill="none" stroke={C.line} strokeWidth="2.5" />
      {box(190, 175, "勝者")}
      <text x="250" y="150" textAnchor="middle" fontSize="14" fontWeight="700" fill={C.muted}>7位/8位の敗者</text>
      <path d="M250,108 V130" stroke={C.line} strokeWidth="2.5" strokeDasharray="5 4" />
      <path d="M310,195 H340" stroke={C.ok} strokeWidth="3" markerEnd="url(#gf-arrow)" />
      {box(345, 175, "第8シード", "off")}
      <text x="270" y="250" textAnchor="middle" fontSize="14" fontWeight="700" fill={C.muted}>「7位/8位の敗者」と「9位/10位の勝者」が戦い、勝った方が第8シード</text>
    </Svg>
  );
}

function Playoffs() {
  const seeds = [
    [1, 8],
    [4, 5],
    [3, 6],
    [2, 7],
  ];
  return (
    <Svg viewBox="0 0 540 270" label="プレーオフの組み合わせ">
      <rect width="540" height="270" fill="#fff" />
      <text x="10" y="22" fontSize="15" fontWeight="800" fill={C.muted}>1回戦</text>
      <text x="170" y="22" fontSize="15" fontWeight="800" fill={C.muted}>準決勝</text>
      <text x="300" y="22" fontSize="15" fontWeight="800" fill={C.muted}>カンファレンス決勝</text>
      {seeds.map(([a, b], i) => (
        <g key={a} transform={`translate(10 ${36 + i * 56})`}>
          <rect width="120" height="44" rx="6" fill="#fff" stroke={C.line} strokeWidth="2" />
          <text x="60" y="28" textAnchor="middle" fontSize="16" fontWeight="800" fill={C.text}>
            {a}位 vs {b}位
          </text>
        </g>
      ))}
      <path d="M130,58 H150 V114 H130 M150,86 H170 M130,170 H150 V226 H130 M150,198 H170" fill="none" stroke={C.line} strokeWidth="2.5" />
      <rect x="170" y="66" width="100" height="40" rx="6" fill="#eef1f5" />
      <rect x="170" y="178" width="100" height="40" rx="6" fill="#eef1f5" />
      <path d="M270,86 H290 V198 H270 M290,142 H310" fill="none" stroke={C.line} strokeWidth="2.5" />
      <rect x="310" y="122" width="100" height="40" rx="6" fill={C.off} />
      <text x="360" y="148" textAnchor="middle" fontSize="15" fontWeight="800" fill="#fff">東/西の王者</text>
      <path d="M410,142 H430" stroke={C.text} strokeWidth="3" markerEnd="url(#gf-arrow)" />
      <rect x="434" y="118" width="100" height="48" rx="6" fill={C.ball} />
      <text x="484" y="140" textAnchor="middle" fontSize="15" fontWeight="900" fill="#fff">NBA</text>
      <text x="484" y="158" textAnchor="middle" fontSize="15" fontWeight="900" fill="#fff">ファイナル</text>
      <text x="270" y="262" textAnchor="middle" fontSize="15" fontWeight="800" fill={C.text}>すべて4勝先取（7試合制）</text>
    </Svg>
  );
}

function Conferences() {
  const col = (x: number, title: string, color: string, divs: string[]) => (
    <g transform={`translate(${x} 0)`}>
      <rect width="250" height="44" rx="6" fill={color} />
      <text x="125" y="29" textAnchor="middle" fontSize="18" fontWeight="900" fill="#fff">
        {title}（15チーム）
      </text>
      {divs.map((d, i) => (
        <g key={d} transform={`translate(0 ${56 + i * 52})`}>
          <rect width="250" height="42" rx="6" fill="#fff" stroke={color} strokeWidth="2" />
          <text x="125" y="27" textAnchor="middle" fontSize="16" fontWeight="800" fill={C.text}>
            {d}（5チーム）
          </text>
        </g>
      ))}
    </g>
  );
  return (
    <Svg viewBox="0 0 530 220" label="カンファレンスとディビジョン">
      {col(10, "東 イースタン", C.off, ["アトランティック", "セントラル", "サウスイースト"])}
      {col(270, "西 ウエスタン", C.def, ["ノースウエスト", "パシフィック", "サウスウエスト"])}
    </Svg>
  );
}

function CapLevels() {
  const vals = SYSTEM_LEVELS_2026_27.map((l) => ({ ...l, m: parseFloat(l.usd.replace(/[$M]/g, "")) }));
  const max = 230;
  const short: Record<string, string> = {
    minimum: "最低総年俸",
    cap: "サラリーキャップ",
    tax: "タックスライン",
    apron1: "1st Apron",
    apron2: "2nd Apron",
  };
  return (
    <Svg viewBox="-14 -6 568 272" label="2026-27シーズンの年俸総額の基準">
      <rect width="540" height="260" fill="#fff" />
      {vals.map((v, i) => {
        const w = (v.m / max) * 330;
        const color = v.key === "minimum" ? C.muted : v.key === "cap" ? C.ok : v.key === "tax" ? C.ball : C.def;
        return (
          <g key={v.key} transform={`translate(0 ${16 + i * 46})`}>
            <text x="0" y="24" fontSize="15" fontWeight="800" fill={C.text}>
              {short[v.key]}
            </text>
            <rect x="140" y="6" width={w} height="26" fill={color} opacity={0.85} />
            <text x={146 + w} y="25" fontSize="14" fontWeight="800" fill={C.text}>
              {v.usd}
            </text>
          </g>
        );
      })}
      <text x="0" y="252" fontSize="13" fontWeight="700" fill={C.muted}>2026-27シーズン（NBA公式発表）。$1M＝100万ドル</text>
    </Svg>
  );
}

function LotteryOdds() {
  const odds = [14, 14, 14, 12.5, 10.5, 9, 7.5, 6, 4.5, 3, 2, 1.5, 1, 0.5];
  return (
    <Svg viewBox="0 0 540 250" label="ドラフト・ロッタリーで1位指名権を得る確率">
      <rect width="540" height="250" fill="#fff" />
      <text x="10" y="22" fontSize="15" fontWeight="800" fill={C.text}>1位指名権が当たる確率（成績が悪い順）</text>
      {odds.map((o, i) => {
        const h = (o / 14) * 150;
        return (
          <g key={i} transform={`translate(${16 + i * 37} 0)`}>
            <rect x="0" y={190 - h} width="28" height={h} fill={i < 3 ? C.def : C.off} opacity={i < 3 ? 0.9 : 0.6} />
            <text x="14" y={184 - h} textAnchor="middle" fontSize="12" fontWeight="800" fill={C.text}>
              {o}
            </text>
            <text x="14" y="210" textAnchor="middle" fontSize="12" fontWeight="700" fill={C.muted}>
              {i + 1}
            </text>
          </g>
        );
      })}
      <text x="10" y="240" fontSize="13" fontWeight="700" fill={C.muted}>単位は%。下の数字はレギュラーシーズン成績の下からの順位。</text>
    </Svg>
  );
}

const FIGURES: Record<GlossaryFigure, { node: () => ReactNode; caption: string; moving?: boolean }> = {
  "court-areas": { node: CourtAreas, caption: "コートの各エリア（ハーフコート）" },
  positions: { node: Positions, caption: "5つのポジションの基本の立ち位置（一例）" },
  "shot-clock": { node: ShotClock, caption: "24秒のショットクロック", moving: true },
  quarters: { node: Quarters, caption: "NBAの試合時間" },
  traveling: { node: Traveling, caption: "ボールをつかんだ後は2歩まで", moving: true },
  scoring: { node: Scoring, caption: "場所によって得点が変わる" },
  "three-seconds": { node: ThreeSeconds, caption: "ペイントに3秒を超えて留まれない", moving: true },
  goaltending: { node: Goaltending, caption: "ボールが落ち始めたら触れない", moving: true },
  bonus: { node: Bonus, caption: "チームファウルが5回目からフリースロー" },
  backcourt: { node: Backcourt, caption: "8秒以内にセンターラインを越える", moving: true },
  "charge-block": { node: ChargeBlock, caption: "どちらが悪いかで反則が変わる", moving: true },
  "pick-and-roll": { node: () => <PickAndRoll />, caption: "ピック＆ロールの動き", moving: true },
  "pick-and-pop": { node: () => <PickAndRoll pop />, caption: "ピック＆ポップの動き", moving: true },
  "fast-break": { node: FastBreak, caption: "相手が戻る前に攻める", moving: true },
  "drive-kick": { node: DriveKick, caption: "ドライブで引きつけて外へパス", moving: true },
  "alley-oop": { node: AlleyOop, caption: "空中でパスを受けて決める", moving: true },
  "euro-step": { node: EuroStep, caption: "左右にずらす2歩のステップ", moving: true },
  "step-back": { node: StepBack, caption: "下がって距離を作る", moving: true },
  screen: { node: Screen, caption: "壁を作って味方をフリーにする", moving: true },
  spacing: { node: Spacing, caption: "5人が外に広がってスペースを作る" },
  "box-out": { node: BoxOut, caption: "体を入れてリバウンドの位置を取る" },
  "man-to-man": { node: ManToMan, caption: "1人が1人を担当する" },
  zone: { node: Zone, caption: "場所を担当する（2-3ゾーンの例）" },
  switch: { node: Switch, caption: "守る相手を入れ替える", moving: true },
  "help-defense": { node: HelpDefense, caption: "助けに入り、空いた相手を順番に埋める", moving: true },
  "double-team": { node: DoubleTeam, caption: "1人を2人で囲む", moving: true },
  drop: { node: Drop, caption: "ビッグマンがゴール近くまで下がる", moving: true },
  "stat-line": { node: StatLine, caption: "ダブルダブル・トリプルダブルの数え方" },
  "play-in": { node: PlayIn, caption: "7〜10位で残り2枠を争う" },
  playoffs: { node: Playoffs, caption: "各カンファレンス8チームの勝ち抜き戦" },
  conferences: { node: Conferences, caption: "30チームの分かれ方" },
  "cap-levels": { node: CapLevels, caption: "年俸総額の5つの基準" },
  "lottery-odds": { node: LotteryOdds, caption: "ロッタリーの当選確率" },
};

// 選手の色分け(攻撃/守備/ボール)の凡例を出す図
const LEGEND_FIGURES = new Set<GlossaryFigure>([
  "positions", "three-seconds", "charge-block", "pick-and-roll", "pick-and-pop", "fast-break", "drive-kick", "alley-oop",
  "euro-step", "step-back", "screen", "spacing", "box-out", "man-to-man", "zone", "switch", "help-defense", "double-team", "drop",
]);

export function GlossaryFigureView({ figure }: { figure: GlossaryFigure }) {
  const f = FIGURES[figure];
  const Node = f.node;
  const isCourt = !["stat-line"].includes(figure);
  return (
    <figure className="mx-0">
      <div className={isCourt ? "overflow-hidden border border-line bg-white" : ""}>
        <Node />
      </div>
      <figcaption className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
        <span className="font-bold text-foreground">図：{f.caption}</span>
        {f.moving && <span>（動く図・くり返し再生）</span>}
        {LEGEND_FIGURES.has(figure) && (
          <span className="inline-flex items-center gap-2">
            <span className="inline-flex items-center gap-1">
              <span className="inline-block size-2.5 rounded-full" style={{ backgroundColor: C.off }} />
              攻撃
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="inline-block size-2.5 rounded-full" style={{ backgroundColor: C.def }} />
              守備
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="inline-block size-2.5 rounded-full" style={{ backgroundColor: C.ball }} />
              ボール
            </span>
          </span>
        )}
      </figcaption>
    </figure>
  );
}

// 辞典ページ上部の「5つのポジション」図(クリックで各ポジションの解説を開く)
export function PositionCourt({ onOpen }: { onOpen: (id: string) => void }) {
  const ref = useReducedMotionPause();
  const spots: { x: number; y: number; n: string; abbr: string; id: string; color: string }[] = [
    { x: 250, y: 340, n: "1", abbr: "PG", id: "point-guard", color: "#c8323c" },
    { x: 430, y: 250, n: "2", abbr: "SG", id: "shooting-guard", color: "#d9620b" },
    { x: 70, y: 250, n: "3", abbr: "SF", id: "small-forward", color: "#b8860b" },
    { x: 350, y: 150, n: "4", abbr: "PF", id: "power-forward", color: "#13866f" },
    { x: 200, y: 95, n: "5", abbr: "C", id: "center", color: "#1f63e9" },
  ];
  return (
    <svg ref={ref} viewBox={COURT_VIEW} role="group" aria-label="5つのポジション（番号を押すと解説が開きます）" className="block h-auto w-full">
      <Court />
      {spots.map((s) => (
        <g
          key={s.id}
          transform={`translate(${s.x} ${s.y})`}
          role="button"
          tabIndex={0}
          aria-label={`${s.n}番 ${s.abbr} の解説を開く`}
          onClick={() => onOpen(s.id)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onOpen(s.id);
            }
          }}
          className="cursor-pointer outline-none [&:focus-visible>circle:first-child]:stroke-[#101827]"
        >
          <circle r="34" fill={s.color} opacity="0.18">
            <animate attributeName="r" values="30;40;30" dur="2.4s" repeatCount="indefinite" />
          </circle>
          <circle r="26" fill={s.color} stroke="#fff" strokeWidth="4" />
          <text textAnchor="middle" dy="9" fontSize="26" fontWeight="900" fill="#fff">
            {s.n}
          </text>
          <text textAnchor="middle" y="52" fontSize="17" fontWeight="900" fill={s.color} stroke="#fff" strokeWidth="5" paintOrder="stroke">
            {s.abbr}
          </text>
        </g>
      ))}
    </svg>
  );
}
