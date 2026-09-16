import Link from "next/link";
import { PageShell } from "@/components/page-shell";

export default function NotFound() {
  return (
    <PageShell>
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h1 className="mb-2 text-2xl font-semibold">ページが見つかりません</h1>
        <p className="mb-6 text-sm text-muted">
          お探しのページは存在しないか、移動した可能性があります。
        </p>
        <Link href="/" className="text-sm font-bold text-blue underline">
          トップページに戻る
        </Link>
      </div>
    </PageShell>
  );
}
