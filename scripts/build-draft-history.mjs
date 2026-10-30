// 過去のNBAドラフト(1983〜2025)の年別CSVから、/draft で使う lib/draft/draft-history.json を作る。
// 使い方: node scripts/build-draft-history.mjs <exports/draft-history フォルダのパス>
// CSV本体はリポジトリに含めない。データを直したらCSVを更新してこのスクリプトを再実行する。
import fs from "node:fs";
import path from "node:path";

const OUTPUT = path.join("lib", "draft", "draft-history.json");

// 機械的にカタカナ化しただけの名前(Name Source = generated)は公開せず、確認済みになるまで英語名で表示する
const UNVERIFIED_NAME_SOURCE = "generated";

// CSVの Note のうち公開するもの(指名の無効・補償ピック)。トレードの経緯はTeam欄の「→」で分かるため載せない
const PICK_NOTES = {
  "1983-24": "ステピエン時代に手放した指名権の補償ピック",
  "1983-97": "手続き上の理由で指名は無効",
  "1985-9": "ステピエン時代に手放した指名権の補償ピック",
  "1985-77": "ドラフト時点で21歳未満だったため指名は無効",
  "1986-8": "ステピエン時代に手放した指名権の補償ピック",
};

// 元記事で別人の行に同じ選手名が入っている指名。身長・体重を同名の選手から流用しない
const NO_MEASUREMENTS = new Set(["1987-62"]);

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  const body = text.replace(/^﻿/, "");
  for (let i = 0; i < body.length; i++) {
    const c = body[i];
    if (quoted) {
      if (c === '"' && body[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') {
        quoted = false;
      } else {
        cell += c;
      }
    } else if (c === '"') {
      quoted = true;
    } else if (c === ",") {
      row.push(cell);
      cell = "";
    } else if (c === "\n") {
      row.push(cell.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += c;
    }
  }
  if (cell || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

const text = (value) => {
  const trimmed = value.trim();
  return trimmed === "" || trimmed === "–" ? null : trimmed;
};

const number = (value) => (value.trim() === "" ? null : Number(value));

function toPick(year, row) {
  const key = `${year}-${row["Overall"]}`;
  const measured = !NO_MEASUREMENTS.has(key);
  return {
    round: Number(row["Round"]),
    pickInRound: Number(row["Pick"]),
    overallPick: Number(row["Overall"]),
    playerNameJa: row["Name Source"] === UNVERIFIED_NAME_SOURCE ? null : text(row["Player (JA)"]),
    playerNameEn: row["Player (EN)"].trim(),
    teamDisplay: row["Team"].trim(),
    position: text(row["POS"]),
    preDraftTeam: text(row["Pre-Draft Team"]),
    heightCm: measured ? number(row["Height"]) : null,
    weightKg: measured ? number(row["Weight"]) : null,
    nationality: text(row["Nationality"]),
    note: PICK_NOTES[key] ?? null,
  };
}

const sourceDir = process.argv[2];
if (!sourceDir) {
  console.error("使い方: node scripts/build-draft-history.mjs <exports/draft-history フォルダのパス>");
  process.exit(1);
}

const history = {};
const files = fs.readdirSync(sourceDir).filter((name) => /^\d{4}-nba-draft\.csv$/.test(name)).sort();
for (const file of files) {
  const year = Number(file.slice(0, 4));
  const [header, ...rows] = parseCsv(fs.readFileSync(path.join(sourceDir, file), "utf8"));
  history[year] = rows
    .filter((cells) => cells.length === header.length)
    .map((cells) => toPick(year, Object.fromEntries(header.map((name, i) => [name, cells[i]]))))
    .sort((a, b) => a.overallPick - b.overallPick);
}

const lines = Object.entries(history).map(
  ([year, picks]) => `  "${year}": [\n${picks.map((pick) => `    ${JSON.stringify(pick)}`).join(",\n")}\n  ]`
);
fs.writeFileSync(OUTPUT, `{\n${lines.join(",\n")}\n}\n`);

const picks = Object.values(history).flat();
console.log(`${files.length}年分 ${picks.length}件`);
console.log(`英語名で表示: ${picks.filter((pick) => pick.playerNameJa === null).length}件`);
