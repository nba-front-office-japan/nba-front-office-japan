import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-6 py-10 text-center">
        <h1 className="mb-2 text-2xl font-semibold">ページが見つかりません</h1>
        <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
          お探しのページは存在しないか、移動した可能性があります。
        </p>
        <Link href="/" className="text-sm font-medium text-accent underline">
          トップページに戻る
        </Link>
      </main>
    </div>
  );
}
