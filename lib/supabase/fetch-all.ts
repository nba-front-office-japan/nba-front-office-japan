import "server-only";
import type { PostgrestError } from "@supabase/supabase-js";

// PostgRESTは1リクエストあたり最大1000件しか返さないため、
// range()で全件をページングして取得する共通ヘルパー。
export async function fetchAllRows<T>(
  queryPage: (
    from: number,
    to: number
  ) => PromiseLike<{ data: T[] | null; error: PostgrestError | null }>
): Promise<{ data: T[]; error: PostgrestError | null }> {
  const PAGE_SIZE = 1000;
  const all: T[] = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await queryPage(from, from + PAGE_SIZE - 1);
    if (error) {
      return { data: all, error };
    }
    all.push(...(data ?? []));
    if (!data || data.length < PAGE_SIZE) break;
  }

  return { data: all, error: null };
}
