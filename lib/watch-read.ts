// 「観る・読むNBA」(/guide/watch-read)の作品データ。作品・紹介文・配信リンク・選手リンクはすべてここで管理する。
// - 配信・購入リンク(links)は、配信先を確認できた作品だけに付ける。無い作品はタイトルと紹介文だけ。
// - リンクは通常のURL。アフィリエイトに切り替えるときは links の href を差し替えるだけでよい(ページ側は変えない)。
// - 紹介文(intro)の中の選手名は players の ja と完全に同じ表記で書く。最初に出てきた箇所を選手ページ/レジェンドページへのリンクにする。
// - 選手ページ側の「動画・コラム」欄には、players に入っている選手の作品が自動で並ぶ(worksForFeatured / worksForLegend)。

/** 作品に出演・関連する選手。リンク先は featured(人気選手の選手ページ)→ db(選手名鑑の英語名)→ legend(/legends/slug)の順に探す */
export type WorkPlayer = {
  /** 紹介文での表記(この文字列が intro にそのまま含まれている必要がある) */
  ja: string;
  /** 人気選手の解説(lib/featured-players*.ts)の英語名 */
  featured?: string;
  /** /legends/ の slug */
  legend?: string;
  /** 人気選手の解説が無い選手の、選手名鑑(players.full_name)の英語名の候補 */
  db?: string[];
};

export type WorkLink = { label: string; href: string };

export type WorkCategory = "documentary" | "starring" | "theme" | "book";

export type Work = {
  /** ページ内リンク(#id)に使う */
  id: string;
  category: WorkCategory;
  title: string;
  /** 公開年・巻末の補足(例: 2020、2024-) */
  year?: string;
  /** 著者・出版社などの補足 */
  credit?: string;
  intro: string;
  players?: WorkPlayer[];
  /** 配信・購入リンク(配信先を確認できた作品だけ) */
  links?: WorkLink[];
  /** リンクにしない配信・販売の補足(例: BD・DVD) */
  availability?: string;
  /** シリーズの中のおすすめ回(30 for 30) */
  episodes?: { title: string; intro: string; players?: WorkPlayer[]; links?: WorkLink[] }[];
};

export const WORK_CATEGORIES: { key: WorkCategory; label: string; short: string; description: string }[] = [
  { key: "documentary", label: "ドキュメンタリー", short: "ドキュメンタリー", description: "実際の選手・チーム・出来事を追った作品。" },
  { key: "starring", label: "NBA選手が出演する映画", short: "映画", description: "NBA選手が俳優・本人役・カメオで出ている映画。" },
  { key: "theme", label: "NBA・バスケが題材の映画", short: "映画", description: "NBAやバスケットボールそのものを描いた映画。" },
  { key: "book", label: "書籍", short: "書籍", description: "選手・監督・記者が書いた本。" },
];

// 選手(同じ選手を何度も書かないよう、ここでまとめて定義)
const P = {
  jordan: { ja: "マイケル・ジョーダン", legend: "michael-jordan" },
  kobe: { ja: "コービー・ブライアント", legend: "kobe-bryant" },
  parker: { ja: "トニー・パーカー", featured: "Tony Parker" },
  lebron: { ja: "レブロン・ジェームズ", featured: "LeBron James", legend: "lebron-james" },
  juancho: { ja: "フアンチョ・エルナンゴメス", db: ["Juancho Hernangómez", "Juancho Hernangomez", "Juan Hernangómez", "Juan Hernangomez"] },
  edwards: { ja: "アンソニー・エドワーズ", featured: "Anthony Edwards" },
  garnett: { ja: "ケビン・ガーネット", legend: "kevin-garnett" },
  kyrie: { ja: "カイリー・アービング", featured: "Kyrie Irving" },
  shaq: { ja: "シャキール・オニール", legend: "shaquille-oneal" },
  reggie: { ja: "レジー・ミラー", legend: "reggie-miller" },
  penny: { ja: "ペニー・ハーダウェイ", featured: "Anfernee Hardaway" },
  rayAllen: { ja: "レイ・アレン", legend: "ray-allen" },
  wilt: { ja: "ウィルト・チェンバレン", legend: "wilt-chamberlain" },
  kareem: { ja: "カリーム・アブドゥル＝ジャバー", legend: "kareem-abdul-jabbar" },
  muresan: { ja: "ゲオルゲ・ムレシャン", featured: "Gheorghe Muresan" },
  durant: { ja: "ケビン・デュラント", featured: "Kevin Durant", legend: "kevin-durant" },
  iverson: { ja: "アレン・アイバーソン", legend: "allen-iverson" },
  dirk: { ja: "ダーク・ノビツキー", legend: "dirk-nowitzki" },
  kidd: { ja: "ジェイソン・キッド", legend: "jason-kidd" },
  nash: { ja: "スティーブ・ナッシュ", legend: "steve-nash" },
  boban: { ja: "ボバン・マリヤノビッチ", db: ["Boban Marjanović", "Boban Marjanovic"] },
  rodman: { ja: "デニス・ロッドマン", legend: "dennis-rodman" },
  erving: { ja: "ジュリアス・アービング", legend: "julius-erving" },
  bird: { ja: "ラリー・バード", legend: "larry-bird" },
  giannis: { ja: "ヤニス・アデトクンボ", featured: "Giannis Antetokounmpo", legend: "giannis-antetokounmpo" },
  watanabe: { ja: "渡邊雄太", featured: "Yuta Watanabe" },
  tabuse: { ja: "田臥勇太", featured: "Yuta Tabuse" },
  webber: { ja: "クリス・ウェバー", featured: "Chris Webber" },
  isiah: { ja: "アイザイア・トーマス", legend: "isiah-thomas" },
} satisfies Record<string, WorkPlayer>;

const netflix = (id: string): WorkLink => ({ label: "Netflix", href: `https://www.netflix.com/jp/title/${id}` });
const disney = (path: string): WorkLink => ({ label: "Disney+", href: `https://www.disneyplus.com/ja-jp/browse/${path}` });

export const WORKS: Work[] = [
  // ---- ドキュメンタリー(11) ----
  {
    id: "the-last-dance",
    category: "documentary",
    title: "マイケル・ジョーダン：ラストダンス",
    year: "2020",
    intro: "マイケル・ジョーダンと1990年代のシカゴ・ブルズを、1997-98シーズンの映像を軸にたどるドキュメンタリーシリーズ。",
    players: [P.jordan],
    links: [netflix("80203144")],
  },
  {
    id: "starting-5",
    category: "documentary",
    title: "スターティング5：選ばれしエースたち",
    year: "2024-",
    intro: "NBAを代表するスター選手たちに密着し、1シーズンの戦いをコートの内と外から追うドキュメンタリーシリーズ。",
    links: [netflix("81720808")],
  },
  {
    id: "the-redeem-team",
    category: "documentary",
    title: "リディームチーム：王座奪還への道",
    year: "2022",
    intro: "2004年アテネ五輪で金メダルを逃したアメリカ代表が、2008年北京五輪で頂点を取り戻すまでを描く。コービー・ブライアントもその中心にいました。",
    players: [P.kobe],
    links: [netflix("81452996")],
  },
  {
    id: "untold-malice-at-the-palace",
    category: "documentary",
    title: "Untold：パレスの騒乱",
    intro: "2004年、ピストンズ対ペイサーズの試合中に選手と観客を巻き込んで起きた乱闘事件を、当事者の証言で振り返る。",
    links: [netflix("81026439")],
  },
  {
    id: "tony-parker-the-final-shot",
    category: "documentary",
    title: "トニー・パーカー：ファイナルショット",
    intro: "フランスからNBAに渡り、スパーズで4度の優勝を果たしたトニー・パーカーのキャリアをたどるドキュメンタリー。",
    players: [P.parker],
    links: [netflix("81274937")],
  },
  {
    id: "last-chance-u-basketball",
    category: "documentary",
    title: "ラスト・チャンス：バスケ編",
    intro: "ロサンゼルスの短期大学、イースト・ロサンゼルス・カレッジのバスケ部に密着。4年制大学への道を目指す選手たちを追うシリーズ。",
    links: [netflix("81046613")],
  },
  {
    id: "30-for-30",
    category: "documentary",
    title: "30 for 30",
    intro: "ESPNのスポーツドキュメンタリーシリーズ。バスケットボールを扱った回の中から、必見の5本を挙げます。",
    // Disney+(日本)の作品ページは回ごと。日本のページが確認できた回(Bad Boys・Jordan Rides the Bus)だけリンクする(2026-11-21確認)
    episodes: [
      {
        title: "Once Brothers",
        intro: "ユーゴスラビア代表で共に戦ったドラジェン・ペトロビッチとブラデ・ディバッツ。祖国の内戦が2人の友情を引き裂く。",
      },
      {
        title: "The Fab Five",
        intro: "1990年代初め、1年生5人で全米を沸かせたミシガン大学の「ファブ・ファイブ」。クリス・ウェバーもその一人。",
        players: [P.webber],
      },
      {
        title: "Bad Boys",
        intro: "1989年・1990年に連覇したピストンズ「バッドボーイズ」。アイザイア・トーマスを中心にした激しいチームの物語。",
        players: [P.isiah],
        links: [disney("entity-e301e8ec-91ae-40b7-8df7-23c0abb941e7")],
      },
      {
        title: "This Magic Moment",
        intro: "シャキール・オニールとペニー・ハーダウェイが並び立った、1990年代のオーランド・マジック。",
        players: [P.shaq, P.penny],
      },
      {
        title: "Jordan Rides the Bus",
        intro: "1度目の引退のあと、野球のマイナーリーグに挑んだマイケル・ジョーダンの1年。",
        players: [P.jordan],
        links: [disney("entity-92b941cb-47c2-4d7c-80a3-ed514233735c")],
      },
    ],
  },
  {
    id: "legacy-lakers",
    category: "documentary",
    title: "レイカーズ伝説：ジェリー・バスという男の物語",
    intro: "レイカーズのオーナー、ジェリー・バスと家族の物語。「ショータイム」の時代から、チーム経営をめぐる家族の対立までを描くシリーズ。",
    links: [disney("entity-dbe09f5a-2604-45dd-9997-2391a9639ffb")],
  },
  {
    id: "believe",
    category: "documentary",
    title: "BELIEVE 日本バスケを諦めなかった男たち",
    intro: "FIBAワールドカップ2023に挑んだバスケットボール男子日本代表の戦いを追ったドキュメンタリー映画。",
    links: [{ label: "Prime Video", href: "https://www.amazon.co.jp/dp/B0D67DPH2S" }],
    availability: "BD・DVDも発売",
  },
  {
    id: "court-of-gold",
    category: "documentary",
    title: "コート・オブ・ゴールド",
    year: "2025",
    intro: "パリ2024五輪の男子バスケットボールで、金メダルを争った代表チームの舞台裏に迫るシリーズ。",
    links: [netflix("81739527")],
  },
  {
    id: "michael-jordan-to-the-max",
    category: "documentary",
    title: "マイケル・ジョーダン・トゥ・ザ・マックス",
    year: "2000",
    intro: "IMAXの大画面向けに作られた、マイケル・ジョーダンの1997-98シーズンとそのキャリアを描くドキュメンタリー。",
    players: [P.jordan],
  },

  // ---- NBA選手が出演する映画(20) ----
  {
    id: "space-jam",
    category: "starring",
    title: "スペース・ジャム",
    year: "1996",
    intro: "マイケル・ジョーダンがルーニー・テューンズの仲間とチームを組み、宇宙人とバスケで対決する、実写とアニメの合成映画。",
    players: [P.jordan],
    links: [{ label: "TELASA", href: "https://www.telasa.jp/videos/32977" }],
  },
  {
    id: "space-jam-a-new-legacy",
    category: "starring",
    title: "スペース・ジャム：新たなる伝説",
    year: "2021",
    intro: "レブロン・ジェームズほかが出演する『スペース・ジャム』の続編。ルーニー・テューンズと組んでバスケの試合に挑む。",
    players: [P.lebron],
  },
  {
    id: "hustle",
    category: "starring",
    title: "ハッスル",
    year: "2022",
    intro: "落ち目のNBAスカウトが、スペインで見つけた無名の選手をNBAに送り込もうとする物語。フアンチョ・エルナンゴメス、アンソニー・エドワーズほかが出演。",
    players: [P.juancho, P.edwards],
    links: [netflix("80242342")],
  },
  {
    id: "uncut-gems",
    category: "starring",
    title: "アンカット・ジェムズ",
    year: "2019",
    intro: "借金を抱えたニューヨークの宝石商が、大きな賭けに出るスリラー。ケビン・ガーネットが本人役で出演。",
    players: [P.garnett],
  },
  {
    id: "uncle-drew",
    category: "starring",
    title: "アンクル・ドリュー",
    year: "2018",
    intro: "カイリー・アービングが老人に扮したストリートバスケの名手を演じるコメディ。シャキール・オニール、レジー・ミラーも出演。",
    players: [P.kyrie, P.shaq, P.reggie],
  },
  {
    id: "blue-chips",
    category: "starring",
    title: "ブルーチップス",
    year: "1994",
    intro: "勝利のために選手集めの不正に手を染めていく大学バスケの監督の物語。シャキール・オニールとペニー・ハーダウェイが有望選手役で出演。",
    players: [P.shaq, P.penny],
  },
  {
    id: "he-got-game",
    category: "starring",
    title: "ラストゲーム",
    year: "1998",
    intro: "スパイク・リー監督作。全米が注目する高校の有望選手をレイ・アレンが演じ、デンゼル・ワシントンがその父親役。",
    players: [P.rayAllen],
  },
  {
    id: "eddie",
    category: "starring",
    title: "エディー 勝利の天使",
    year: "1996",
    intro: "ニックスの熱狂的なファンの女性が、ひょんなことからチームの監督になってしまうコメディ。現役NBA選手49人が出演。",
  },
  {
    id: "kazaam",
    category: "starring",
    title: "ミラクル・アドベンチャー/カザーン",
    year: "1996",
    intro: "シャキール・オニールがランプの精を演じるファンタジー映画。",
    players: [P.shaq],
  },
  {
    id: "steel",
    category: "starring",
    title: "スティール",
    year: "1997",
    intro: "シャキール・オニールが鋼鉄のスーツをまとうヒーローを演じるアクション映画。",
    players: [P.shaq],
  },
  {
    id: "conan-the-destroyer",
    category: "starring",
    title: "キング・オブ・デストロイヤー/コナンPART2",
    year: "1984",
    intro: "アーノルド・シュワルツェネッガー主演の『コナン・ザ・グレート』の続編。ウィルト・チェンバレンが戦士の役で出演。",
    players: [P.wilt],
  },
  {
    id: "airplane",
    category: "starring",
    title: "フライングハイ",
    year: "1980",
    intro: "旅客機のパニック映画をパロディにしたコメディ。カリーム・アブドゥル＝ジャバーが副操縦士の役で出演。",
    players: [P.kareem],
  },
  {
    id: "game-of-death",
    category: "starring",
    title: "ブルース・リー/死亡遊戯",
    year: "1978",
    intro: "ブルース・リーの主演作。カリーム・アブドゥル＝ジャバーがリーと戦う大男の役で出演。",
    players: [P.kareem],
  },
  {
    id: "my-giant",
    category: "starring",
    title: "マイ・ジャイアント",
    year: "1998",
    intro: "芸能エージェントがルーマニアで出会った大男を売り出そうとするコメディ。大男の役はゲオルゲ・ムレシャン。",
    players: [P.muresan],
    links: [{ label: "Google Play", href: "https://play.google.com/store/movies/details?id=C7974B5C02DECF12MV" }],
  },
  {
    id: "thunderstruck",
    category: "starring",
    title: "サンダーストラック 奇跡を呼ぶダンクシューター",
    year: "2012",
    intro: "ケビン・デュラントの才能が、バスケの苦手な少年と入れ替わってしまうコメディ。",
    players: [P.durant],
    links: [{ label: "Amazon Video(レンタル)", href: "https://www.amazon.co.jp/gp/video/detail/B010EBPTSC" }],
  },
  {
    id: "like-mike",
    category: "starring",
    title: "ライク・マイク",
    year: "2002",
    intro: "古いバスケットシューズを履いた少年が、NBAで活躍する物語。アレン・アイバーソン、ダーク・ノビツキー、ジェイソン・キッド、スティーブ・ナッシュらがカメオ出演。",
    players: [P.iverson, P.dirk, P.kidd, P.nash],
  },
  {
    id: "john-wick-parabellum",
    category: "starring",
    title: "ジョン・ウィック：パラベラム",
    year: "2019",
    intro: "キアヌ・リーブス主演のアクション映画シリーズ第3作。ボバン・マリヤノビッチが殺し屋の役で出演。",
    players: [P.boban],
  },
  {
    id: "double-team",
    category: "starring",
    title: "ダブルチーム",
    year: "1997",
    intro: "ジャン＝クロード・ヴァン・ダム主演のアクション映画。デニス・ロッドマンが共演。",
    players: [P.rodman],
  },
  {
    id: "the-fish-that-saved-pittsburgh",
    category: "starring",
    title: "ザ・フィッシュ・ザット・セイヴド・ピッツバーグ",
    year: "1979",
    intro: "弱小プロバスケチームが星占いで選手を集めて立て直しを図るコメディ。ジュリアス・アービング（Dr.J）主演、カリーム・アブドゥル＝ジャバー、コニー・ホーキンス、ボブ・ラニアーらも出演。",
    players: [P.erving, P.kareem],
  },
  {
    id: "celtic-pride",
    category: "starring",
    title: "セルティック・プライド",
    year: "1996",
    intro: "セルティックスの熱狂的なファン2人が、ファイナルの相手チームのスター選手を誘拐してしまうコメディ。ラリー・バードが本人役でカメオ出演。",
    players: [P.bird],
  },

  // ---- NBA・バスケが題材の映画(10) ----
  {
    id: "air",
    category: "theme",
    title: "エア",
    year: "2023",
    intro: "ナイキがマイケル・ジョーダンとの契約に挑み、「エア・ジョーダン」が生まれるまでを描く実話ベースの映画。",
    players: [P.jordan],
  },
  {
    id: "high-flying-bird",
    category: "theme",
    title: "ハイ・フライング・バード",
    year: "2019",
    intro: "プロバスケのロックアウト（労使交渉の決裂で試合が止まる状態）の最中、スポーツエージェントがリーグの仕組みを揺さぶろうとする物語。",
    links: [netflix("80991400")],
  },
  {
    id: "white-men-cant-jump",
    category: "theme",
    title: "ホワイトメン・キャント・ジャンプ",
    year: "1992",
    intro: "ロサンゼルスのストリートコートで、賭けバスケに挑む2人の男のコメディ。",
  },
  {
    id: "glory-road",
    category: "theme",
    title: "グローリー・ロード",
    year: "2006",
    intro: "1966年、黒人選手5人を先発に並べて全米大学選手権を制したテキサス・ウエスタン大学の実話。",
  },
  {
    id: "coach-carter",
    category: "theme",
    title: "コーチ・カーター",
    year: "2005",
    intro: "学業の成績を守れない選手は試合に出さない。高校バスケ部に厳しい約束を課したコーチの実話をもとにした映画。",
  },
  {
    id: "semi-pro",
    category: "theme",
    title: "セミプロ",
    year: "2008",
    intro: "NBAと合併する前のリーグ、ABAの弱小チームを舞台にしたウィル・フェレル主演のコメディ。",
  },
  {
    id: "rebound",
    category: "theme",
    title: "リバウンド",
    year: "1996",
    intro: "ニューヨークのストリートバスケの伝説、アール・マニゴートの伝記映画。ドン・チードル主演、若き日のケビン・ガーネットがウィルト・チェンバレン役、カリーム・アブドゥル＝ジャバーも本人役で出演。",
    players: [P.garnett, P.wilt, P.kareem],
  },
  {
    id: "rise",
    category: "theme",
    title: "ライズ",
    year: "2022",
    intro: "ナイジェリアからギリシャに渡った移民一家の兄弟が、NBAへたどり着くまでの実話。ヤニス・アデトクンボと家族の物語。",
    players: [P.giannis],
    links: [disney("entity-796172ae-3944-49cb-8d5c-5b8f55b49591")],
  },
  {
    id: "hoosiers",
    category: "theme",
    title: "フージャーズ",
    year: "1986",
    intro: "1950年代のインディアナ州で、小さな町の高校バスケ部が州大会の頂点を目指す物語。",
  },
  {
    id: "above-the-rim",
    category: "theme",
    title: "アバブ・ザ・リム",
    year: "1994",
    intro: "ニューヨーク・ハーレムの高校バスケのスター選手が、ストリートの誘惑と自分の将来の間で揺れる物語。",
  },

  // ---- 書籍(6) ----
  {
    id: "the-mamba-mentality",
    category: "book",
    title: "KOBE BRYANT THE MAMBA MENTALITY HOW I PLAY",
    credit: "イースト・プレス",
    intro: "コービー・ブライアントが、自らのプレーと考え方を写真とともに語った一冊。",
    players: [P.kobe],
  },
  {
    id: "eleven-rings",
    category: "book",
    title: "イレブンリングス 勝利の神髄",
    credit: "フィル・ジャクソン",
    intro: "ブルズとレイカーズで監督として11度の優勝を果たしたフィル・ジャクソンが、チームづくりの考え方を語る。",
  },
  {
    id: "sacred-hoops",
    category: "book",
    title: "シカゴ・ブルズ 勝利への意識革命",
    credit: "フィル・ジャクソン",
    intro: "フィル・ジャクソンが、ブルズを率いた日々と、チームをひとつにまとめるための考え方をつづった本。",
  },
  {
    id: "kokoro",
    category: "book",
    title: "心 NBAで運命を切り拓いた本当に大切な想い",
    credit: "渡邊雄太",
    intro: "NBAで道を切り拓いてきた渡邊雄太が、自らの歩みと大切にしてきた思いをつづった本。",
    players: [P.watanabe],
  },
  {
    id: "never-too-late",
    category: "book",
    title: "Never Too Late 今からでも遅くない",
    credit: "田臥勇太",
    intro: "日本人で初めてNBAのコートに立った田臥勇太の著書。",
    players: [P.tabuse],
  },
  {
    id: "the-man",
    category: "book",
    title: "The Man〜マイケル・ジョーダン・ストーリー完結編",
    credit: "宮地陽子",
    intro: "マイケル・ジョーダンの歩みを描いたストーリーの完結編。著者はバスケットボールライターの宮地陽子。",
    players: [P.jordan],
  },
];

export const WATCH_READ_PATH = "/guide/watch-read";

/** 作品に関わる選手すべて(シリーズのおすすめ回の選手も含む) */
export function workPlayers(w: Work): WorkPlayer[] {
  return [...(w.players ?? []), ...(w.episodes ?? []).flatMap((e) => e.players ?? [])];
}

export function workCategoryShort(w: Work): string {
  return WORK_CATEGORIES.find((c) => c.key === w.category)?.short ?? "";
}

/** 選手ページの「動画・コラム」欄に出す、その選手の関連作品(作品ページの該当箇所へのリンク) */
export type PlayerWorkLink = { title: string; href: string; label: string };

function toPlayerWorkLinks(match: (p: WorkPlayer) => boolean): PlayerWorkLink[] {
  return WORKS.flatMap((w) => {
    // シリーズ(30 for 30)は、その選手が出てくる回の名前も付ける(例: 30 for 30「This Magic Moment」)
    const episodes = (w.episodes ?? []).filter((e) => (e.players ?? []).some(match));
    if (!(w.players ?? []).some(match) && episodes.length === 0) return [];
    const title = episodes.length > 0 ? `${w.title}${episodes.map((e) => `「${e.title}」`).join("")}` : w.title;
    return [{ title, href: `${WATCH_READ_PATH}#${w.id}`, label: workCategoryShort(w) }];
  });
}

export const worksForFeatured = (englishName: string) => toPlayerWorkLinks((p) => p.featured === englishName);
export const worksForLegend = (slug: string) => toPlayerWorkLinks((p) => p.legend === slug);
