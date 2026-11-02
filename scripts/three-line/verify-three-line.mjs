// three-line-01〜04を検証し、4枚を並べた確認用画像を scripts/three-line/three-line-preview.png に作る
// 実行: node scripts/three-line/verify-three-line.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { ARC_RADIUS, HEIGHT, ORIGIN, renderSvgs, RIM, SCALE, SHORT_RADIUS, WIDTH } from "./build-three-line.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const NAMES = ["three-line-01", "three-line-02", "three-line-03", "three-line-04"];
const svgs = NAMES.map((name) => fs.readFileSync(path.join(HERE, `${name}.svg`), "utf8"));
const raw = async (input) => (await sharp(input).removeAlpha().raw().toBuffer({ resolveWithObject: true })).data;
let failed = 0;
const report = (ok, message) => { if (!ok) failed++; console.log(`${ok ? "OK" : "NG"}  ${message}`); };

// 1. サイズ
for (const name of NAMES) {
  const meta = await sharp(path.join("public", "history", `${name}.png`)).metadata();
  report(meta.width === WIDTH && meta.height === HEIGHT && meta.format === "png", `${name}.png ${meta.width}×${meta.height} ${meta.format}`);
}

// 2. 02と04の線の座標
const pointsOf = (svg, id) => svg.match(new RegExp(`id="${id}" points="([^"]+)"`))?.[1];
const line2 = pointsOf(svgs[1], "line-23ft9in");
const line4 = pointsOf(svgs[3], "line-23ft9in");
report(Boolean(line2) && line2 === line4, `02と04の線の座標が一致(${line2.split(" ").length}点)`);
const noYear = (svg) => svg.replace(/<text[^>]*font-size="128"[^>]*>[^<]*<\/text>/, "");
report(noYear(svgs[1]) === noYear(svgs[3]), "02と04のSVGは年号ラベル以外が同一");

// 3. 01の線の距離を座標から計算し直す
const feet = (text) => text.split(" ").map((pair) => { const [x, y] = pair.split(",").map(Number); return { x: (x - ORIGIN.x) / SCALE, y: (y - ORIGIN.y) / SCALE }; });
const distance = (p) => Math.hypot(p.x - RIM.x, p.y - RIM.y);
const within = (value, expected) => Math.abs(value - expected) / expected;
const gold = feet(pointsOf(svgs[0], "line-23ft9in"));
const corners = [gold[0], gold[gold.length - 1]];
const arc = gold.slice(1, -1);
const arcDistances = arc.map(distance);
const arcMax = Math.max(...arcDistances.map((d) => within(d, ARC_RADIUS)));
report(arcMax <= 0.01, `金色アーク ${Math.min(...arcDistances).toFixed(3)}〜${Math.max(...arcDistances).toFixed(3)}ft / 目標23.75ft / 最大誤差${(arcMax * 100).toFixed(3)}%`);
const cornerDistances = corners.map((p) => Math.abs(p.x - RIM.x));
const cornerMax = Math.max(...cornerDistances.map((d) => within(d, 22)));
report(cornerMax <= 0.01, `コーナー直線 ゴール中心から${cornerDistances.map((d) => d.toFixed(3)).join(" / ")}ft / 目標22ft / 最大誤差${(cornerMax * 100).toFixed(3)}%`);
console.log(`    直線とアークの接続点 エンドラインから${arc[0].y.toFixed(3)}ft、サイドラインから${(50 - arc[0].x).toFixed(3)}ft`);
const white = feet(pointsOf(svgs[0], "line-22ft"));
const whiteDistances = white.map(distance);
const whiteMax = Math.max(...whiteDistances.map((d) => within(d, SHORT_RADIUS)));
report(whiteMax <= 0.01, `全周22ft ${Math.min(...whiteDistances).toFixed(3)}〜${Math.max(...whiteDistances).toFixed(3)}ft / 目標22ft / 最大誤差${(whiteMax * 100).toFixed(3)}%`);
report(Math.abs(white[0].y) < 0.03 && Math.abs(white[white.length - 1].y) < 0.03, `全周22ftの両端がエンドライン上 (y=${white[0].y.toFixed(3)}, ${white[white.length - 1].y.toFixed(3)}ft)`);

// 4. コートの外枠・ゴール・ペイントの重なり
const courtOf = (svg) => svg.match(/<g id="court"[\s\S]*?<\/g>/)[0];
report(svgs.every((svg) => courtOf(svg) === courtOf(svgs[0])), "4枚のSVGでコートの記述が完全に同一");
const [base, ...overlays] = await renderSvgs([svgs[0].replace(/<g id="overlay">[\s\S]*<\/g>\n<\/svg>/, "</svg>"), ...svgs.map((svg) => svg.replace(/<g id="court"[\s\S]*?<\/g>\n/, ""))]);
const baseRaw = await raw(base);
const empty = await raw(await renderSvgs([svgs[0].replace(/<g id="court"[\s\S]*?<\/g>\n/, "").replace(/<g id="overlay">[\s\S]*<\/g>\n<\/svg>/, "</svg>")]).then((shots) => shots[0]));
const same = (a, b, i) => a[i * 3] === b[i * 3] && a[i * 3 + 1] === b[i * 3 + 1] && a[i * 3 + 2] === b[i * 3 + 2];
const total = WIDTH * HEIGHT;
const courtPixels = [];
for (let i = 0; i < total; i++) if (!same(baseRaw, empty, i)) courtPixels.push(i);
for (let index = 0; index < NAMES.length; index++) {
  const png = await raw(path.join("public", "history", `${NAMES[index]}.png`));
  const overlay = await raw(overlays[index]);
  const covered = new Uint8Array(total);
  for (let i = 0; i < total; i++) {
    if (same(overlay, empty, i)) continue;
    const x = i % WIDTH; const y = (i - x) / WIDTH;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const nx = x + dx; const ny = y + dy; if (nx >= 0 && ny >= 0 && nx < WIDTH && ny < HEIGHT) covered[ny * WIDTH + nx] = 1; }
  }
  const moved = courtPixels.filter((i) => !covered[i] && !same(png, baseRaw, i)).length;
  const hidden = courtPixels.filter((i) => covered[i]).length;
  report(moved === 0, `${NAMES[index]}: コート由来${courtPixels.length}画素のうち、線やラベルの下を除いて差分${moved}画素(線やラベルの下 ${hidden}画素)`);
}

// 5. 確認用の並べた画像
const tile = { width: 800, height: 600 };
const composite = await Promise.all(NAMES.map(async (name, index) => ({ input: await sharp(path.join("public", "history", `${name}.png`)).resize(tile.width, tile.height).toBuffer(), left: 12 + (index % 2) * (tile.width + 12), top: 12 + Math.floor(index / 2) * (tile.height + 12) })));
const previewPath = path.join(HERE, "three-line-preview.png");
await sharp({ create: { width: tile.width * 2 + 36, height: tile.height * 2 + 36, channels: 3, background: "#4a4b4e" } }).composite(composite).png().toFile(previewPath);
console.log("preview:", path.resolve(previewPath));
console.log(failed ? `NG ${failed}件` : "すべてOK");
process.exit(failed ? 1 : 0);
