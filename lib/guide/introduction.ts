// 「はじめに.docx」(運営者が作成した文書)から生成した、GUIDEの導入ページの本文。
// 本文の文字・太字は元の文書のまま。見出しは元の文書の太字の見出し行を使い、
// addedTitle: true の2か所だけ、章の区切りとして見出しを追加している。
// 本文を直す場合は元の文書を直してから生成し直すか、ここを直接編集する。

export type IntroRun = { text: string; bold: boolean };
export type IntroBlock =
  | { kind: "p"; runs: IntroRun[] }
  | { kind: "h3"; text: string }
  | { kind: "list"; items: IntroRun[][] };
export type IntroSection = { id: string; title: string; addedTitle: boolean; blocks: IntroBlock[] };

export const INTRODUCTION_SECTIONS: IntroSection[] = [
  {
    "id": "lead",
    "title": "NBAは、試合だけ見ていては半分しか分からない。",
    "addedTitle": false,
    "blocks": [
      {
        "kind": "p",
        "runs": [
          {
            "text": "世界約4.5億人以上がプレーするバスケットボール。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "その最高峰、NBAの標準契約枠はわずか約450人。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "平均年俸は約1,200万ドル。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "世界中のトッププレイヤーがNBAを目指し、そこに残れる期間も決して長くありません。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "170cm台と220cmを超える選手が、同じコート、同じルールで直接戦う。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "スター選手は1試合30〜40分近く出場し、得点だけではなく、パス、リバウンド、ディフェンスまで試合の大部分に関わる。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "そして、その世界最高峰の選手たちは、観客サイドラインからが手を伸ばせば届くほど近い場所でプレーしています。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "しかしNBAの本当の面白さは、コートの中だけではありません。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "なぜ大富豪のオーナーでも、好きなだけスター選手を集められないのか。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "なぜニューヨークやロサンゼルスだけでなく、デンバー・オクラホマシティ・ミルウォーキーのような小規模市場・マイナーチームも強豪チームできるのか。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "なぜドラフト1巡目指名権一つが、スター選手とのトレードを左右するのか。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "なぜ選手だけでなく、NBAチームのオーナーまで永久追放されることがあるのか。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "サラリーキャップ。MAX契約。ドラフト。トレード。オーナー。放映権。そして戦力均衡。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "NBAは、30チームがただ試合をしているだけのリーグではありません。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "世界最高峰の選手、巨大なビジネス、複雑なルール、そしてエンターテインメントを一つにしたスポーツリーグです。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "NBA Front Office Japanでは、",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "「誰が勝ったか」だけではなく、",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "「なぜ、そうなったのか」まで掘り下げます。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "試合の結果だけでは見えなかったNBAの世界へ。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "ここから、NBAをもう一段深く見ていきましょう。",
            "bold": false
          }
        ]
      }
    ]
  },
  {
    "id": "league",
    "title": "NBAというリーグの面白さ",
    "addedTitle": true,
    "blocks": [
      {
        "kind": "p",
        "runs": [
          {
            "text": "NBAは、単に「世界最高峰のバスケットボールリーグ」というだけではありません。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "試合、選手の契約、ドラフト、トレード、オーナー、放映権、チーム経営。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "さらに、ファッション、音楽、スニーカー、SNS、社会問題まで。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "これらすべてが一つの巨大なエンターテインメントとしてつながっているところに、NBAというリーグの面白さがあります。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "NBAの前身となるBAAが誕生したのは1946年。1949年にNBLと統合し、現在につながるNBAが形成されました。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "そこから約80年。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "NBAは現在、北米4大プロスポーツの一角であると同時に、アメリカ国内だけにとどまらない世界規模のスポーツビジネスへと成長しています。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "しかしNBAの本当の面白さを理解するには、",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "「どのチームが勝ったのか」",
            "bold": true
          },
          {
            "text": "だけを見ていても十分ではありません。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "なぜNBA選手の給料（サラリー）はこれほど高いのか？",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "なぜ世界中にバスケットボール選手がいるのに、NBAに入れるのはごく一部なのか。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "なぜ大富豪のオーナーのマネーゲーム・名門チーム以外のチームの優勝が多いのか？",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "なぜ選手だけでなく、オーナーまでリーグから永久追放されることがあるのか？",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "そしてなぜ、一人のスーパースターの移籍だけでリーグ全体が動くのか？",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "そこには、他のプロスポーツとはかなり違うNBA独自の世界があります。",
            "bold": false
          }
        ]
      }
    ]
  },
  {
    "id": "competitive-balance",
    "title": "NBAが目指すのは「金持ちチームが勝つリーグ」ではない",
    "addedTitle": false,
    "blocks": [
      {
        "kind": "p",
        "runs": [
          {
            "text": "NBAを理解するうえで、もう一つ非常に重要なのが、",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "戦力均衡",
            "bold": true
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "という考え方です。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "NBAには30チームあります。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "しかし市場規模はまったく同じではありません。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "ニューヨーク、ロサンゼルス、ボストン、サンフランシスコ。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "こうした巨大市場や歴史のあるチームと、",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "メンフィス、オクラホマシティ、ユタ、インディアナ。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "などでは、都市の人口や市場規模、ブランド力が違います。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "もし完全な自由競争にすれば、人気都市の資金力があるチームにスター選手が集中する可能性があります。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "そのために存在するのが、全チーム共通のサラリーキャップと選手のMAX契約。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "他にも細かくLuxury Tax。1st Apron。2nd Apron。ドラフト。FAルール。トレードルールなどが定められています",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "NBAはソフトキャップという制度で、一定の条件下ではサラリーキャップを超えて選手を保有できます。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "しかし使えば使うほど、税金だけではなくチーム編成そのものに制限がかかります。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "つまりNBAは、",
            "bold": false
          },
          {
            "text": "「金は使えるが使えば使うほど縛りが多くなり戦力補強ができなくなる」",
            "bold": true
          },
          {
            "text": "というマネーゲームにさせないリーグを作っています。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "NFLはNBA以上に強い戦力均衡思想を持ち、ハードキャップ、ドラフト、収益分配を組み合わせています。",
            "bold": false
          }
        ]
      }
    ]
  },
  {
    "id": "other-leagues",
    "title": "同じプロスポーツリーグでも、MLB、欧州サッカーは思想が違う",
    "addedTitle": false,
    "blocks": [
      {
        "kind": "p",
        "runs": [
          {
            "text": "MLBには現在、NBAのようなサラリーキャップはありません。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "いわゆる贅沢税はありますが、金満球団はドジャースのように選手を青田買いして補強だけでなく、相手の戦力を奪うという戦略がとられ球団間の給与総額には大きな差が出てしまいます。",
            "bold": false
          }
        ]
      },
      {
        "kind": "h3",
        "text": "欧州サッカーはMLBと似ている"
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "クラブごとの収益規模や歴史、スポンサー力、ブランド力による差が大きい。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "巨大クラブが世界中からスターを集めることもできます。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "NBAは、",
            "bold": false
          },
          {
            "text": "30チーム全体で一つの商品を作る",
            "bold": true
          },
          {
            "text": "という思想がかなり強いリーグです。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "絶対的な視聴者数主義ではない、ロサンゼルスだけが強くてもダメ。ニューヨークだけが儲かってもダメ。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "メンフィスやオクラホマシティのファンにも、「自分たちのチームがいつか優勝できる」",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "と思ってもらう必要があります。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "人気球団同士のファイナルでも楽しんでもらえるよう毎年試行錯誤し、ルールの変更が毎年行われます。",
            "bold": false
          }
        ]
      }
    ]
  },
  {
    "id": "league-values",
    "title": "大富豪のオーナーでさえ、リーグのルールには従う",
    "addedTitle": false,
    "blocks": [
      {
        "kind": "p",
        "runs": [
          {
            "text": "NBAの特徴は、戦力均衡だけではありません。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "リーグ自身の価値観を守ることにも、非常に強い姿勢を見せてきました。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "その象徴的な事件が、2014年のロサンゼルス・クリッパーズ元オーナー、ドナルド・スターリング事件です。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "人種差別的な発言が録音され問題となったスターリングに対し、NBAコミッショナーのアダム・シルバーは、",
            "bold": false
          },
          {
            "text": "NBAから永久追放。",
            "bold": true
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "さらに当時のNBA憲章上の上限だった、",
            "bold": false
          },
          {
            "text": "250万ドルの罰金",
            "bold": true
          },
          {
            "text": "を科しました。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "つまり、",
            "bold": false
          },
          {
            "text": "チームのオーナーだからリーグより偉いわけではない。",
            "bold": true
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "資産家であっても、NBAというコミュニティのルールや価値観から外れれば処分される。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "NBAは選手の人種差別的・差別的発言にも処分を行います。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "そして、その基準をオーナー側にも適用してきました。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "NBAは社会問題、人種問題、多様性、選手の権利について、アメリカの主要プロスポーツの中でも積極的に発信してきたリーグの一つです。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "もちろん、この姿勢をどう評価するかは人によって異なります。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "しかし、",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "「スポーツだけやっていればいい」というリーグではない",
            "bold": true
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "ことも、NBAという文化を理解するうえでは重要です。",
            "bold": false
          }
        ]
      }
    ]
  },
  {
    "id": "player-pool",
    "title": "競技人口の比較",
    "addedTitle": false,
    "blocks": [
      {
        "kind": "list",
        "items": [
          [
            {
              "text": "野球：世界約6,500万人（アメリカ、日本、中南米、一部の東アジア諸国中心）",
              "bold": false
            }
          ],
          [
            {
              "text": "アメフト：100か国で2,000万人　競技人口の多くがアメリカ（約900万人）",
              "bold": false
            }
          ],
          [
            {
              "text": "サッカー：211の国と地域　約2億5,000万〜2億6,000万人",
              "bold": false
            }
          ],
          [
            {
              "text": "アイスホッケー：カナダやアメリカなどの北米を中心に約50万〜60万人",
              "bold": false
            }
          ],
          [
            {
              "text": "バスケットボール：212の国と地域　世界で約4.5億人。",
              "bold": false
            }
          ],
          [
            {
              "text": "男女の競技者格差が小さく、競技人口の約4割が女性。中国だけでも約1億人",
              "bold": false
            }
          ],
          [
            {
              "text": "男性だけだと、サッカーと同等の競技人口を誇る",
              "bold": false
            }
          ]
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "サッカー",
            "bold": true
          },
          {
            "text": "：",
            "bold": false
          },
          {
            "text": "「世界最高峰の選手が全員集まる一つの国内リーグ」がない。",
            "bold": true
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "Premier Leagueを最高峰と評価する人もいる。",
            "bold": true
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "LaLigaのトップクラブを評価する人もいる。",
            "bold": true
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "Champions Leagueを最高峰の舞台と見る人もいる。",
            "bold": true
          }
        ]
      },
      {
        "kind": "list",
        "items": [
          [
            {
              "text": "イングランド：Premier League。",
              "bold": false
            }
          ],
          [
            {
              "text": "スペイン：LaLiga。",
              "bold": false
            }
          ],
          [
            {
              "text": "イタリア：Serie A。",
              "bold": false
            }
          ],
          [
            {
              "text": "ドイツ：Bundesliga。",
              "bold": false
            }
          ],
          [
            {
              "text": "フランス：Ligue 1。",
              "bold": false
            }
          ]
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "だけでも約100クラブあります。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "プレミアリーグだけでも、各クラブは最大25人の登録枠を持ち、さらにU21選手はその25人枠とは別に登録できます。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "5大リーグのトップチームだけを単純計算しても、約2,400〜2,500人規模になります。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "しかも、その下には2部、3部、4部。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "さらに各国リーグ、ユース、リザーブがあります。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "という大量のプロとしての受け皿があります。",
            "bold": false
          }
        ]
      },
      {
        "kind": "h3",
        "text": "MLB"
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "MLBは26人のロスター×30球団、",
            "bold": false
          },
          {
            "text": "780人。",
            "bold": true
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "さらにMLBには、その下にAAA、AA、Aなど巨大なマイナーリーグがあります。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "「トップリーグに入れなくてもプロ組織の中でプレーできる場所」",
            "bold": true
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "圧倒的に大きな受け皿を持っています。",
            "bold": false
          }
        ]
      },
      {
        "kind": "h3",
        "text": "NFL"
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "NFLは32チーム。1チーム53人のロスターなので、",
            "bold": false
          },
          {
            "text": "約1,696人。",
            "bold": true
          }
        ]
      },
      {
        "kind": "h3",
        "text": "NBAはサッカーと同じように競技人口も多くプロリーグも多いが"
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "大きな違いは明確で圧倒的なヒエラルキーがり世界中から最高レベルの選手が集まるリーグが最高到達点NBA。",
            "bold": false
          }
        ]
      },
      {
        "kind": "h3",
        "text": "NBAに入るのが難しい理由"
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "バスケットボールは巨大競技なのに、NBAは",
            "bold": true
          },
          {
            "text": "30チーム・ロスター15人",
            "bold": false
          },
          {
            "text": "最大約450人と",
            "bold": true
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "器が極端に小さい",
            "bold": true
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "ここが非常に重要です。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "MLBなら巨大なマイナー組織があります。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "NFLならトップロスターだけでも約1,700人。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "だからNBAロスターに残り続けること自体が、とてつもなく難しい。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "そしてNBAにはG Leagueがありますが、MLBのように何層にも分かれた巨大なマイナーリーグ組織とは構造が違います。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "NBAの契約を失えば、欧州、アジアなど世界中のリーグへ移る選手も珍しくありません。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "世界中のトップ選手が、毎年わずかなNBA契約枠を奪い合っています。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "「NBA選手の平均在籍年数は正確に4〜5年前後」",
            "bold": true
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "NBAで10年以上プレーするそれだけでも、本来はとてつもないことなのです。",
            "bold": false
          }
        ]
      }
    ]
  },
  {
    "id": "salary",
    "title": "NBA選手の平均サラリーはなぜ高いのか",
    "addedTitle": false,
    "blocks": [
      {
        "kind": "p",
        "runs": [
          {
            "text": "NBAのもう一つの特徴が、選手のサラリーです。",
            "bold": false
          }
        ]
      },
      {
        "kind": "list",
        "items": [
          [
            {
              "text": "NBA：平均年俸は約1,200万ドル（約18億円）",
              "bold": false
            }
          ],
          [
            {
              "text": "MLB：平均年俸は約534万ドル（約8億2800万円）",
              "bold": false
            }
          ],
          [
            {
              "text": "プレミアリーグ：約525万ユーロ（約8億〜9億円）",
              "bold": false
            }
          ],
          [
            {
              "text": "NFL：平均年俸は約370万ドル（約5億7,000万円）ル",
              "bold": false
            }
          ]
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "NBAの平均年俸が突出して高くなりやすい最大の理由の一つは、",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "リーグ収入を分ける選手数が少ないことです。",
            "bold": true
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "コートに立つのは5人。標準ロスターは最大15人。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "その限られた選手たちに巨大なリーグ収益が配分される。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "重要なのは、",
            "bold": true
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "NBAはトップ選手の年俸が無制限に高くなるリーグではない",
            "bold": true
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "ということです。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "NBAにはサラリーキャップがあります。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "さらに選手個人にもMAX契約という上限があります。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "つまり市場原理だけならさらに高い給与を得られる可能性があるスーパースターも、契約額には一定の制限があります。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "NBAの特徴は、",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "一部の選手だけが極端に高いのではなく、リーグ全体の平均給与が非常に高い",
            "bold": true
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "ことです。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "巨大なリーグ収益を、1チーム最大15人という少人数の標準契約選手で分配する。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "この構造がNBAの高い平均給与につながっています。",
            "bold": false
          }
        ]
      }
    ]
  },
  {
    "id": "stars",
    "title": "NBAは「観戦した日にスターを楽しみやすい」",
    "addedTitle": false,
    "blocks": [
      {
        "kind": "p",
        "runs": [
          {
            "text": "スポーツ観戦で重要なのは、実際に観戦する日、会場へ行った日に、そのスターをどれだけ見ることができるか？どれだけ活躍するか？",
            "bold": true
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "NBAでは、スター選手が一試合の中で長時間プレーし、攻守の両方に関わります。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "これが、ファンにとって大きな魅力になります。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "MLBの場合、世界最高クラスの打者でも、1試合の打席は通常4〜5回程度です。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "しかも野球では、優秀な打者でも毎試合ヒットを打つわけではありません。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "ホームランバッターを見に行っても、その日にホームランが出るとは限らない。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "4打数0安打で終わることもあります。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "つまりスター打者を見に行っても、",
            "bold": false
          },
          {
            "text": "実際にその選手がプレーの中心になる時間は意外と短い。",
            "bold": true
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "投手はさらに分かりやすい。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "エース級の先発投手は比較的長時間出場していますが、調子が悪く打たれたり100球目で降板して見れない可能性もある。また毎試合登板するわけではありません。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "「この日に球場へ行く」と決めても、その日に目当ての投手が登板するとは限らないし天候にも左右される。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "NFLのクォーターバックも、試合の主役になり得る重要なポジションです。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "しかし、NFLのレギュラーシーズンは17試合しかなく、攻撃の場面にしか出場しません。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "一方、NBAのスター選手は、健康であればシーズンを通してほとんど出場します。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "平均25得点を記録するような選手であれば、観戦した日にも一定の得点やプレーを見せる可能性が高い。しかも、30分、35分、時には40分近くコートに立ちます。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "コートが小さいので、基本的には常に映像には映っている。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "スター選手ともなれば、常にカメラで映像を抜かれる",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "相手のエースと直接マッチアップする。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "ファンは、スター選手が試合に出場している限り、その選手のプレーを長時間楽しめます。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "NBAでは、",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "「観戦した日に、スター選手がコートに立ち、試合の流れを変える場面を見られる」",
            "bold": true
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "試合を通して調子が悪くても、外されないのがスター選手で最後の1本シュートが入れば一躍ヒーローだし、試合を通して絶好調でも大事な場面で敗戦に繋がるミスをする",
            "bold": true
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "という良くも悪くも期待感があります。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "これが、NBA観戦の大きな魅力です。",
            "bold": false
          }
        ]
      }
    ]
  },
  {
    "id": "positions",
    "title": "「このポジションだから主役になれない」がない",
    "addedTitle": false,
    "blocks": [
      {
        "kind": "p",
        "runs": [
          {
            "text": "バスケットボールにはポジションがあります。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "Point Guard、Shooting Guard、Small Forward、Power Forward、Centerの5つ。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "基本的に5人全員が攻撃にも守備にも参加します。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "しかし現代NBAでは、急速にその境界が曖昧になっています。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "センターが3ポイントを打てない足が遅い、ディフェンスが悪いは需要がなくなりつつある",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "センターがポイントガードのようにパスを出してオフェンスを組み立てる。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "現にセンターがアシスト王になってます",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "ディフェンスのスイッチが多く、ガードとセンターの対決させミスマッチを生む戦術が多く取られているので身長が高くても機動力が重要視されてます。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "しかしNFLのように、",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "「攻撃専門」「守備専門」",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "と完全に役割が分離されているわけではありません。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "MLBの投手と野手ほど役割が分かれているわけでもない。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "だから、",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "どのポジションからでもスーパースターが生まれます。",
            "bold": true
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "これもNBAの大きな特徴です。",
            "bold": false
          }
        ]
      }
    ]
  },
  {
    "id": "physical",
    "title": "同じコートに、まるで違う身体的特徴をもった人間がいる",
    "addedTitle": false,
    "blocks": [
      {
        "kind": "p",
        "runs": [
          {
            "text": "そしてNBAを実際に見ると、さらに異常な世界が見えてきます。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "身長、体重、スピード、リーチ、ジャンプ力のまったく違う人間同士が直接戦う。",
            "bold": true
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "これがNBAです。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "170cm台のガードにはじまりさらに220cm級の選手まで存在します。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "体重も70kg台から120kg、130kgを超える選手までいる。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "190cmくらいの選手だと非常に小さく見えます",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "小さい選手が果敢にゴールにアタックするさいに210cm超え110キロ以上の選手にに向かってドライブしていく。時にはその上からダンクををする",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "特に身長224㎝のビクター・ウェンバンヤマはALIENと呼ばれ、長身でありながら高い機動力、シュート力、ボールハンドリングを備えた選手は、従来の長身選手は動きが遅い不器用の常識を大きく変えています。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "アメリカンフットボールにも大きな体格差があります。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "しかしポジションごとの役割が強く分かれています。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "NBAでは、まったく違う身体の選手が実際に1対1でマッチアップする。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "小さなガードが巨大なセンターを攻略する。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "巨大なセンターが高速ガードについていく。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "この「ミスマッチ」を作り、利用し、消すこと自体がNBAの戦術になっています。",
            "bold": false
          }
        ]
      }
    ]
  },
  {
    "id": "courtside",
    "title": "世界最高峰なのに、選手に手が届くほど近い",
    "addedTitle": false,
    "blocks": [
      {
        "kind": "p",
        "runs": [
          {
            "text": "NBAのエンターテインメント性を象徴しているのが、観客と選手の距離感",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "コートサイドには、フェンスもネットもガラスもありません。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "観客はコートのすぐ横に座ります。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "ルーズボールを追った選手が、そのまま観客席に飛び込む。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "選手がコートサイドの観客と接触する機会は多い。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "交代待ち、タイムアウト中、試合の中断中、選手がファンや著名人と談笑する。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "試合中に選手と観客が言葉を交わしたり、ハイタッチするシーンが日常。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "野球にはネットやフェンス、アイスホッケーはリンクがボードとガラスで囲まれています。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "アメフトでは広いサイドラインを挟みます。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "サッカーでも、ピッチとスタンドの間に一定の距離があります。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "その中でNBAは、",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "世界最大級のプロスポーツでありながら、観客が現役選手に手が届くほど近い位置で試合を観戦できる、極めて珍しいリーグです。",
            "bold": true
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "厳密に「世界で唯一」と断定することは難しい。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "しかし少なくとも、これほど巨大な世界的プロリーグで、試合中の選手と観客がこれほど近いスポーツはほとんどありません。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "だからコートサイドでは、",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "選手の表情。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "味方への指示。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "審判への抗議。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "シューズが床をこする音。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "身体がぶつかる音。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "時には選手同士の会話まで聞こえます。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "中継では選手にマイクを付けて放送してます。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "NBAでは、観客もある意味では同じフロアの空気を共有しています。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "これはテレビ画面を通しても伝わる、NBA独特の世界観です。",
            "bold": false
          }
        ]
      }
    ]
  },
  {
    "id": "players-as-content",
    "title": "NBAは「選手そのもの」がコンテンツになる",
    "addedTitle": false,
    "blocks": [
      {
        "kind": "p",
        "runs": [
          {
            "text": "NBA選手にはヘルメットがありません。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "顔が常に見えます。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "コートが小さい。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "選手数も少ない。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "テレビカメラは頻繁に選手をアップで映します。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "選手同士の会話や感情まで映し出されます。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "そしてスター選手は、健康であればシーズンを通して何十試合も出場します。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "その結果NBAでは、",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "チームだけではなく「選手個人」を応援する文化",
            "bold": true
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "が非常に強くなりました。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "Michael Jordan。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "Kobe Bryant。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "LeBron James。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "Stephen Curry。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "チーム名を知らなくても、彼らを知っている人は世界中にいます。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "スニーカー。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "ファッション。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "音楽。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "映画。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "SNS。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "スポンサー。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "NBA選手自身が一つのブランドになる。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "これもNBAが世界市場に拡大できた大きな理由の一つです。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "バスケットボールシューズは、競技者だけのものではありません。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "スター選手のシグネチャーモデルやチームカラーのスニーカーは、ファッションアイテムとしても広く受け入れられています。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "選手の名前が付いたシグネチャーシューズを、バスケットボールをプレーしない人がファッションとして履くことも珍しくありません。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "このように、NBAは競技の外側にも自然に広がっています。",
            "bold": false
          }
        ]
      }
    ]
  },
  {
    "id": "entertainment",
    "title": "NBAはスポーツであり、巨大なエンターテインメントでもある",
    "addedTitle": false,
    "blocks": [
      {
        "kind": "p",
        "runs": [
          {
            "text": "NBAは、競技としても非常にエンターテインメント性が高いスポーツです。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "攻守は数秒単位で入れ替わります。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "3ポイント。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "ダンク。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "ブロック。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "アリウープ。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "速攻。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "残り1秒のブザービーター。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "20点差が短時間でひっくり返ることもあります。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "さらにプレーが止まれば、",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "音楽。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "照明。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "映像。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "ダンサー。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "マスコット。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "観客参加型イベント。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "NBAのアリーナでは、試合が止まっている時間までエンターテインメントとして設計されています。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "そして現代ではSNSとの相性も非常に良い。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "10秒のダンク。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "30秒のクラッチショット。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "選手同士の口論。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "ベンチのリアクション。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "試合後のインタビュー。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "トレード情報。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "すべてが短い動画として世界中へ拡散します。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "2025-26シーズンからNBAは、Disney、NBCUniversal、Amazonと11年間の新しいメディア契約を開始しました。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "契約総額は760億ドル超と報じられています。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "さらに2025-26シーズンには、ABC/ESPN、Amazon Prime Video、NBC/Peacock、NBA TVを通じたNBAレギュラーシーズンの視聴者リーチが",
            "bold": false
          },
          {
            "text": "1億7,000万人",
            "bold": true
          },
          {
            "text": "に達し、NBAによれば24年ぶりの高水準となりました。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "NBA公式SNSの動画再生もシーズンで",
            "bold": false
          },
          {
            "text": "2,280億回",
            "bold": true
          },
          {
            "text": "を記録しています。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "NBAはテレビだけで成長しているリーグではありません。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "放送。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "ストリーミング。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "SNS。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "選手個人。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "すべてを使って世界中にコンテンツを届けています。",
            "bold": false
          }
        ]
      }
    ]
  },
  {
    "id": "future",
    "title": "バスケットボールの裾野とNBAの将来",
    "addedTitle": true,
    "blocks": [
      {
        "kind": "p",
        "runs": [
          {
            "text": "NBAの将来を考えるとき、バスケットボール競技人口は非常に大きな意味を持ちます。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "野球やフットボールを世界マーケットにするにはなかなか難しい。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "とにかくお金がかかりすぎる",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "サッカーは成熟しているが、リーグが国をまたいでいるのでまとまることはない",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "NBAが新しい国に進出したとき、",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "「その国の人に、まずバスケットボールという競技を理解してもらう」",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "ところから始める必要がない地域が大量に存在します。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "すでにボールを触ったことがある。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "ルールを知っている。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "NBA選手を知っている。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "バスケットボールシューズを履いている。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "そうした人々が世界中に存在しています。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "FIBAが引用するNielsen Sportsの調査では、世界のバスケットボールファンは",
            "bold": false
          },
          {
            "text": "33億人以上",
            "bold": true
          },
          {
            "text": "とされています。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "FIBA自身も、バスケットボールを世界で最も人気のあるスポーツコミュニティにすることをビジョンとして掲げています。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "中国。インド。フィリピン。日本。インドネシア。アフリカ。ヨーロッパ。中南米。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "NBAにとって、アメリカ以外の市場はまだ成長余地があります。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "手始めにヨーロッパ市場を開拓しようとしている",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "バスケットボールという競技そのものの裾野が巨大であることは、NBAの将来性を考えるうえで非常に大きな武器です。",
            "bold": false
          }
        ]
      }
    ]
  },
  {
    "id": "beyond-results",
    "title": "試合結果だけでは、NBAの半分しか見えていない",
    "addedTitle": false,
    "blocks": [
      {
        "kind": "p",
        "runs": [
          {
            "text": "NBAは、",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "試合を見ても面白い。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "選手を追っても面白い。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "数字を見ても面白い。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "そしてフロントオフィスを理解すると、さらに面白くなります。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "なぜ、この選手を獲得できたのか。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "なぜ、スター選手を手放したのか。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "なぜ、ドラフト1巡目指名権一つにこれほど価値があるのか。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "なぜ、年俸6,000万ドルの選手を簡単にトレードできないのか。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "なぜ、大富豪のオーナーでも好きなだけ選手を買えないのか。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "なぜ、弱かったチームが数年後に優勝候補になるのか。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "なぜ、同じ選手でも契約するタイミングによってチームへの影響が違うのか。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "そこには必ず、",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "NBA独自のルールとビジネスの仕組みがあります。",
            "bold": true
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "NBA Front Office Japanでは、",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "単に、",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "「○○が30得点した」",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "「○○がトレードされた」",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "「○○がMAX契約を結んだ」",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "という結果だけではなく、",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "「なぜ、そうなったのか」",
            "bold": true
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "まで掘り下げていきます。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "サラリーキャップ。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "契約。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "トレード。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "ドラフト。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "チーム経営。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "オーナー。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "放映権。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "選手市場。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "過去の事件。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "そしてNBAがこれからどこへ向かうのか。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "これらを理解すると、NBAの見え方は大きく変わります。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "昨日まで単なるトレードニュースだったものが、",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "「このチームは3年後を見て動いている」",
            "bold": true
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "と分かるようになる。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "理解できなかった大型契約が、",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "「このチームには、この契約をする理由があった」",
            "bold": true
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "と見えてくる。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "ドラフト指名権一つの価値が分かれば、トレードを見る面白さも変わる。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "サラリーキャップを理解すれば、フロントの能力まで見えてくる。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "そして戦力均衡というNBAの思想を理解すれば、",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "なぜ毎年ルールが変わるのか。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "なぜ大都市のチームでも自由に補強できないのか。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "なぜ小規模市場のチームでも優勝できるのか。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "その理由も見えてきます。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "NBAを、試合の結果だけで終わらせない。",
            "bold": true
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "選手・チーム・契約・数字・ビジネスまで知ることで、NBAはもっと面白くなる。",
            "bold": true
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "それが、NBA Front Office Japanです。",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "このGUIDEでは、NBAをより深く楽しむために必要な、",
            "bold": false
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "NBA制度・契約・ドラフト・トレード・NBAビジネス・過去事件・NBA用語",
            "bold": true
          }
        ]
      },
      {
        "kind": "p",
        "runs": [
          {
            "text": "を、一つずつ分かりやすく解説していきます。",
            "bold": false
          }
        ]
      }
    ]
  }
];
