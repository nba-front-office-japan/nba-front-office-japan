import { Oswald, UnifrakturCook } from "next/font/google";

// 試合結果ページ(新聞紙風)だけで使う書体。どちらも SIL Open Font License(商用利用可)。
// 見出しの英字: シカゴ・トリビューンの題字に近いブラックレター。スコアの数字: 細長い Oswald。
const blackletter = UnifrakturCook({ weight: "700", subsets: ["latin"], variable: "--font-np-blackletter", display: "swap" });
const numeral = Oswald({ weight: ["500", "700"], subsets: ["latin"], variable: "--font-np-numeral", display: "swap" });

export const NEWSPAPER_FONT_CLASS = `${blackletter.variable} ${numeral.variable}`;
