// トップページ(/)と運営者情報(/about)の冒頭に載せるサイト紹介文。
// 人数・項目数・語数は、実際に載せているデータから数える(手で書いた数字が古くならないように)。
//   ・レジェンド: lib/legends/data.ts の LEGENDS
//   ・歴代記録の項目数: オールタイムリーダーズ(/legends/leaders)で切り替えられる「表示の種類×項目」の数
//   ・用語集: lib/glossary-terms.ts の GLOSSARY_TERMS
import "server-only";
import { LEGENDS } from "@/lib/legends/data";
import { STATS_BY_VIEW } from "@/lib/legends/leaders";
import { GLOSSARY_TERMS } from "@/lib/glossary-terms";

const RECORD_ITEM_COUNT = Object.values(STATS_BY_VIEW).reduce((sum, stats) => sum + stats.length, 0);

export const SITE_INTRO =
  "NBA Front Office Japanは、試合の前・後で使える日本語のNBAデータベースです。" +
  "試合前は対戦の“みどころ”が読めて、試合後は結果を伏せたままボックススコアを確認できます。" +
  `現役全選手とレジェンド${LEGENDS.length}人の生涯スタッツ、アワード受賞履歴、ドラフト履歴まで収録。` +
  "スタッツは期間や項目で絞り込めます。" +
  `NBAの歴史特集（3ポイントの歴史、歴代記録${RECORD_ITEM_COUNT}項目）や、契約・トレード・サラリーキャップの解説、用語集${GLOSSARY_TERMS.length}語も用意しています。` +
  // 更新本数(2026-11-10 時点、公開記事を日本時間の日ごとに数えた値): 直近7日の平均21.7本、日別の最大35本(11/6)。
  // 30日平均は8.7本なので「最近は」とする。本数を減らす方針のため、平均・最多は控えめの数字にしている
  "ニュースは、日本の大手メディアが伝えない小さな契約やロスターの動きまで追いかけ、フロントの視点で日本語にしてお届けします。最近は1日平均10本以上、多い日は30本以上更新しています。";
