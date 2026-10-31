import { createHash, timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { importBoxScoreWorkbook } from "@/lib/games/box-score-workbook-import";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// 外部の自動処理から、管理画面の「ボックススコアを取り込む」と同じ処理を実行する。
// proxy.ts のBasic認証は /admin 配下だけが対象なので、ここは Authorization: Bearer で独自に認証する。
// BOXSCORE_IMPORT_TOKEN が未設定のときは、常に401を返す。ファイルの中身やトークンはログに出さない。
const MAX_FILE_BYTES = 5 * 1024 * 1024;
// multipartの区切りやヘッダーの分。これを超える送信は読み込む前に断る
const MULTIPART_OVERHEAD_BYTES = 64 * 1024;

function sha256(value: string) {
  return createHash("sha256").update(value).digest();
}

// 長さの違いも漏らさないよう、ハッシュ同士を定数時間で比較する
function isAuthorized(request: Request) {
  const token = process.env.BOXSCORE_IMPORT_TOKEN;
  if (!token) return false;
  return timingSafeEqual(sha256(request.headers.get("authorization") ?? ""), sha256(`Bearer ${token}`));
}

function fail(error: string, status: number) {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) return fail("unauthorized", 401);

  const tooLarge = `ファイルが大きすぎます（上限 ${MAX_FILE_BYTES / 1024 / 1024}MB）。`;
  if (Number(request.headers.get("content-length") ?? 0) > MAX_FILE_BYTES + MULTIPART_OVERHEAD_BYTES) return fail(tooLarge, 413);

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return fail("multipart/form-data で file を送ってください。", 400);
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return fail("Excelファイル（.xlsx）を選んでください。", 400);
  if (!/\.xlsx$/i.test(file.name)) return fail("拡張子が .xlsx のファイルを選んでください。", 400);
  if (file.size > MAX_FILE_BYTES) return fail(tooLarge, 413);

  try {
    const result = await importBoxScoreWorkbook(createAdminSupabaseClient(), Buffer.from(await file.arrayBuffer()));
    revalidatePath("/admin/games");
    // 書式違いなどで1試合も登録できなかったときは、自動処理が失敗に気づけるよう422で返す
    const failed = result.importedGames.length === 0 && result.errorCount > 0;
    return NextResponse.json(
      {
        ok: !failed,
        fileName: file.name,
        inserted: result.inserted,
        updated: result.updated,
        errorCount: result.errorCount,
        errors: result.errors,
        warnings: result.warnings,
        importedGames: result.importedGames,
        incompleteGames: result.incompleteGames,
        skippedGameIds: result.skippedGameIds,
      },
      { status: failed ? 422 : 200 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return fail(`取り込みに失敗しました（データは変更されていません）：${message}`, 500);
  }
}
