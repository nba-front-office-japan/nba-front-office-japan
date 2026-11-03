import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/lib/site";
import { SHARE_IMAGE_SIZE } from "@/lib/news/share-image";

// シェア用画像(1200×630)のテンプレート。写真などの外部画像は使わず、文字と図形だけで描く。
// 色は NEWS(THE BREAK)の紺・赤・黄に合わせたダーク基調。

const COLORS = {
  background: "#0e1628",
  panel: "#192a4b",
  red: "#bd2a37",
  yellow: "#eabf36",
  paper: "#fff9e9",
  muted: "rgba(255, 249, 233, 0.72)",
};

// 日本語フォント(Noto Sans JP Bold、JIS第1・第2水準などに絞ったもの。SIL Open Font License)。
// サーバー起動後の最初の1回だけ読み込み、以降は使い回す。
let fontPromise: Promise<Buffer> | null = null;
function loadFont(): Promise<Buffer> {
  fontPromise ??= readFile(join(process.cwd(), "assets/fonts/NotoSansJP-Bold.ttf"));
  return fontPromise;
}

// 見出しの長さに合わせて文字の大きさを選ぶ(長い見出しほど小さく。最大3行、それでも収まらなければ末尾を「…」で省略)
const HEADLINE_WIDTH = 1056;
const MAX_LINES = 3;
const LINE_HEIGHT = 1.3;
const HEADLINE_SIZES = [76, 68, 60, 54, 48];

function textWidthEm(text: string): number {
  let em = 0;
  for (const ch of text) {
    const code = ch.codePointAt(0) ?? 0;
    // 半角の英数字・記号は全角の約0.6文字分
    em += code < 0x2000 || (code >= 0xff61 && code <= 0xff9f) ? 0.6 : 1;
  }
  return em;
}

function headlineLayout(headline: string): { fontSize: number; text: string } {
  const em = textWidthEm(headline);
  for (const size of HEADLINE_SIZES) {
    const perLine = Math.floor(HEADLINE_WIDTH / size);
    // 折り返しで行末に少し余りが出る分を見込んで、1行あたり1文字分の余裕を取る
    if (em <= (perLine - 1) * MAX_LINES) return { fontSize: size, text: headline };
  }
  const size = HEADLINE_SIZES[HEADLINE_SIZES.length - 1];
  const limit = (Math.floor(HEADLINE_WIDTH / size) - 1) * MAX_LINES - 1;
  let out = "";
  let used = 0;
  for (const ch of headline) {
    const w = textWidthEm(ch);
    if (used + w > limit) break;
    out += ch;
    used += w;
  }
  return { fontSize: size, text: `${out.trimEnd()}…` };
}

export interface ShareCardContent {
  /** 記事のカテゴリ名(無ければ表示しない) */
  category?: string | null;
  /** 記事の見出し(無ければサイト名だけの画像になる) */
  headline?: string | null;
  /** 公開日の表示(例: 2026年11月3日) */
  dateLabel?: string | null;
}

export async function renderShareCard(
  content: ShareCardContent,
  init: { headers?: Record<string, string> } = {}
): Promise<ImageResponse> {
  const font = await loadFont();
  const headline = content.headline ? headlineLayout(content.headline) : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          overflow: "hidden",
          background: COLORS.background,
          color: COLORS.paper,
          fontFamily: "Noto Sans JP",
          padding: "56px 72px 52px",
        }}
      >
        {/* 右上の黄色い輪(NEWS ページと同じ図形) */}
        <div
          style={{
            position: "absolute",
            top: -250,
            right: -190,
            width: 460,
            height: 460,
            borderRadius: 9999,
            border: `48px solid ${COLORS.yellow}`,
            display: "flex",
          }}
        />
        {/* 左端の赤い帯 */}
        <div style={{ position: "absolute", top: 0, left: 0, width: 14, height: "100%", background: COLORS.red, display: "flex" }} />
        {/* 下端の紺の帯 */}
        <div style={{ position: "absolute", left: 0, bottom: 0, width: "100%", height: 112, background: COLORS.panel, display: "flex" }} />

        {/* 上: カテゴリ */}
        <div style={{ display: "flex", height: 58, alignItems: "flex-start" }}>
          {content.category ? (
            <div
              style={{
                display: "flex",
                padding: "8px 20px",
                background: content.category === "BREAKING" ? "#d71920" : COLORS.red,
                color: COLORS.paper,
                fontSize: 30,
                letterSpacing: "0.08em",
                lineHeight: 1.2,
              }}
            >
              {content.category}
            </div>
          ) : null}
        </div>

        {/* 中: 見出し(見出しが無いときはサイト名を大きく出す) */}
        <div style={{ display: "flex", flexGrow: 1, alignItems: "center", paddingRight: 24, paddingBottom: 112 - 52 }}>
          {headline ? (
            <div
              style={{
                display: "block",
                width: HEADLINE_WIDTH,
                fontSize: headline.fontSize,
                lineHeight: LINE_HEIGHT,
                letterSpacing: "-0.01em",
                lineClamp: MAX_LINES,
                textOverflow: "ellipsis",
                overflow: "hidden",
                maxHeight: Math.ceil(headline.fontSize * LINE_HEIGHT * MAX_LINES) + 4,
              }}
            >
              {headline.text}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", fontSize: 92, lineHeight: 1.05, letterSpacing: "-0.02em" }}>NBA Front Office</div>
              <div style={{ display: "flex", fontSize: 92, lineHeight: 1.05, color: COLORS.yellow }}>Japan</div>
              <div style={{ display: "flex", marginTop: 24, fontSize: 32, color: COLORS.muted }}>NBAのニュース・スタッツ・年俸を日本語で</div>
            </div>
          )}
        </div>

        {/* 下: サイト名と公開日 */}
        <div
          style={{
            position: "absolute",
            left: 72,
            right: 72,
            bottom: 0,
            height: 112,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", fontSize: 34, color: COLORS.yellow, letterSpacing: "0.02em" }}>
            {SITE_NAME}
          </div>
          {content.dateLabel ? (
            <div style={{ display: "flex", fontSize: 28, color: COLORS.muted }}>{content.dateLabel}</div>
          ) : null}
        </div>
      </div>
    ),
    {
      ...SHARE_IMAGE_SIZE,
      fonts: [{ name: "Noto Sans JP", data: font, weight: 700, style: "normal" }],
      headers: init.headers,
    }
  );
}
