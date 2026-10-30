import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/legal/legal-page";
import { OPERATOR_NAME, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `プライバシーポリシー | ${SITE_NAME}`,
  description: `${SITE_NAME}のプライバシーポリシーです。個人情報の取り扱い、アクセス解析、広告配信、Cookieについて説明します。`,
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalPage title="プライバシーポリシー" updated="2026年10月30日">
      <p>
        {SITE_NAME}（以下「当サイト」）は、利用者の個人情報を適切に取り扱うため、以下のとおりプライバシーポリシーを定めます。
      </p>
      <LegalSection heading="個人情報の取得と利用目的">
        <p>
          当サイトでは、お問い合わせの際にお名前・メールアドレス等の個人情報をご入力いただく場合があります。
          取得した個人情報は、お問い合わせへの回答や必要なご連絡のためにのみ利用し、それ以外の目的では利用しません。
        </p>
      </LegalSection>
      <LegalSection heading="個人情報の第三者への提供">
        <p>当サイトは、法令に基づく場合を除き、ご本人の同意なく個人情報を第三者に提供しません。</p>
      </LegalSection>
      <LegalSection heading="アクセス解析について">
        <p>
          当サイトでは、サイトの改善のためにアクセス解析ツール（Vercel Web Analytics）を利用しています。
          このツールは閲覧されたページや参照元などの情報を、個人を特定しない形で集計するもので、Cookieを使用しません。
        </p>
      </LegalSection>
      <LegalSection heading="広告の配信について">
        <p>
          当サイトは、第三者配信の広告サービス（Google アドセンス等）を利用することがあります。
          広告配信事業者は、利用者の興味に応じた広告を表示するためにCookieを使用することがあります。
          Cookieを無効にする方法やGoogle アドセンスに関する詳細は、
          <a href="https://policies.google.com/technologies/ads?hl=ja" target="_blank" rel="noopener noreferrer" className="text-blue hover:underline">
            Googleの広告に関するポリシー
          </a>
          をご覧ください。利用者はブラウザの設定によりCookieを無効にできます。
        </p>
      </LegalSection>
      <LegalSection heading="アフィリエイトプログラムについて">
        <p>当サイトは、商品やサービスを紹介するアフィリエイトプログラムに参加することがあります。紹介リンクから商品を購入された場合、当サイトに報酬が支払われることがあります。</p>
      </LegalSection>
      <LegalSection heading="外部サービスの埋め込みについて">
        <p>
          記事には、X（旧Twitter）・YouTube・Instagram・TikTokなどの投稿を埋め込む場合があります。
          埋め込まれたコンテンツを表示すると、各サービスが利用者の情報を取得することがあります。取り扱いは各サービスのプライバシーポリシーに従います。
        </p>
      </LegalSection>
      <LegalSection heading="免責事項">
        <p>
          当サイトに掲載する情報は、できる限り正確な内容を掲載するよう努めていますが、その正確性・安全性を保証するものではありません。
          当サイトの情報を利用したことで生じた損害について、当サイトは責任を負いかねます。
          当サイトからリンクした外部サイトの内容についても責任を負いません。
        </p>
      </LegalSection>
      <LegalSection heading="著作権について">
        <p>
          当サイトの文章・画像等の無断転載を禁止します。引用の際は出典として当サイト名とURLを明記してください。
          当サイトで紹介するチーム名・ロゴ等の権利は各権利者に帰属します。
        </p>
      </LegalSection>
      <LegalSection heading="プライバシーポリシーの変更">
        <p>当サイトは、必要に応じて本ポリシーを変更することがあります。変更後の内容は、このページに掲載した時点から効力を持つものとします。</p>
      </LegalSection>
      <LegalSection heading="お問い合わせ窓口">
        <p>
          本ポリシーに関するお問い合わせは、
          <Link href="/contact" className="text-blue hover:underline">お問い合わせページ</Link>
          からお願いいたします。
        </p>
        <p>運営者：{OPERATOR_NAME}</p>
      </LegalSection>
    </LegalPage>
  );
}
