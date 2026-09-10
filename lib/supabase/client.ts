// Client Component ("use client") から使うブラウザ用Supabaseクライアント。
// anonキーのみを使用し、RLSの public read ポリシーの範囲でしかデータにアクセスできない。

import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabaseBrowserClient = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey
);
