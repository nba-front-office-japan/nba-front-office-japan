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
  title: "NBAのBird Rightsとは？ | NBAガイド | NBA Front Office Japan",
  description:
    "NBAのBird Rights（自チームのFA選手と再契約できる権利）とは何か、Early Bird・Non-Birdとの違い、トレードされた選手の扱い、再契約が希望どおりにならない場合を初心者向けに解説します。",
};

// 解説文は CBA と NBA作成の「CBA 101」をもとにした独自の要約で、条文の転載・全文翻訳ではない。
// 確認した箇所:
//   - CBA 第1条(Article I)の定義(Qualifying / Early Qualifying / Non-Qualifying Veteran Free Agent)、
//     第7条(Article VII) Section 6(b)「Veteran Free Agent Exception」
//   - CBA 101 II.B(2)(a)〜(c) 3種類の例外、II.G(3) 昇給、II.G(4) 契約年数、
//     II.J(4) 1年契約の選手のトレード、II.J(5) 再契約後のトレード制限、II.K(2) FA選手の保留額と権利放棄
// 個別選手の例、推測の年俸、CBA 101 で確認できない細かな例外は載せない。

const SOURCES: OfficialSource[] = [
  {
    title: "2023 NBA Collective Bargaining Agreement（PDF・英語）",
    publisher: "NBA",
    date: "2023年7月1日発効（2029-30シーズンまで）",
    href: "https://ak-static.cms.nba.com/wp-content/uploads/sites/4/2023/06/2023-NBA-Collective-Bargaining-Agreement.pdf",
    note: "第1条（Article I）：Qualifying / Early Qualifying / Non-Qualifying Veteran Free Agent の定義／第7条（Article VII）Section 6(b)：Veteran Free Agent Exception",
  },
  {
    title: "CBA 101: Highlights of the Collective Bargaining Agreement（PDF・英語）",
    publisher: "NBA",
    date: "2024年11月作成",
    href: "https://official.nba.com/wp-content/uploads/sites/4/2024/11/2024-25-CBA-101.pdf",
    note: "Bird・Early Bird・Non-Birdの例外、昇給率、契約年数、1年契約の選手のトレード、FA選手の保留額と権利放棄",
  },
];

// 3種類の再契約の例外の違い
const BIRD_TYPES: {
  name: string;
  official: string;
  requirement: string;
  firstYear: string;
  length: string;
  raise: string;
}[] = [
  {
    name: "Bird",
    official: "Qualifying Veteran Free Agent Exception",
    requirement: "FAになる直前の3シーズン連続で、そのチームでプレー",
    firstYear: "選手の最高年俸（MAX）まで",
    length: "最長5年",
    raise: "1年目の年俸の8%まで",
  },
  {
    name: "Early Bird",
    official: "Early Qualifying Veteran Free Agent Exception",
    requirement: "FAになる直前の2シーズン連続で、そのチームでプレー",
    firstYear: "前の契約の最終シーズンの年俸の175%、または前シーズンの平均年俸の105%の、大きいほうまで",
    length: "最長4年（2年以上の契約が必要）",
    raise: "1年目の年俸の8%まで",
  },
  {
    name: "Non-Bird",
    official: "Non-Qualifying Veteran Free Agent Exception",
    requirement: "BirdにもEarly Birdにも当たらない自チームのFA選手",
    firstYear:
      "前の契約の最終シーズンの年俸の120%、その選手の最低年俸の120%、制限付きFAならクオリファイング・オファーの額の、最も大きいものまで",
    length: "最長4年",
    raise: "1年目の年俸の5%まで",
  },
];

const RELATED_TERMS: { term: string; description: string; href?: string }[] = [
  {
    term: "Qualifying Veteran Free Agent",
    description: "CBA上の正式な呼び方で、Bird Rightsの対象になるFA選手のこと。",
  },
  {
    term: "Free Agent Amount（保留額）",
    description:
      "FAになった自チームの選手について、再契約するまでの間、チームの年俸総額に計上される金額。前の年俸の一定倍率で決まる。",
  },
  {
    term: "権利放棄（Renounce）",
    description:
      "チームがFA選手の保留額を年俸総額から外す手続き。外すとキャップスペースは増えるが、その選手にBird系の例外は使えなくなる。",
  },
  {
    term: "制限付きFA（RFA）/ クオリファイング・オファー",
    description:
      "元のチームがクオリファイング・オファーを出すことで、他チームの条件に合わせて引き留める優先権を持つFA。Non-Birdの上限の計算では、クオリファイング・オファーの額も比べる対象になる。",
  },
  {
    term: "サイン・アンド・トレード",
    description: "FA選手が元のチームと契約し、そのまま別のチームへトレードされる取引。Bird系の例外で結んでも、昇給の上限は5%になる。",
  },
  {
    term: "MAX契約",
    description: "ルール上もっとも高い年俸で結ぶ契約。Bird Rightsでの再契約は、1年目の年俸をこの上限まで出せる。",
    href: GUIDE_PAGES["MAX契約"],
  },
  {
    term: "ミニマム契約",
    description: "在籍年数ごとに決められた最低年俸で結ぶ契約。Non-Birdの上限の計算では、最低年俸の120%も比べる対象になる。",
    href: GUIDE_PAGES["ミニマム契約"],
  },
  {
    term: "サラリーキャップ",
    description: "1チームが選手に払う年俸総額の基準となる上限。Bird Rightsは、これを超えていても再契約できる例外。",
    href: GUIDE_PAGES["サラリーキャップ"],
  },
];

export default function BirdRightsGuidePage() {
  return (
    <PageShell>
      <GuideHeader category="契約" current="Bird Rights" />
      <GuideTitle subject="NBAのBird Rights" />
      <p className="mb-8 text-sm text-muted">
        労使協定（CBA）と、NBAが作成した労使協定の要点まとめ（CBA 101）で確認できる内容をもとにした、当サイト独自の解説です。
      </p>

      <div className="space-y-5">
        {/* 1. まず結論 */}
        <SummarySection
          items={[
            "Bird Rightsは、チームが自チームのFA選手と、サラリーキャップを超えていても再契約できる仕組みです。",
            "同じチームで何シーズン続けてプレーしたかによって、Bird・Early Bird・Non-Birdの3種類に分かれ、出せる年俸や契約年数が変わります。",
            "強力な仕組みですが、選手は他チームとも交渉できるため、必ず希望どおりに再契約できるわけではありません。",
          ]}
        />

        <p className="border-l-4 border-gold bg-[#fff6e0] px-4 py-3 text-sm leading-7 dark:bg-white/[.06]">
          <b>ご注意：</b>このページは一般的な制度の解説です。個別の契約には、ここで扱っていない例外や条件があります。実際の契約内容は、各契約の公式な情報で確認してください。
        </p>

        {/* 2. Bird Rightsとは */}
        <Section kicker="What it is" title="Bird Rightsとは何か">
          <Bullets
            items={[
              <>
                <b>自チームのFA選手との再契約のための例外：</b>Bird Rightsは、サラリーキャップのルールにある「例外」の1つです。CBAでは「Qualifying Veteran Free Agent Exception」という名前で定められています。
              </>,
              <>
                <b>キャップを超えていても再契約できる：</b>通常、キャップを超えているチームは、キャップスペースを使って選手と契約することができません。Bird Rightsを使えば、キャップを超えていても自チームのFA選手と再契約できます。
              </>,
              <>
                <b>1年目は最高年俸まで出せる：</b>Bird Rightsの対象になる選手とは、契約の1年目に、その選手の最高年俸（MAX）までの年俸で再契約できます。
              </>,
            ]}
          />
          <RelatedGuideLink href={GUIDE_PAGES["サラリーキャップ"]} label="NBAサラリーキャップとは？（キャップスペースと例外の基本）" />
        </Section>

        {/* 3. なぜ重要か */}
        <Section kicker="Why it matters" title="Bird Rightsがチームにとって重要な理由">
          <Bullets
            items={[
              <>
                <b>キャップを超えたチームの数少ない手段：</b>キャップを超えているチームは、他チームのFA選手を大きな金額で獲得するのが難しくなります。一方、自チームの選手であれば、Bird Rightsで引き留められます。
              </>,
              <>
                <b>長く、昇給も大きい契約にできる：</b>Bird Rightsを使う再契約は最長5年、昇給の上限は1年目の年俸の8%です。他チームとの契約（多くは最長4年・昇給5%）より、契約総額を大きくしやすくなります。
              </>,
              <>
                <b>主力を育てて残せる：</b>ドラフトやトレードで加わった選手を育て、その後も手元に残せることが、チーム作りの土台になります。
              </>,
            ]}
          />
          <RelatedGuideLink href={GUIDE_PAGES["MAX契約"]} label="NBAのMAX契約とは？（最高年俸・契約年数・昇給率）" />
        </Section>

        {/* 4. 3種類の違い */}
        <Section kicker="Three types" title="Bird・Early Bird・Non-Birdの違い">
          <p>
            自チームのFA選手との再契約に使える例外は、<b>同じチームで何シーズン続けてプレーしたか</b>によって3種類に分かれます。
          </p>
          {/* PC: 表 / スマホ: 縦並び */}
          <div className="hidden overflow-hidden border border-line sm:block">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-foreground text-left text-[11px] font-extrabold tracking-[0.6px] text-muted">
                  <th scope="col" className="w-[130px] px-3 py-2.5">種類</th>
                  <th scope="col" className="px-3 py-2.5">必要な在籍期間</th>
                  <th scope="col" className="px-3 py-2.5">1年目の年俸の上限</th>
                  <th scope="col" className="w-[130px] px-3 py-2.5">契約年数</th>
                  <th scope="col" className="w-[160px] px-3 py-2.5">昇給率</th>
                </tr>
              </thead>
              <tbody>
                {BIRD_TYPES.map((t) => (
                  <tr key={t.name} className="border-b border-line last:border-b-0">
                    <th scope="row" className="px-3 py-3 text-left align-top font-bold">
                      {t.name}
                      <span className="mt-0.5 block text-[11px] font-normal text-muted [word-break:auto-phrase]">{t.official}</span>
                    </th>
                    <td className="px-3 py-3 align-top text-pretty [word-break:auto-phrase]">{t.requirement}</td>
                    <td className="px-3 py-3 align-top text-pretty [word-break:auto-phrase]">{t.firstYear}</td>
                    <td className="px-3 py-3 align-top text-pretty [word-break:auto-phrase]">{t.length}</td>
                    <td className="px-3 py-3 align-top text-pretty [word-break:auto-phrase]">{t.raise}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="space-y-3 sm:hidden">
            {BIRD_TYPES.map((t) => (
              <dl key={t.name} className="border border-line px-4 py-3">
                <dt className="font-bold">{t.name}</dt>
                <dd className="mb-2 text-[11px] text-muted">{t.official}</dd>
                <dd className="mt-1">
                  <span className="text-xs font-bold text-muted">必要な在籍期間：</span>
                  {t.requirement}
                </dd>
                <dd className="mt-1">
                  <span className="text-xs font-bold text-muted">1年目の年俸の上限：</span>
                  {t.firstYear}
                </dd>
                <dd className="mt-1">
                  <span className="text-xs font-bold text-muted">契約年数：</span>
                  {t.length}
                </dd>
                <dd className="mt-1">
                  <span className="text-xs font-bold text-muted">昇給率：</span>
                  {t.raise}
                </dd>
              </dl>
            ))}
          </div>
          <Bullets
            items={[
              "「そのチームでプレー」は、各シーズンの全部または一部を、ほかのチームではなくそのチームでプレーしていたことを指します。",
              "Bird・Early Birdで結んだ契約でも、サイン・アンド・トレードの場合は昇給の上限が5%になります。",
              "Non-Birdは、Bird・Early Birdほど高い年俸は出せませんが、キャップを超えていても自チームのFA選手と再契約できる点は共通です。",
            ]}
          />
          <RelatedGuideLink href={GUIDE_PAGES["ミニマム契約"]} label="NBAのミニマム契約とは？（Non-Birdの上限に関わる最低年俸）" />
        </Section>

        {/* 5. トレードされた選手の扱い */}
        <Section kicker="Trades" title="トレードされた選手のBird Rightsの扱い">
          <Bullets
            items={[
              <>
                <b>トレードでは連続シーズンの数え方が途切れない：</b>シーズンの途中でトレードされても、Bird・Early Birdの条件となる連続シーズンの数え方は途切れず、移籍先のチームで引き継がれます。
              </>,
              <>
                <b>ウェーバーでの移籍は条件付き：</b>ウェーバーで移籍した場合、Birdでは3シーズンのうち最初のシーズンでの移籍に限って、数え方が途切れません。Early Birdでは、ウェーバーでの移籍でも途切れません。
              </>,
              <>
                <b>1年契約の選手は同意なしにトレードできない：</b>1年契約（オプション年を除く）で、契約終了時にBird・Early Birdの対象になる（またはなりうる）選手は、本人の同意がなければトレードできません。
              </>,
              <>
                <b>同意してトレードされると権利を失う：</b>その選手が同意してトレードされた場合、それまでのBird Rightsは失われ、FAとして新しいチームに移ったものとして扱われます。ただし、契約時にこの同意の権利をなくす合意をすることもできます。
              </>,
            ]}
          />
          <p className="text-xs leading-6 text-muted">
            ※ トレードやウェーバーでの移籍の扱いには細かな条件があります。詳細な条件は公式CBA・CBA 101を参照してください。
          </p>
        </Section>

        {/* 6. 希望どおりにならない場合 */}
        <Section kicker="Limits" title="Bird Rightsがあっても、希望どおりの契約になるとは限らない">
          <Bullets
            items={[
              <>
                <b>選手は他チームとも交渉できる：</b>Bird Rightsは「チームがキャップを超えていても再契約できる」仕組みで、選手を引き留める権利ではありません。FAの選手は、他チームとも交渉できます（制限付きFAの場合は、元のチームが他チームの条件に合わせて引き留める優先権を別に持ちます）。
              </>,
              <>
                <b>出せる年俸には上限がある：</b>Birdでも1年目は選手の最高年俸（MAX）までです。Early Bird・Non-Birdでは、さらに低い上限があります。
              </>,
              <>
                <b>再契約までの保留額：</b>FAになった自チームの選手は、再契約するまでの間も、前の年俸の一定倍率の金額（保留額）がチームの年俸総額に計上されます。たとえばBirdの対象の選手は、前の年俸が平均年俸以上なら150%、平均年俸未満なら190%です（ルーキー契約を終える1巡目指名選手は別の倍率）。
              </>,
              <>
                <b>権利を手放す判断もある：</b>チームは保留額を年俸総額から外す（権利放棄する）ことで、キャップスペースを増やせます。ただし、その選手にはBird系の例外を使えなくなります。
              </>,
              <>
                <b>年俸総額の負担：</b>再契約で年俸総額が上がると、ラグジュアリータックスやApronの対象になり、税金や補強手段の制限を受けることがあります。
              </>,
              <>
                <b>再契約後のトレード制限：</b>キャップを超えた状態で、Bird・Early Birdを使い前年の年俸の120%を超える年俸で再契約した場合、その選手は契約から3か月後と1月15日の遅いほうまでトレードできません。
              </>,
            ]}
          />
          <RelatedGuideLink href={GUIDE_PAGES["ラグジュアリータックス"]} label="NBAラグジュアリータックスとは？（年俸総額が上がったときの負担）" />
          <RelatedGuideLink href={GUIDE_PAGES["1st Apron / 2nd Apron"]} label="NBAの1st Apronと2nd Apronとは？（高額年俸チームへの制限）" />
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
