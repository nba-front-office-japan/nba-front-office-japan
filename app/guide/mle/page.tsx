import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import {
  BackToGuide,
  Bullets,
  GlossarySection,
  GuideHeader,
  GuideTitle,
  OfficialSourcesSection,
  RelatedGuideLink,
  Section,
  SummarySection,
} from "@/components/guide-article";
import { GUIDE_PAGES, type OfficialSource } from "@/lib/guide-official";

export const metadata: Metadata = {
  title: "NBAのMLE（ミッドレベル例外）とは？ | NBAガイド | NBA Front Office Japan",
  description:
    "NBAのMLE（Mid-Level Exception）の仕組み、Non-Taxpayer MLE・Taxpayer MLE・Room MLEの違い、1st Apron・2nd Apronとの関係を初心者向けに解説します。",
};

// 解説文は CBA と NBA作成の「CBA 101」をもとにした独自の要約で、条文の転載・全文翻訳ではない。
// 確認した箇所:
//   - CBA 第7条(Article VII) Section 6(e) Non-Taxpayer MLE(キャップの9.12%・最長4シーズン)、6(f) Taxpayer MLE(最長2シーズン、
//     使った直後のApron Team Salaryが1st Apronを超える場合)、6(g) Room MLE(キャップの5.678%・最長3シーズン)、Section 2(e) Apron
//   - CBA 101 II.B(2)(d) 例外の使い方と使える球団、II.E(1) Apronの対象となる取引、II.G(3) 昇給
// 「ハードキャップ」という言葉は CBA・CBA 101 には出てこないため、公式資料で確認できる「その年度はApron以下を保つ」条件として説明する。
// 具体的な金額、選手個人の事例、推測、未確認の例外は載せない。

const SOURCES: OfficialSource[] = [
  {
    title: "2023 NBA Collective Bargaining Agreement（PDF・英語）",
    publisher: "NBA",
    date: "2023年7月1日発効（2029-30シーズンまで）",
    href: "https://ak-static.cms.nba.com/wp-content/uploads/sites/4/2023/06/2023-NBA-Collective-Bargaining-Agreement.pdf",
    note: "第7条（Article VII）Section 6(e)〜(g)：Non-Taxpayer MLE・Taxpayer MLE・Room MLE／Section 2(e)：Apron",
  },
  {
    title: "CBA 101: Highlights of the Collective Bargaining Agreement（PDF・英語）",
    publisher: "NBA",
    date: "2024年11月作成",
    href: "https://official.nba.com/wp-content/uploads/sites/4/2024/11/2024-25-CBA-101.pdf",
    note: "II.B(2)(d)：MLEの使い方と使える球団／II.E(1)：Apronの対象となる取引",
  },
];

// 3種類のMLEの違い
const MLE_TYPES: {
  name: string;
  official: string;
  team: string;
  size: string;
  length: string;
  trade: string;
}[] = [
  {
    name: "Non-Taxpayer MLE",
    official: "Non-Taxpayer Mid-Level Salary Exception",
    team: "その年度中、一度もキャップを下回っていない球団（使った結果、1st Apronを超えないことが条件）",
    size: "サラリーキャップの9.12%",
    length: "最長4シーズン",
    trade: "トレード・ウェーバーでの獲得にも使える",
  },
  {
    name: "Taxpayer MLE",
    official: "Taxpayer Mid-Level Salary Exception",
    team: "その年度中、一度もキャップを下回っておらず、使った直後の年俸総額が1st Apronを超える球団（2nd Apronを超えないことが条件）",
    size: "Non-Taxpayer MLEより小さい定額（キャップの伸びに合わせて毎年改定）",
    length: "最長2シーズン",
    trade: "契約に使う（トレード等での獲得はCBA 101に記載なし）",
  },
  {
    name: "Room MLE",
    official: "Mid-Level Salary Exception for Room Teams",
    team: "その年度中に年俸総額がキャップを下回ったことがある球団（キャップスペースを使った球団など）",
    size: "サラリーキャップの5.678%",
    length: "最長3シーズン",
    trade: "トレード・ウェーバーでの獲得にも使える",
  },
];

const RELATED_TERMS: { term: string; description: string; href?: string }[] = [
  {
    term: "MLE（Mid-Level Exception）",
    description: "キャップを超えた球団などが、決められた枠の範囲で選手と契約できる例外。3種類あり、球団の状態でどれを使えるかが決まる。",
  },
  {
    term: "Room Team（ルームチーム）",
    description: "年度中に年俸総額がサラリーキャップを下回り、キャップスペースを使える状態になった球団。Room MLEを使う。",
  },
  {
    term: "Apron Team Salary",
    description: "Apronの判定に使う年俸総額。通常の年俸総額をもとに、FA選手の保留額などを除くといった調整をした額。",
  },
  {
    term: "Bi-annual Exception",
    description: "キャップを超えた球団が使える別の例外。MLEと同じく、1st Apronの対象となる取引に含まれる。",
  },
  {
    term: "1st Apron / 2nd Apron",
    description: "タックスラインより上に設定された2つの基準額。MLEの種類によって、どちらを超えないことが条件になるかが変わる。",
    href: GUIDE_PAGES["1st Apron / 2nd Apron"],
  },
  {
    term: "Bird Rights",
    description: "自チームのFA選手と、キャップを超えていても再契約できる例外。MLEと違い、他チームの選手には使えない。",
    href: GUIDE_PAGES["Bird Rights"],
  },
  {
    term: "ミニマム契約",
    description: "最低年俸で結ぶ契約。キャップの状況にかかわらず使える別の例外（Minimum Player Salary Exception）で結べる。",
    href: GUIDE_PAGES["ミニマム契約"],
  },
  {
    term: "サラリーキャップ",
    description: "1チームが選手に払う年俸総額の基準となる上限。MLEは、これを超えた球団などが使う例外の1つ。",
    href: GUIDE_PAGES["サラリーキャップ"],
  },
];

export default function MleGuidePage() {
  return (
    <PageShell>
      <GuideHeader category="契約" current="MLE" />
      <GuideTitle subject="NBAのMLE（ミッドレベル例外）" />
      <p className="mb-8 text-sm text-muted">
        労使協定（CBA）と、NBAが作成した労使協定の要点まとめ（CBA 101）で確認できる内容をもとにした、当サイト独自の解説です。
      </p>

      <div className="space-y-5">
        {/* 1. まず結論 */}
        <SummarySection
          items={[
            "MLE（ミッドレベル例外）は、サラリーキャップを超えている球団でも、決められた枠の範囲で選手と契約できる例外制度です。",
            "Non-Taxpayer MLE・Taxpayer MLE・Room MLEの3種類があり、球団の年俸総額の状態によって使えるものが決まります。",
            "種類によっては、使ったあとその年度は年俸総額を1st Apronまたは2nd Apron以下に保つ必要があります。",
          ]}
        />

        <p className="border-l-4 border-gold bg-[#fff6e0] px-4 py-3 text-sm leading-7 dark:bg-white/[.06]">
          <b>ご注意：</b>このページは一般的な制度の解説であり、個別の契約の判断材料ではありません。個別の契約には、ここで扱っていない例外や条件があります。
        </p>

        {/* 2. MLEとは */}
        <Section kicker="What it is" title="MLEとは何か">
          <Bullets
            items={[
              <>
                <b>キャップを超えた球団の補強手段：</b>キャップを超えた球団は、キャップスペースを使って他チームの選手と契約できません。MLEを使えば、決められた枠の範囲で、他チームのFA選手などと契約できます。
              </>,
              <>
                <b>枠は1年目の年俸の合計：</b>MLEの枠は、契約1年目の年俸の合計にかかります。1人にまとめて使うことも、複数の選手に分けて使うこともできます。
              </>,
              <>
                <b>金額は毎年改定：</b>MLEの金額は、サラリーキャップと同じ伸び率で毎年見直されます。このページでは具体的な金額は掲載していません。
              </>,
              <>
                <b>昇給の上限は5%：</b>MLEで結ぶ契約の2年目以降の昇給・減額の上限は、1年目の年俸の5%です。
              </>,
            ]}
          />
          <RelatedGuideLink href={GUIDE_PAGES["サラリーキャップ"]} label="NBAサラリーキャップとは？（キャップスペースと例外の基本）" />
        </Section>

        {/* 3. 3種類の違い */}
        {/* 見出しは用語の途中で改行しないよう、用語ごとに改行を禁止する */}
        <Section
          kicker="Three types"
          title={
            <>
              <span className="whitespace-nowrap">Non-Taxpayer MLE</span>・<span className="whitespace-nowrap">Taxpayer MLE</span>・
              <span className="whitespace-nowrap">Room MLEの違い</span>
            </>
          }
        >
          {/* PC: 表 / スマホ: 縦並び */}
          <div className="hidden overflow-hidden border border-line sm:block">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-foreground text-left text-[11px] font-extrabold tracking-[0.6px] text-muted">
                  <th scope="col" className="w-[150px] px-3 py-2.5">種類</th>
                  <th scope="col" className="px-3 py-2.5">使える球団の状態</th>
                  <th scope="col" className="w-[170px] px-3 py-2.5">1年目の年俸の枠</th>
                  <th scope="col" className="w-[110px] px-3 py-2.5">契約年数</th>
                  <th scope="col" className="w-[170px] px-3 py-2.5">トレード等での獲得</th>
                </tr>
              </thead>
              <tbody>
                {MLE_TYPES.map((t) => (
                  <tr key={t.name} className="border-b border-line last:border-b-0">
                    <th scope="row" className="px-3 py-3 text-left align-top font-bold">
                      {t.name}
                      <span className="mt-0.5 block text-[11px] font-normal text-muted [word-break:auto-phrase]">{t.official}</span>
                    </th>
                    <td className="px-3 py-3 align-top text-pretty [word-break:auto-phrase]">{t.team}</td>
                    <td className="px-3 py-3 align-top text-pretty [word-break:auto-phrase]">{t.size}</td>
                    <td className="px-3 py-3 align-top text-pretty [word-break:auto-phrase]">{t.length}</td>
                    <td className="px-3 py-3 align-top text-pretty [word-break:auto-phrase]">{t.trade}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="space-y-3 sm:hidden">
            {MLE_TYPES.map((t) => (
              <dl key={t.name} className="border border-line px-4 py-3">
                <dt className="font-bold">{t.name}</dt>
                <dd className="mb-2 text-[11px] text-muted">{t.official}</dd>
                <dd className="mt-1">
                  <span className="text-xs font-bold text-muted">使える球団の状態：</span>
                  {t.team}
                </dd>
                <dd className="mt-1">
                  <span className="text-xs font-bold text-muted">1年目の年俸の枠：</span>
                  {t.size}
                </dd>
                <dd className="mt-1">
                  <span className="text-xs font-bold text-muted">契約年数：</span>
                  {t.length}
                </dd>
                <dd className="mt-1">
                  <span className="text-xs font-bold text-muted">トレード等での獲得：</span>
                  {t.trade}
                </dd>
              </dl>
            ))}
          </div>
          <Bullets
            items={[
              <>
                <b>同じ年度に組み合わせて使えない：</b>Room MLEを使った球団は、その年度にNon-Taxpayer MLE・Taxpayer MLEを使えません。反対に、Non-Taxpayer MLE・Taxpayer MLE・Bi-annual Exceptionを使った球団は、その年度にRoom MLEを使えません。
              </>,
              <>
                <b>キャップを下回った時点で決まる：</b>年度中に一度でも年俸総額がキャップを下回った球団は、その年度はRoom MLEだけが対象になります。
              </>,
              <>
                <b>Non-Taxpayer MLEがTaxpayer MLE扱いになる場合：</b>Non-Taxpayer MLEで、2シーズン以内・Taxpayer MLEの枠以内の契約だけを結び、ほかに1st Apronを超えられなくなる取引をしていない球団は、年俸総額が1st Apronを超えた場合、Taxpayer MLEを使ったものとして扱われます。
              </>,
            ]}
          />
          <p className="text-xs leading-6 text-muted">
            ※ それぞれの例外を使える条件には細かな決まりがあります。詳細な条件は公式CBA・CBA 101を参照してください。
          </p>
        </Section>

        {/* 4. Apronとの関係 */}
        <Section kicker="Aprons" title="1st Apron・2nd Apronとの関係">
          <p>MLEの種類によって、超えてはいけないApronが異なります。</p>
          <Bullets
            items={[
              <>
                <b>Non-Taxpayer MLE：</b>使った直後の年俸総額が1st Apronを超える場合は使えません。1st Apronの対象となる取引の1つです。
              </>,
              <>
                <b>Taxpayer MLE：</b>使った直後の年俸総額が2nd Apronを超える場合は使えません。2nd Apronの対象となる取引の1つです。
              </>,
              <>
                <b>Taxpayer MLEを使ったあと：</b>Taxpayer MLEを使った球団は、その年度は1st Apronの対象となる補強手段（Non-Taxpayer MLE、Bi-annual Exception、サイン・アンド・トレードでの獲得など）を使えなくなります。
              </>,
            ]}
          />
          <RelatedGuideLink href={GUIDE_PAGES["1st Apron / 2nd Apron"]} label="NBAの1st Apronと2nd Apronとは？（Apronの対象となる取引）" />
        </Section>

        {/* 5. 「ハードキャップ」と呼ばれる条件 */}
        <Section kicker="Hard limit" title="使ったあと、その年度は年俸総額の上限が固定される条件">
          <p>
            CBAやCBA 101には「ハードキャップ」という言葉は出てきません。公式資料で確認できるのは、次の条件です。
          </p>
          <Bullets
            items={[
              <>
                <b>Non-Taxpayer MLEを使った場合：</b>その年度が終わるまで、年俸総額を1st Apron以下に保つ必要があります（上で説明した、Taxpayer MLEを使ったものとして扱われる場合を除く）。
              </>,
              <>
                <b>Taxpayer MLEを使った場合：</b>その年度が終わるまで、年俸総額を2nd Apron以下に保つ必要があります。
              </>,
              <>
                <b>判定に使う年俸総額：</b>ここでの年俸総額は、Apronの判定に使う年俸総額（Apron Team Salary）です。
              </>,
            ]}
          />
          <p className="text-xs leading-6 text-muted">
            ※ 年度の区切りや判定に使う年俸総額の調整には細かな決まりがあります。詳細な条件は公式CBA・CBA 101を参照してください。
          </p>
        </Section>

        {/* 6. 他の契約手段との違い */}
        <Section
          kicker="Compared with"
          title={
            <>
              <span className="whitespace-nowrap">Bird Rights</span>・<span className="whitespace-nowrap">ミニマム契約</span>・
              <span className="whitespace-nowrap">サイン・アンド・トレードとの違い</span>
            </>
          }
        >
          <Bullets
            items={[
              <>
                <b>Bird Rightsとの違い：</b>Bird Rightsは自チームのFA選手との再契約に使う例外で、1年目は選手の最高年俸まで出せます。MLEは、他チームの選手を含めて使えますが、決められた枠の範囲に限られます。
              </>,
              <>
                <b>ミニマム契約との違い：</b>最低年俸での契約は、キャップの状況にかかわらず使える別の例外（Minimum Player Salary Exception）で結べます。MLEの枠を使わずに選手を加える手段です。
              </>,
              <>
                <b>サイン・アンド・トレードとの違い：</b>サイン・アンド・トレードは、FA選手が元のチームと契約してから別のチームへトレードされる取引です。MLEとは別の仕組みで、獲得する側の球団は、取引の結果1st Apronを超える場合は使えません。
              </>,
            ]}
          />
          <RelatedGuideLink href={GUIDE_PAGES["Bird Rights"]} label="NBAのBird Rightsとは？（自チームのFA選手との再契約）" />
          <RelatedGuideLink href={GUIDE_PAGES["ミニマム契約"]} label="NBAのミニマム契約とは？（最低年俸での契約）" />
        </Section>

        {/* 7. 関連用語 */}
        <GlossarySection terms={RELATED_TERMS} />

        {/* 8. 公式一次資料 */}
        <OfficialSourcesSection sources={SOURCES} />
      </div>

      <BackToGuide />
    </PageShell>
  );
}
