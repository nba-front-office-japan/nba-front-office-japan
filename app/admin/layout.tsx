import type { ReactNode } from "react";
import { AdminNav } from "./_components/admin-nav";

// 管理画面の共通レイアウト。上部ナビゲーションは縦にスクロールしても画面上部に固定する(高さ 3rem = top-12)。
// ナビの下に固定表示する要素(本文の入力欄のボタン列など)は top-12 を使い、ナビに隠れないようにする。
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AdminNav />
      {children}
    </div>
  );
}
