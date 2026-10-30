import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/legal/legal-page";
import { OPERATOR_NAME, SITE_NAME, SITE_URL, SOCIAL_LINKS } from "@/lib/site";

export const metadata: Metadata = {
  title: `運営者情報 | ${SITE_NAME}`,
  description: `${SITE_NAME}の運営者情報です。サイトの目的、掲載している情報、お問い合わせ先をご案内します。`,
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <LegalPage title="運営者情報">
      <LegalSection heading="サイトについて">
        <p>
          {SITE_NAME}は、NBAの試合結果・選手スタッツ・年俸・トレードや移籍のニュースを日本語で届けるNBAファンサイトです。
          勝敗だけでなく、契約・ドラフト・ロスター構築といった「フロントオフィスの意思決定」の視点からNBAを深く楽しめる情報を目指しています。
        </p>
      </LegalSection>
      <LegalSection heading="運営情報">
        <dl className="grid grid-cols-[7em_1fr] gap-y-2 border-y border-line py-4 text-[14px]">
          <dt className="font-bold">サイト名</dt>
          <dd>{SITE_NAME}</dd>
          <dt className="font-bold">URL</dt>
          <dd className="break-all">{SITE_URL}</dd>
          <dt className="font-bold">運営者</dt>
          <dd>{OPERATOR_NAME}</dd>
          {SOCIAL_LINKS.map((s) => (
            <div key={s.label} className="contents">
              <dt className="font-bold">{s.label}</dt>
              <dd className="break-all">
                <a href={s.url} target="_blank" rel="noopener noreferrer me" className="text-blue hover:underline">
                  {s.url}
                </a>
              </dd>
            </div>
          ))}
          <dt className="font-bold">お問い合わせ</dt>
          <dd>
            <Link href="/contact" className="text-blue hover:underline">
              お問い合わせページ
            </Link>
          </dd>
        </dl>
      </LegalSection>
      <LegalSection heading="掲載情報について">
        <p>
          スタッツ・年俸・試合結果などのデータは、公開されている情報をもとに掲載しています。正確な情報の掲載に努めていますが、内容の正確性・最新性を保証するものではありません。
          誤りにお気づきの際は、お問い合わせページからお知らせください。
        </p>
        <p>当サイトはNBA（National Basketball Association）及び各チームとは関係のない、非公式のファンサイトです。</p>
      </LegalSection>
    </LegalPage>
  );
}
