// Server Component / Route Handler から使うSupabaseクライアント。
// anonキーを使用し、RLSの public read ポリシーの範囲でしかデータにアクセスできない。
// リクエストごとに新しいインスタンスを作る（将来Authを導入してcookieからセッションを
// 引き継ぐ際に、ここだけを変更すればよいようにするため）。

import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export function createServerSupabaseClient() {
  return createClient<Database>(supabaseUrl, supabaseAnonKey);
}
