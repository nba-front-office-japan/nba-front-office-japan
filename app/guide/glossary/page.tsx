import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { BackToGuide, GuideHeader, GuideTitle, Section } from "@/components/guide-article";
import { GUIDE_PAGES } from "@/lib/guide-official";

export const metadata: Metadata = {
  title: "用語一覧 | NBAガイド | NBA Front Office Japan",
  description:
    "NBAのニュースや試合でよく出てくる用語を、ドラフト・制度、スタッツ・指標、怪我・インジュリー用語、プレー用語に分けて1〜2文で説明します。契約・サラリーの用語は「契約用語」にまとめています。",
};

// 用語一覧(URL は /guide/glossary のまま)。契約・サラリーの用語は「契約」カテゴリーの /guide/contract-terms に移したため、
// ここには載せない(同じ用語を両方のページに重複して載せない)。
// 説明は一般的な意味の概要。怪我の用語は、診断や復帰時期を断定する書き方をしない。

type Term = {
  term: string;
  en: string;
  description: string;
  href?: string;
  linkLabel?: string;
};

type Group = { id: string; kicker: string; title: string; lead: string; terms: Term[]; note?: string };

const GROUPS: Group[] = [
  {
    id: "draft-system",
    kicker: "Draft & System",
    title: "ドラフト・制度",
    lead: "ドラフト指名権のやりとりなど、チームづくりの制度に関する用語です。",
    terms: [
      {
        term: "ドラフト・プロテクト",
        en: "Draft pick protection",
        description:
          "トレードで譲渡するドラフト指名権に付ける保護条件。指定順位以内の指名権は元のチームに残り、条件を外れた場合に相手チームへ渡る。",
        href: GUIDE_PAGES["ドラフト指名権"],
        linkLabel: "ドラフト指名権",
      },
    ],
  },
  {
    id: "stats-metrics",
    kicker: "Stats & Metrics",
    title: "スタッツ・指標",
    lead: "チームや選手のパフォーマンスを、得点やプレーの回数だけでなく効率も含めて見るための指標です。",
    terms: [
      {
        term: "ネットレーティング",
        en: "Net Rating",
        description:
          "100ポゼッション当たりの得失点差を表す指標。オフェンシブ・レーティング（100ポゼッション当たりの得点）からディフェンシブ・レーティング（100ポゼッション当たりの失点）を引いて算出し、プラスが大きいほど相手を上回っていることを示します。",
      },
      {
        term: "PER",
        en: "Player Efficiency Rating",
        description:
          "ジョン・ホリンジャーが考案した、主にボックススコアの数値から選手の1分当たりの生産性を表す指標。リーグ平均が毎シーズン15になるよう調整されますが、守備やスクリーンなどボックススコアに表れにくい貢献は十分に捉えられない点に注意が必要です。",
      },
    ],
  },
  {
    id: "injury",
    kicker: "Injury",
    title: "怪我・インジュリー用語",
    lead: "欠場者の発表や怪我のニュースで使われる用語です。",
    note: "※ 怪我の用語は一般的な意味の説明です。選手ごとの状態・診断や復帰時期は、チームやNBAの発表を確認してください。",
    terms: [
      {
        term: "前十字靭帯断裂",
        en: "ACL tear",
        description: "膝の中で太ももの骨とすねの骨をつなぎ、膝を安定させている前十字靭帯が切れる怪我。ジャンプの着地や急な方向転換で起きることがあります。",
      },
      {
        term: "内側側副靭帯損傷",
        en: "MCL sprain",
        description: "膝の内側にある内側側副靭帯を痛める怪我。膝に外側から力が加わったときなどに起きます。",
      },
      {
        term: "半月板損傷",
        en: "Meniscus tear",
        description: "膝の骨と骨の間でクッションの役割をしている半月板が傷つく怪我。膝をひねる動きなどで起きることがあります。",
      },
      {
        term: "アキレス腱断裂",
        en: "Achilles tendon tear",
        description: "ふくらはぎの筋肉とかかとの骨をつなぐアキレス腱が切れる怪我。踏み切りやダッシュの動きで起きることがあります。",
      },
      {
        term: "ハムストリング負傷",
        en: "Hamstring strain",
        description: "太ももの裏側の筋肉（ハムストリング）を痛める怪我。ダッシュなど、筋肉が強く伸び縮みする動きで起きやすい怪我です。",
      },
      {
        term: "鼠径部の負傷",
        en: "Groin strain",
        description: "太ももの付け根の内側（鼠径部）の筋肉を痛める怪我。横への動きや急な方向転換で起きることがあります。",
      },
      {
        term: "足首の捻挫",
        en: "Ankle sprain",
        description: "足首をひねって、足首の靭帯を痛める怪我。着地のときにほかの選手の足を踏んでしまった場合などに起きます。",
      },
      {
        term: "ハイアンクルスプレイン",
        en: "High ankle sprain",
        description: "足首の少し上で、すねの2本の骨をつないでいる靭帯を痛める捻挫。一般的な足首の捻挫とは痛める場所が違います。",
      },
      {
        term: "膝の過伸展",
        en: "Knee hyperextension",
        description: "膝が本来曲がらない後ろ側へ、伸びすぎてしまうこと。着地のときなどに起き、膝の靭帯などを痛める場合があります。",
      },
      {
        term: "骨折",
        en: "Fracture",
        description: "骨が折れたり、ひびが入ったりする怪我。指や手、顔など、さまざまな場所で起こります。",
      },
      {
        term: "疲労骨折",
        en: "Stress fracture",
        description: "同じ動きのくり返しで骨に負担がたまり、小さなひびが入る骨折。一度の強い衝撃ではなく、少しずつ起きるのが特徴です。",
      },
      {
        term: "打撲",
        en: "Contusion",
        description: "体がぶつかった衝撃で、筋肉などを傷める怪我。いわゆる「打ち身」で、接触の多いバスケットボールではよく起きます。",
      },
      {
        term: "脳震盪",
        en: "Concussion",
        description: "頭への衝撃などで、脳の働きが一時的に乱れる状態。NBAでは、脳震盪が疑われる選手への対応手順が定められています。",
      },
      {
        term: "腱障害",
        en: "Tendinopathy",
        description: "膝やかかとなどの腱に負担がたまり、痛みなどが出る状態をまとめた呼び方です。",
      },
      {
        term: "痛み・違和感",
        en: "Soreness",
        description: "痛みや張りがある状態を指す言葉。欠場の理由として「膝の痛み（knee soreness）」のように使われます。",
      },
    ],
  },
  {
    id: "play",
    kicker: "Play",
    title: "プレー用語",
    lead: "試合の実況やハイライトでよく出てくる、攻撃・守備のプレーの用語です。",
    terms: [
      {
        term: "チェイスダウンブロック",
        en: "Chase-down block",
        description: "速攻でゴールへ向かう相手を後ろから追いかけ、シュートをブロックするプレー。",
      },
      {
        term: "プルアップ",
        en: "Pull-up jumper",
        description: "ドリブルからそのまま止まって打つジャンプシュート。",
      },
      {
        term: "アイソレーション",
        en: "Isolation / Iso",
        description: "1人の選手に1対1で攻めさせるため、ほかの選手が離れてスペースを空ける攻め方。",
      },
      {
        term: "ピック＆ロール",
        en: "Pick-and-roll",
        description: "ボールを持つ味方の相手に壁（スクリーン）を作り、壁を作った選手がそのままゴールへ向かう（ロールする）攻撃。",
      },
      {
        term: "ピック＆ポップ",
        en: "Pick-and-pop",
        description: "スクリーンを作った選手がゴールへ向かわず、外へ開いて（ポップして）シュートを狙う攻撃。",
      },
      {
        term: "ドライブ",
        en: "Drive",
        description: "ドリブルでゴールへ切り込むプレー。",
      },
      {
        term: "ステップバック",
        en: "Step-back",
        description: "ドリブルから後ろへ一歩下がり、ディフェンスとの間を空けて打つシュート。",
      },
      {
        term: "フローター",
        en: "Floater",
        description: "ゴールの近くで、ブロックされないよう高い弧を描くように浮かせて打つシュート。",
      },
      {
        term: "ユーロステップ",
        en: "Euro step",
        description: "ドライブの途中で、左右にずらしたステップでディフェンスをかわしてシュートへ向かう動き。",
      },
      {
        term: "バックドアカット",
        en: "Backdoor cut",
        description: "ディフェンスがパスを防ごうと前に出たすきに、その背後を通ってゴールへ走り込む動き。",
      },
      {
        term: "クローズアウト",
        en: "Closeout",
        description: "離れた位置からボールを持った相手との距離をすばやく詰め、シュートやドライブを防ぐ守り。",
      },
      {
        term: "スイッチ",
        en: "Switch",
        description: "スクリーンを受けたときなどに、ディフェンス同士で守る相手を入れ替えること。",
      },
      {
        term: "ヘルプディフェンス",
        en: "Help defense",
        description: "味方が抜かれそうなときなどに、自分の守る相手から離れて手助けに入る守り。",
      },
      {
        term: "ボックスアウト",
        en: "Box out",
        description: "シュートが外れたときに、相手とゴールの間に体を入れて、リバウンドを取りやすい位置を確保すること。",
      },
      {
        term: "プットバック",
        en: "Putback",
        description: "外れたシュートのリバウンドを取り、そのまますぐにシュートを決めるプレー。",
      },
      {
        term: "ファストブレイク",
        en: "Fast break",
        description: "相手が守備に戻る前に、すばやく攻め込む攻撃（速攻）。",
      },
      {
        term: "アンドワン",
        en: "And-one",
        description: "ファウルを受けながらシュートを決め、さらにフリースローを1本得ること。",
      },
    ],
  },
];

export default function GlossaryGuidePage() {
  return (
    <PageShell>
      <GuideHeader category="用語一覧" />
      <GuideTitle subject="用語一覧" suffix="" />
      <p className="mb-4 text-sm text-muted">
        NBAのニュースや試合でよく出てくる用語を、分類ごとに1〜2文で説明します。契約・サラリーの用語は
        <Link href={GUIDE_PAGES["契約用語"]} className="font-bold text-blue underline underline-offset-4 hover:no-underline">
          契約用語
        </Link>
        にまとめています。
      </p>

      {/* 分類へのページ内リンク */}
      <nav aria-label="用語の分類" className="mb-8 flex flex-wrap gap-2">
        {GROUPS.map((g) => (
          <a
            key={g.id}
            href={`#${g.id}`}
            className="border border-line bg-surface px-3 py-2 text-sm font-bold hover:border-blue hover:text-blue"
          >
            {g.title}
            <span className="ml-1.5 text-xs font-semibold text-muted tabular-nums">{g.terms.length}</span>
          </a>
        ))}
      </nav>

      <div className="space-y-5">
        {GROUPS.map((g) => (
          <div key={g.id} id={g.id} className="scroll-mt-4">
            <Section kicker={g.kicker} title={g.title}>
              <p className="text-muted">{g.lead}</p>
              <dl className="divide-y divide-line border-y border-line">
                {g.terms.map((t) => (
                  <div key={t.term} className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[240px_1fr] sm:gap-4">
                    <dt className="text-pretty [word-break:auto-phrase]">
                      <span className="block font-bold">{t.term}</span>
                      <span className="block text-xs font-semibold text-muted" lang="en">
                        {t.en}
                      </span>
                    </dt>
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
              {g.note && <p className="text-xs leading-6 text-muted">{g.note}</p>}
            </Section>
          </div>
        ))}
      </div>

      <BackToGuide />
    </PageShell>
  );
}
