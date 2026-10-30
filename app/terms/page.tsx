import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/legal/legal-page";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `利用規約 | ${SITE_NAME}`,
  description: `${SITE_NAME}の利用規約です。サイトをご利用いただく際の条件を定めています。`,
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LegalPage title="利用規約" updated="2026年10月30日">
      <p>この利用規約（以下「本規約」）は、{SITE_NAME}（以下「当サイト」）の利用条件を定めるものです。当サイトをご利用いただいた時点で、本規約に同意したものとみなします。</p>
      <LegalSection heading="第1条（掲載情報）">
        <p>当サイトの試合結果・スタッツ・年俸・ニュース等の情報は、公開情報をもとに掲載していますが、その正確性・完全性・最新性を保証するものではありません。</p>
      </LegalSection>
      <LegalSection heading="第2条（禁止事項）">
        <p>利用者は、当サイトの利用にあたり、次の行為をしてはなりません。</p>
        <ul className="list-disc pl-6">
          <li>法令または公序良俗に反する行為</li>
          <li>当サイトの文章・画像・データを無断で転載・複製・販売する行為</li>
          <li>当サイトのサーバーに過度な負担をかける行為（大量の自動アクセス・データ収集など）</li>
          <li>当サイトの運営を妨げる行為、または第三者に不利益を与える行為</li>
        </ul>
      </LegalSection>
      <LegalSection heading="第3条（著作権）">
        <p>当サイトに掲載する文章・画像等の著作権は、当サイトまたは正当な権利者に帰属します。引用の範囲を超える利用はできません。チーム名・ロゴ等の商標は各権利者に帰属します。</p>
      </LegalSection>
      <LegalSection heading="第4条（免責）">
        <p>当サイトの利用によって生じた損害について、当サイトは一切の責任を負いません。また、当サイトは予告なく内容の変更・サービスの停止を行うことがあります。</p>
      </LegalSection>
      <LegalSection heading="第5条（規約の変更）">
        <p>当サイトは、必要と判断した場合、利用者に通知することなく本規約を変更できます。変更後の規約は、このページに掲載した時点から効力を持つものとします。</p>
      </LegalSection>
      <LegalSection heading="第6条（準拠法）">
        <p>本規約の解釈には日本法を準拠法とします。</p>
      </LegalSection>
      <LegalSection heading="お問い合わせ">
        <p>
          本規約に関するお問い合わせは、
          <Link href="/contact" className="text-blue hover:underline">お問い合わせページ</Link>
          からお願いいたします。
        </p>
      </LegalSection>
    </LegalPage>
  );
}
