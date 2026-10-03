"use client";

import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next";

// Vercel Web Analytics(Hobbyプランの無料枠で利用。月5万イベントまで、超えると課金ではなく計測が一時停止する)。
// 管理画面(/admin)の閲覧は運営者自身のアクセスなので計測しない(無料枠の節約とデータの正確さのため)。
function beforeSend(event: BeforeSendEvent): BeforeSendEvent | null {
  try {
    if (new URL(event.url).pathname.startsWith("/admin")) return null;
  } catch {
    // URLを解釈できない場合はそのまま送る
  }
  return event;
}

export function SiteAnalytics() {
  return <Analytics beforeSend={beforeSend} />;
}
