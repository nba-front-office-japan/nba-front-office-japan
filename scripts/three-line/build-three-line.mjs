// 第2回「THE LINE MOVES」の図4枚を作る。SVGをこのフォルダに書き出し、ヘッドレスChromeで public/history/ のPNGにする
// 実行: node scripts/three-line/build-three-line.mjs
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

export const WIDTH = 1600;
export const HEIGHT = 1200;
export const SCALE = 22; // 1ftあたりのpx
export const ORIGIN = { x: 250, y: 83 }; // コート左上(左サイドラインとエンドラインの交点)
export const RIM = { x: 25, y: 5.25 }; // 左サイドライン、エンドラインからのft
export const ARC_RADIUS = 23.75;
export const SHORT_RADIUS = 22;
export const CORNER_OFFSET = 3; // サイドラインからコーナーの直線まで

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const COLORS = { background: "#0b0c0d", floor: "#171511", line: "#f4efe5", gold: "#e1bb71", rim: "#e07038" };
const FONT = `Georgia, "Times New Roman", "Yu Mincho", serif`;
const HERE = path.dirname(fileURLToPath(import.meta.url));

const px = (x, y) => ({ x: ORIGIN.x + x * SCALE, y: ORIGIN.y + y * SCALE });
const point = (x, y) => { const p = px(x, y); return `${p.x.toFixed(2)},${p.y.toFixed(2)}`; };
const polar = (radius, degrees) => ({ x: RIM.x + radius * Math.cos((degrees * Math.PI) / 180), y: RIM.y + radius * Math.sin((degrees * Math.PI) / 180) });

function arcPoints(radius, from, to) {
  const points = [];
  const steps = Math.ceil((to - from) / 0.25);
  for (let step = 0; step <= steps; step++) { const p = polar(radius, from + ((to - from) * step) / steps); points.push(point(p.x, p.y)); }
  return points;
}

// 23ft 9inの線: コーナーの直線と、アークとの交点で接続する
function fullLine() {
  const side = RIM.x - CORNER_OFFSET;
  const join = (Math.asin(Math.sqrt(ARC_RADIUS ** 2 - side ** 2) / ARC_RADIUS) * 180) / Math.PI;
  return [point(50 - CORNER_OFFSET, 0), ...arcPoints(ARC_RADIUS, join, 180 - join), point(CORNER_OFFSET, 0)].join(" ");
}

// 全周22ftの線: コーナーも直線にせず、エンドラインまでアークのまま
function shortLine() {
  const start = (-Math.asin(RIM.y / SHORT_RADIUS) * 180) / Math.PI;
  return arcPoints(SHORT_RADIUS, start, 180 - start).join(" ");
}

function court() {
  const p = (x, y) => { const q = px(x, y); return `${q.x} ${q.y}`; };
  const corner = px(0, 0);
  const rim = px(RIM.x, RIM.y);
  return `<g id="court" fill="none" stroke="${COLORS.line}" stroke-opacity="0.5" stroke-width="4">
<rect x="${corner.x}" y="${corner.y}" width="${50 * SCALE}" height="${47 * SCALE}" fill="${COLORS.floor}"/>
<rect x="${px(17, 0).x}" y="${corner.y}" width="${16 * SCALE}" height="${19 * SCALE}"/>
<path d="M ${p(19, 19)} A ${6 * SCALE} ${6 * SCALE} 0 0 0 ${p(31, 19)}"/>
<path d="M ${p(19, 19)} A ${6 * SCALE} ${6 * SCALE} 0 0 1 ${p(31, 19)}" stroke-dasharray="16 14"/>
<path d="M ${p(21, 5.25)} A ${4 * SCALE} ${4 * SCALE} 0 0 0 ${p(29, 5.25)}"/>
<path d="M ${p(19, 47)} A ${6 * SCALE} ${6 * SCALE} 0 0 1 ${p(31, 47)}"/>
<line x1="${px(22, 4).x}" y1="${px(22, 4).y}" x2="${px(28, 4).x}" y2="${px(28, 4).y}" stroke-opacity="1" stroke-width="7"/>
<circle cx="${rim.x}" cy="${rim.y}" r="${0.75 * SCALE}" stroke="${COLORS.rim}" stroke-opacity="1" stroke-width="6"/>
</g>`;
}

const threeLine = (id, points, color, dotted) => `<polyline id="${id}" points="${points}" fill="none" stroke="${color}" stroke-width="${dotted ? 8 : 9}"${dotted ? ` stroke-linecap="round" stroke-dasharray="1 19"` : ""}/>`;

function text(x, y, value, color, size, anchor) {
  return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" fill="${color}" font-family='${FONT}' font-size="${size}" font-weight="700" text-anchor="${anchor}">${value}</text>`;
}

// リング中心から線までの寸法線とラベル。斜めはエンドラインから60度の向き
function radiusDimension(radius, degrees, label, color, labelRadius, anchor) {
  const start = polar(0.75, degrees);
  const end = polar(radius, degrees);
  const a = px(start.x, start.y);
  const b = px(end.x, end.y);
  const at = polar(labelRadius, degrees);
  const c = px(at.x, at.y);
  return `<line x1="${a.x.toFixed(1)}" y1="${a.y.toFixed(1)}" x2="${b.x.toFixed(1)}" y2="${b.y.toFixed(1)}" stroke="${color}" stroke-width="3"/><circle cx="${b.x.toFixed(1)}" cy="${b.y.toFixed(1)}" r="8" fill="${color}"/>${text(c.x, c.y + 16, label, color, 46, anchor)}`;
}

function cornerDimension() {
  const a = px(RIM.x + 0.75, RIM.y);
  const b = px(50 - CORNER_OFFSET, RIM.y);
  const label = px(50, RIM.y);
  return `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="${COLORS.gold}" stroke-width="3"/><circle cx="${b.x}" cy="${b.y}" r="8" fill="${COLORS.gold}"/>${text(label.x + 24, label.y + 16, "22ft", COLORS.gold, 46, "start")}`;
}

const gold = () => threeLine("line-23ft9in", fullLine(), COLORS.gold, false) + radiusDimension(ARC_RADIUS, 60, "23ft 9in", COLORS.gold, 25.2, "start") + cornerDimension();
const white = () => threeLine("line-22ft", shortLine(), COLORS.line, true) + radiusDimension(SHORT_RADIUS, 120, "22ft", COLORS.line, 25.2, "end");
const yearLabel = (value) => { const c = px(25, 37.5); return text(c.x, c.y, value, COLORS.gold, 128, "middle"); };

// 重なる部分は実線を優先するので、点線を先に描く
const FRAMES = {
  "three-line-01": white() + gold(),
  "three-line-02": gold() + yearLabel("1979"),
  "three-line-03": white() + yearLabel("1994–1996"),
  "three-line-04": gold() + yearLabel("1997–"),
};

export function svgFor(overlay) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
<rect id="background" width="${WIDTH}" height="${HEIGHT}" fill="${COLORS.background}"/>
${court()}
<g id="overlay">${overlay}</g>
</svg>
`;
}

// SVGの一覧をChromeで開き、正確に1600×1200でPNGバッファにする。終わったらChromeを閉じる
export async function renderSvgs(svgs) {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "three-line-"));
  const chrome = spawn(CHROME, ["--headless=new", "--disable-gpu", "--no-first-run", "--remote-debugging-port=0", `--user-data-dir=${profile}`, "about:blank"], { stdio: ["ignore", "ignore", "pipe"] });
  const wsUrl = await new Promise((resolve, reject) => {
    let buffer = "";
    chrome.stderr.on("data", (chunk) => { buffer += chunk; const match = buffer.match(/DevTools listening on (ws:\S+)/); if (match) resolve(match[1]); });
    setTimeout(() => reject(new Error("Chromeの起動がタイムアウトしました")), 20000);
  });
  const port = new URL(wsUrl).port;
  const target = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find((item) => item.type === "page");
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve) => { ws.onopen = resolve; });
  let id = 0;
  const waits = new Map();
  ws.onmessage = (event) => { const message = JSON.parse(event.data); if (message.id && waits.has(message.id)) { waits.get(message.id)(message); waits.delete(message.id); } };
  const send = (method, params = {}) => new Promise((resolve) => { const i = ++id; waits.set(i, resolve); ws.send(JSON.stringify({ id: i, method, params })); });

  await send("Page.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: WIDTH, height: HEIGHT, deviceScaleFactor: 1, mobile: false });
  await send("Emulation.setScrollbarsHidden", { hidden: true });
  const { result: { frameTree } } = await send("Page.getFrameTree");
  const shots = [];
  for (const svg of svgs) {
    await send("Page.setDocumentContent", { frameId: frameTree.frame.id, html: `<!doctype html><style>html,body{margin:0;background:${COLORS.background}}svg{display:block}</style>${svg}` });
    await new Promise((resolve) => setTimeout(resolve, 400));
    const shot = await send("Page.captureScreenshot", { format: "png", clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT, scale: 1 } });
    shots.push(Buffer.from(shot.result.data, "base64"));
  }
  await send("Browser.close").catch(() => {});
  ws.close();
  chrome.kill();
  await new Promise((resolve) => setTimeout(resolve, 1500));
  try { fs.rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 400 }); } catch { /* 一時フォルダの削除に失敗しても画像には影響しない */ }
  return shots;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const names = Object.keys(FRAMES);
  const svgs = names.map((name) => svgFor(FRAMES[name]));
  const shots = await renderSvgs(svgs);
  names.forEach((name, index) => {
    fs.writeFileSync(path.join(HERE, `${name}.svg`), svgs[index]);
    fs.writeFileSync(path.join("public", "history", `${name}.png`), shots[index]);
    console.log(name, shots[index].length, "bytes");
  });
  process.exit(0);
}
