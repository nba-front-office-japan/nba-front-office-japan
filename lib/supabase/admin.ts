// service_role キーを使う管理者用クライアント。RLSを完全にバイパスするため、
// Server Component からのimportは "server-only" によりビルド時にエラーになる。
// Route Handler / Server Action など、信頼できるサーバーサイドの書き込み処理のみで使用すること。
// 絶対にClient Componentやブラウザに渡る値の生成に使わないこと。

import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export function createAdminSupabaseClient() {
  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
