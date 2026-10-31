import type { NewsTopic } from "@/lib/supabase/types";

// 記事のタイトル(と本文の冒頭)から、NEWS のタブ(公開カテゴリ)を推測する。
// 記事下書きの編集ページで「NEWSのタブ」の初期選択に使う(編集者が確認して、違えば選び直す)。
// 上から順に調べ、最初に当てはまったものを返す。どれにも当てはまらなければ「話題・オフコート」。
const RULES: { topic: NewsTopic; pattern: RegExp }[] = [
  { topic: "rumor", pattern: /噂|うわさ|トレード候補|関心を示|獲得を検討|移籍の可能性|rumor/i },
  {
    topic: "injury",
    pattern: /負傷|怪我|けが|離脱|骨折|断裂|捻挫|脱臼|挫傷|手術|欠場|今季絶望|今季全休|MRI|ハムストリング|復帰時期|injur/i,
  },
  {
    topic: "offcourt",
    pattern: /ジャージ|ユニフォーム|コート$|全30チームコート|動画|SNS|TikTok|財団|聖火|株主|死去|広告|プレゼント|大統領|ライブ|親権|賭博|宣伝|息子|フュージョン/,
  },
  { topic: "column", pattern: /ランキング|なぜ|何故|理由|とは何者か|どこまで|行方|考察|分析|時代|新たな常識|トレンド|事件その|課題|予想|支持率|か？|\?|？/ },
  {
    topic: "contract",
    pattern: /契約|延長|トレード|放出|ウェイブ|解雇|オプション|Two-Way|ロスター整理|ロスター最終|ロスター動向|残留|獲得|FA/i,
  },
  { topic: "game", pattern: /得点|リバウンド|アシスト|トリプルダブル|初勝利|連勝|連敗|逆転|復帰戦|デビュー|開幕戦で|永久欠番|週目総括|先発|初戦/ },
  { topic: "interview", pattern: /「[^」]+」|語る|語った|と発言|を明かす|と述べ|コメントを拒否|否定|反論|認める/ },
  {
    topic: "league",
    pattern: /リーグ|拡張|コミッショナー|放送|視聴|ルール|規制|判定|提携|売上|オーナー|売却|球団|新GM|罰則|NBAカップ|NBA Europe|ヨーロッパ|欧州|FIBA|パートナーシップ|提訴|フランチャイズ/,
  },
];

export function guessNewsTopic(text: string): NewsTopic {
  for (const rule of RULES) {
    if (rule.pattern.test(text)) return rule.topic;
  }
  return "offcourt";
}
