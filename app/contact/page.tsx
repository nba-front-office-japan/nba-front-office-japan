import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/legal/legal-page";
import { CONTACT_FORM_URL, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `お問い合わせ | ${SITE_NAME}`,
  description: `${SITE_NAME}へのお問い合わせはこちらから。掲載内容の誤り、ご意見・ご要望、取材や掲載のご相談を受け付けています。`,
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <LegalPage title="お問い合わせ">
      <LegalSection heading="お問い合わせについて">
        <p>{SITE_NAME}へのご連絡は、下記のお問い合わせフォームからお願いいたします。</p>
        <ul className="list-disc pl-6">
          <li>掲載内容（スタッツ・年俸・記事など）の誤りのご指摘</li>
          <li>サイトへのご意見・ご要望</li>
          <li>取材・掲載・その他のご相談</li>
        </ul>
        {CONTACT_FORM_URL ? (
          <p className="pt-2">
            <a
              href={CONTACT_FORM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-navy px-6 py-3 text-[14px] font-bold text-white hover:bg-gold hover:text-navy"
            >
              お問い合わせフォームを開く
            </a>
          </p>
        ) : (
          <p className="pt-2 font-bold">お問い合わせフォームは準備中です。</p>
        )}
      </LegalSection>
      <LegalSection heading="ご注意">
        <p>いただいたお問い合わせには順次対応しますが、内容によってはお返事できない場合や、お時間をいただく場合があります。あらかじめご了承ください。</p>
        <p>
          お問い合わせでいただいた個人情報は、お返事のためにのみ利用します。詳しくは
          <Link href="/privacy" className="text-blue hover:underline">プライバシーポリシー</Link>
          をご覧ください。
        </p>
      </LegalSection>
    </LegalPage>
  );
}
