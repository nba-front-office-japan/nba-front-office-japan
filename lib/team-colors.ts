// NBA全30チームのメインカラー。チームページ(/teams/[teamId])の背景色などに使う。
//
// 出典: NBA.com のチーム詳細ページ(例: https://www.nba.com/team/1610612738/celtics)が
//       チームの背景に使っている CSS 変数(--BOS など)の値。2026-09-29 に取得。
//
// 画面では、白文字の読みやすさを保つため teamThemeBackground() で必要な分だけ暗くした色を使う。
// ここに保存するのは NBA.com の元の値(補正前)。

export const TEAM_COLORS_SOURCE = {
  label: "NBA.com チーム詳細ページのチームカラー",
  url: "https://www.nba.com/teams",
  retrievedOn: "2026-09-29",
} as const;

// キーは teams.abbreviation
export const TEAM_PRIMARY_COLORS: Record<string, string> = {
  ATL: "#e03a3e",
  BKN: "#000000",
  BOS: "#008348",
  CHA: "#00788c",
  CHI: "#ce1141",
  CLE: "#860038",
  DAL: "#0053bc",
  DEN: "#0e2240",
  DET: "#1d428a",
  GSW: "#1d428a",
  HOU: "#ce0e2d",
  IND: "#002d62",
  LAC: "#12173f",
  LAL: "#552583",
  MEM: "#5d76a9",
  MIA: "#98002e",
  MIL: "#00471b",
  MIN: "#1d428a",
  NOP: "#002b5c",
  NYK: "#1d428a",
  OKC: "#007ac1",
  ORL: "#0050b5",
  PHI: "#006bb6",
  PHX: "#1d1160",
  POR: "#e03a3e",
  SAC: "#5a2d81",
  SAS: "#000000",
  TOR: "#000000",
  UTA: "#4e008e",
  WAS: "#002b5c",
};

// チームカラーの上の補足文字は白90%(globals.css の .team-theme の --muted と同じ値)
const MUTED_WHITE_ALPHA = 0.9;
// WCAG AA(通常サイズの文字)の基準
const MIN_CONTRAST = 4.5;

type Rgb = [number, number, number];

function hexToRgb(hex: string): Rgb {
  const h = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as Rgb;
}

function rgbToHex(rgb: Rgb): string {
  return `#${rgb.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

function relativeLuminance([r, g, b]: Rgb): number {
  const channel = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrastRatio(a: Rgb, b: Rgb): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

// 白90%を背景に重ねたときの見た目の色
function mutedWhiteOn(bg: Rgb): Rgb {
  return bg.map((v) => Math.round(255 * MUTED_WHITE_ALPHA + v * (1 - MUTED_WHITE_ALPHA))) as Rgb;
}

function readableOnWhiteText(bg: Rgb): boolean {
  return (
    contrastRatio([255, 255, 255], bg) >= MIN_CONTRAST &&
    contrastRatio(mutedWhiteOn(bg), bg) >= MIN_CONTRAST
  );
}

// 白文字・白90%の補足文字がどちらも4.5以上のコントラストになるまで、2%ずつ暗くした色を返す。
// 30チーム中、補正が入るのは ATL・POR(12%)、MEM・OKC(8%)、BOS(6%) のみ(2026-09-29 時点の色)。
export function teamThemeBackground(abbreviation: string): string | null {
  const primary = TEAM_PRIMARY_COLORS[abbreviation];
  if (!primary) return null;
  const base = hexToRgb(primary);
  for (let darken = 0; darken <= 0.6; darken = Math.round((darken + 0.02) * 100) / 100) {
    const candidate = base.map((v) => Math.round(v * (1 - darken))) as Rgb;
    if (readableOnWhiteText(candidate)) return rgbToHex(candidate);
  }
  return rgbToHex(base.map((v) => Math.round(v * 0.4)) as Rgb);
}
