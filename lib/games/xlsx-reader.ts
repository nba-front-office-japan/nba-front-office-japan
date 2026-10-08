// .xlsx ファイルから、シートごとの表(セルの値)を読み取る(サーバー専用)。
// 新しいライブラリは使わず、zip の展開は Node の zlib、XML の読み取りは既存の fast-xml-parser で行う。
// 数式は計算結果(保存されている値)を読み、日付は Excel のシリアル値(数値)のまま返す(excelSerialToDate で変換)。

import "server-only";
import { inflateRawSync } from "node:zlib";
import { XMLParser } from "fast-xml-parser";

export type CellValue = string | number | boolean | null;
export type SheetRows = CellValue[][];

/** zip の中身(ファイル名 → 内容)。xlsx の読み取りに必要な範囲だけを実装している */
function unzip(buf: Buffer): Map<string, Buffer> {
  // End of Central Directory を末尾から探す
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65_557); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("Excelファイル（.xlsx）として読み取れませんでした。");
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const files = new Map<string, Buffer>();
  for (let n = 0; n < count; n++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error("Excelファイルの構造が正しくありません。");
    const method = buf.readUInt16LE(p + 10);
    const compSize = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const localOffset = buf.readUInt32LE(p + 42);
    const name = buf.toString("utf8", p + 46, p + 46 + nameLen);
    const lNameLen = buf.readUInt16LE(localOffset + 26);
    const lExtraLen = buf.readUInt16LE(localOffset + 28);
    const start = localOffset + 30 + lNameLen + lExtraLen;
    const data = buf.subarray(start, start + compSize);
    if (method === 0) files.set(name, Buffer.from(data));
    else if (method === 8) files.set(name, inflateRawSync(data));
    p += 46 + nameLen + extraLen + commentLen;
  }
  return files;
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  // x:sheet のような名前空間付きの書き方でも読めるよう、名前空間の接頭辞を外す(r:id は id になる)
  removeNSPrefix: true,
  parseTagValue: false,
  trimValues: false,
  isArray: (name) => ["sheet", "Relationship", "si", "r", "row", "c"].includes(name),
});

type XmlNode = Record<string, unknown>;

function textOf(node: unknown): string {
  if (node === undefined || node === null) return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  const n = node as XmlNode;
  if ("#text" in n) return String(n["#text"]);
  // リッチテキスト(<r><t>…</t></r>)
  if ("r" in n) return textOf((n.r as XmlNode[]).map((r) => r.t));
  if ("t" in n) return textOf(n.t);
  return "";
}

function columnIndex(ref: string): number {
  const letters = /^[A-Z]+/.exec(ref)?.[0] ?? "A";
  let idx = 0;
  for (const ch of letters) idx = idx * 26 + (ch.charCodeAt(0) - 64);
  return idx - 1;
}

/** シート名 → 行の配列(1行目から。空の行も位置を保つ) */
export function readXlsx(buf: Buffer): Map<string, SheetRows> {
  const files = unzip(buf);
  const read = (path: string) => {
    const f = files.get(path);
    return f ? (parser.parse(f.toString("utf8")) as XmlNode) : null;
  };

  const workbook = read("xl/workbook.xml");
  const rels = read("xl/_rels/workbook.xml.rels");
  if (!workbook || !rels) throw new Error("Excelファイル（.xlsx）として読み取れませんでした。");

  const relTarget = new Map(
    (((rels.Relationships as XmlNode).Relationship as XmlNode[]) ?? []).map((r) => [String(r["@_Id"]), String(r["@_Target"])])
  );
  const shared = read("xl/sharedStrings.xml");
  const sst = shared?.sst as XmlNode | undefined;
  const sharedStrings = sst && typeof sst === "object" ? ((sst.si as XmlNode[]) ?? []).map((si) => textOf(si)) : [];

  const sheets = new Map<string, SheetRows>();
  for (const s of ((workbook.workbook as XmlNode).sheets as XmlNode).sheet as XmlNode[]) {
    const target = relTarget.get(String(s["@_id"]));
    if (!target) continue;
    const path = target.startsWith("/") ? target.slice(1) : `xl/${target.replace(/^\.\//, "")}`;
    const sheet = read(path);
    const rows: SheetRows = [];
    const sheetData = (sheet?.worksheet as XmlNode | undefined)?.sheetData as XmlNode | undefined;
    for (const row of (sheetData?.row as XmlNode[]) ?? []) {
      const r = Number(row["@_r"]) - 1;
      const values: CellValue[] = [];
      for (const c of (row.c as XmlNode[]) ?? []) {
        const col = columnIndex(String(c["@_r"] ?? ""));
        const type = String(c["@_t"] ?? "n");
        const raw = textOf(c.v);
        let value: CellValue = null;
        if (type === "s") value = sharedStrings[Number(raw)] ?? "";
        else if (type === "inlineStr") value = textOf(c.is);
        else if (type === "str") value = raw;
        // 日付型(ISO形式の文字列。例: 2026-10-03T00:00:00.000Z)
        else if (type === "d") value = raw;
        else if (type === "b") value = raw === "1";
        else if (type === "e") value = null;
        else value = raw === "" ? null : Number(raw);
        values[col] = value;
      }
      rows[r] = Array.from({ length: values.length }, (_, i) => values[i] ?? null);
    }
    sheets.set(String(s["@_name"]), Array.from({ length: rows.length }, (_, i) => rows[i] ?? []));
  }
  return sheets;
}

/** Excel の日付(シリアル値)を YYYY-MM-DD にする */
export function excelSerialToDate(serial: number): string {
  const ms = Math.round((serial - 25569) * 86_400_000);
  return new Date(ms).toISOString().slice(0, 10);
}
