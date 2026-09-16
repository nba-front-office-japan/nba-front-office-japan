import { createHash } from "crypto";

// タイトル・要約などから内容の指紋を作る。将来の重複/類似判定（Phase C以降の
// event resolver）で使う想定で、Phase Bでは保存するだけ。
export function computeContentHash(parts: (string | null | undefined)[]): string {
  const normalized = parts
    .map((part) => (part ?? "").trim().toLowerCase().replace(/\s+/g, " "))
    .join("|");
  return createHash("sha256").update(normalized).digest("hex");
}
