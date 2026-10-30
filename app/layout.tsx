import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SiteAnalytics } from "@/components/site-analytics";
import { SiteFooter } from "@/components/site-footer";
import { SITE_NAME, SITE_URL, SOCIAL_LINKS } from "@/lib/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "NBA Front Office Japan",
  description:
    "NBAの選手・チーム・スタッツ・年俸情報を日本語で提供するファンサイト",
  // アイコンと共有画像は app/ 直下の favicon.ico・icon.png・apple-icon.png・
  // opengraph-image.jpg・twitter-image.jpg から Next.js が自動で出力する。
  openGraph: {
    siteName: "NBA Front Office Japan",
    locale: "ja_JP",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

// 検索エンジン向けに、サイトと公式SNSアカウントのつながりを示す構造化データ
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/icon.png`,
  sameAs: SOCIAL_LINKS.map((s) => s.url),
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd).replace(/</g, "\\u003c") }}
        />
        {children}
        <SiteFooter />
        <SiteAnalytics />
      </body>
    </html>
  );
}
