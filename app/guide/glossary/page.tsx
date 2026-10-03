import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { BackToGuide, GuideHeader, GuideTitle, OfficialSourcesSection, Section } from "@/components/guide-article";
import { GUIDE_PAGES, type OfficialSource } from "@/lib/guide-official";

export const metadata: Metadata = {
  title: "NBA用語集 | NBAガイド | NBA Front Office Japan",
  description:
    "NBAの契約やサラリーキャップに関する用語を、1〜2文で説明する用語集です。2-way契約、Exhibit 10、10日間契約、RFA、UFA、MLE、Bird Rights、Cap Hold、Qualifying Offer、Player Option、Team Option、Non-Bird Rights、Sign-and-Tradeを掲載しています。",
};

// 各用語を1〜2文で説明する入口ページ。詳しいガイドがある用語は、内容を重複させずにリンクで案内する。
// 短い定義のみの用語は、CBA 101で確認した内容にもとづく:
//   - Cap Hold：II.K(2)(球団のフリーエージェントは、権利を放棄するまで以前の年俸に一定の倍率をかけた額がTeam Salaryに含まれる)
//   - Qualifying Offer：II.N(2)(b)(優先交渉権を得るための1年契約のオファー)
//   - Player Option / Team Option：II.G(8)(選手または球団が契約を1年延ばせるオプション)
//   - Non-Bird Rights：II.B(2)(c)(Non-Bird Exception)
//   - Sign-and-Trade：II.J(1)
// 金額・割合の細かな条件は、このページでは扱わない。

type Term = {
  term: string;
  reading?: string;
  description: string;
  href?: string;
  linkLabel?: string;
};

const TERMS: Term[] = [
  {
    term: "2-way契約（Two-Way Contract）",
    description: "NBAのチームとGリーグのチームの両方でプレーする契約。15人のロスター枠とは別に、各チーム最大3人まで結べます。",
    href: GUIDE_PAGES["ロスター契約・短期契約"],
    linkLabel: "ロスター契約・短期契約",
  },
  {
    term: "Exhibit 10",
    description: "1シーズンの選手契約に付ける付属書。2-way契約への変更や、Gリーグでプレーした場合のボーナスを定めます。",
    href: GUIDE_PAGES["ロスター契約・短期契約"],
    linkLabel: "ロスター契約・短期契約",
  },
  {
    term: "10日間契約（10-Day Contract）",
    description: "シーズン中の1月5日から結べる短期の契約。期間は10日間と、そのチームの3試合分の長いほうです。",
    href: GUIDE_PAGES["ロスター契約・短期契約"],
    linkLabel: "ロスター契約・短期契約",
  },
  {
    term: "RFA（制限付きフリーエージェント）",
    description: "元のチームが、他チームのオファーと同じ条件で契約し直せる権利（優先交渉権）を持つフリーエージェント。",
    href: GUIDE_PAGES["RFA / UFA"],
    linkLabel: "RFA / UFA",
  },
  {
    term: "UFA（制限なしフリーエージェント）",
    description: "元のチームの優先交渉権がなく、どのチームとも自由に契約できるフリーエージェント。",
    href: GUIDE_PAGES["RFA / UFA"],
    linkLabel: "RFA / UFA",
  },
  {
    term: "MLE（ミッドレベル例外）",
    description: "サラリーキャップを超えているチームなども、一定の額まで選手と契約できる例外。チームの年俸総額によって使える種類が変わります。",
    href: GUIDE_PAGES["MLE"],
    linkLabel: "MLE",
  },
  {
    term: "Bird Rights",
    description: "一定の期間同じチームでプレーした選手と、そのチームがサラリーキャップを超えて再契約できる権利。",
    href: GUIDE_PAGES["Bird Rights"],
    linkLabel: "Bird Rights",
  },
  {
    term: "Cap Hold（キャップ・ホールド）",
    description:
      "チームのフリーエージェントについて、まだ契約していなくても、以前の年俸をもとにした額がチームの年俸総額に計上される仕組み。チームがその選手の権利を放棄（Renounce）すると、計上から外れます。",
  },
  {
    term: "Qualifying Offer（クオリファイング・オファー）",
    description: "元のチームが選手に出す1年契約のオファーで、これを出すことで、その選手をRFAにして優先交渉権を得ることができます。",
  },
  {
    term: "Player Option（プレーヤー・オプション）",
    description: "契約をもう1年延ばすかどうかを、選手が選べるオプション。",
  },
  {
    term: "Team Option（チーム・オプション）",
    description: "契約をもう1年延ばすかどうかを、チームが選べるオプション。",
  },
  {
    term: "Non-Bird Rights（ノン・バード）",
    description:
      "Bird RightsやEarly Bird Rightsを持たない自チームのフリーエージェントとも、前の契約の年俸などをもとにした上限の範囲で、サラリーキャップを超えて再契約できる例外。",
  },
  {
    term: "Sign-and-Trade（サイン・アンド・トレード）",
    description: "フリーエージェントの選手が元のチームと契約し、他チームとの合意にもとづいて、そのままトレードされる取引。契約の長さや時期などに条件があります。",
  },
];

const SOURCES: OfficialSource[] = [
  {
    title: "CBA 101: Highlights of the Collective Bargaining Agreement（PDF・英語）",
    publisher: "NBA",
    date: "2024年11月作成",
    href: "https://official.nba.com/wp-content/uploads/sites/4/2024/11/2024-25-CBA-101.pdf",
    note: "II.B(2)(c)：Non-Bird Exception／II.G(8)：Options／II.J(1)：Sign-and-Trades／II.K(2)：Free Agents（Cap Hold）／II.N(2)：Qualifying Offers",
  },
  {
    title: "2023 NBA Collective Bargaining Agreement（PDF・英語）",
    publisher: "NBA",
    date: "2023年7月1日発効（2029-30シーズンまで）",
    href: "https://ak-static.cms.nba.com/wp-content/uploads/sites/4/2023/06/2023-NBA-Collective-Bargaining-Agreement.pdf",
    note: "用語の正式な定義と詳細な条件",
  },
];

export default function GlossaryGuidePage() {
  return (
    <PageShell>
      <GuideHeader category="NBA用語" current="用語集" />
      <GuideTitle subject="NBA用語集" suffix="" />
      <p className="mb-8 text-sm text-muted">
        NBAの契約やサラリーキャップに関する用語を、1〜2文で説明する入口ページです。詳しいガイドがある用語は、「詳しく読む」から各ガイドへ進めます。
      </p>

      <div className="space-y-5">
        <Section kicker="Glossary" title="用語一覧">
          <dl className="divide-y divide-line border-y border-line">
            {TERMS.map((t) => (
              <div key={t.term} className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[240px_1fr] sm:gap-4">
                <dt className="font-bold text-pretty [word-break:auto-phrase]">{t.term}</dt>
                <dd className="text-pretty text-muted [word-break:auto-phrase]">
                  {t.description}
                  {t.href && (
                    <Link
                      href={t.href}
                      className="mt-1 block w-fit font-bold text-blue underline underline-offset-4 hover:no-underline"
                    >
                      詳しく読む：{t.linkLabel} →
                    </Link>
                  )}
                </dd>
              </div>
            ))}
          </dl>
          <p className="text-xs leading-6 text-muted">
            ※ 説明は概要です。金額・割合や細かな条件は扱っていません。正確な定義と条件は、下の公式資料（CBA・CBA 101）を確認してください。
          </p>
        </Section>

        <OfficialSourcesSection sources={SOURCES} />
      </div>

      <BackToGuide />
    </PageShell>
  );
}
