// balldontlie API (https://api.balldontlie.io/v1/players) から選手データを取得し、
// Supabaseのplayersテーブルにupsertするスクリプト。
//
// 実行方法: npx ts-node scripts/import-players.ts
//
// 【重要な設計メモ】
// - balldontlieの`id`はNBA公式のPERSON_IDとは別の独自ID体系であり、既存データ
//   （Stephen Curry: nba_person_id=201939）と番号空間が一致しない。そのためこの
//   スクリプトではnba_person_idへの書き込みは行わず、(first_name, last_name) を
//   キーにした重複判定（アプリケーション側upsert）で対応している。
// - balldontlieの無料プランには「現役選手のみ」を取得するエンドポイント
//   （/v1/players/active）が無く、ベースの/v1/playersにあるteam情報も現役判定には
//   使えない（引退済み選手にも過去の所属チームが残っている）ことを確認済み。
//   そのため、このスクリプトは取得した全選手（歴代含む）を is_active = true として
//   投入する。現役/引退の選別は別タスクで行う。
// - height/weightは "6-6"（フィート-インチ）/ "190"（ポンド）の文字列で返るため、
//   cm / kg に変換して保存する。
// - 無料プランのレート制限は 5 req/分。安全のため1リクエストごとに13秒待機する。

import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

import { createClient } from "@supabase/supabase-js";
import type { Database } from "../lib/supabase/types";

// lib/supabase/admin.ts は "server-only" を読み込むため、Next.jsのバンドラーを
// 経由しないNodeスクリプトから直接importできない（server-onlyのプレーンなNode解決先は
// 常にthrowする実装で、これはNext.js等のバンドラーがreact-server条件で
// 無害な実装に差し替えることを前提にしているため）。そのためこのスクリプト専用に
// 同等のadmin clientをその場で生成する。

function createAdminSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

type PlayerInsert = Database["public"]["Tables"]["players"]["Insert"];

const BALLDONTLIE_API_KEY = process.env.BALLDONTLIE_API_KEY;
const BASE_URL = "https://api.balldontlie.io/v1/players";
const PER_PAGE = 100;
const REQUEST_INTERVAL_MS = 13_000;

interface BallDontLiePlayer {
  id: number;
  first_name: string;
  last_name: string;
  position: string | null;
  height: string | null;
  weight: string | null;
  draft_year: number | null;
  draft_round: number | null;
  draft_number: number | null;
  country: string | null;
}

interface BallDontLieResponse {
  data: BallDontLiePlayer[];
  meta: { next_cursor: number | null; per_page: number };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function nameKey(firstName: string, lastName: string): string {
  return `${firstName.trim().toLowerCase()}|${lastName.trim().toLowerCase()}`;
}

function heightToCm(height: string | null): number | null {
  if (!height) return null;
  const match = /^(\d+)-(\d+)$/.exec(height.trim());
  if (!match) return null;
  const feet = Number(match[1]);
  const inches = Number(match[2]);
  return Math.round(feet * 30.48 + inches * 2.54);
}

function weightToKg(weight: string | null): number | null {
  if (!weight || weight.trim() === "") return null;
  const lbs = Number(weight);
  if (!Number.isFinite(lbs)) return null;
  return Math.round(lbs * 0.453592 * 10) / 10;
}

async function fetchPage(cursor: number | null): Promise<BallDontLieResponse> {
  const url = new URL(BASE_URL);
  url.searchParams.set("per_page", String(PER_PAGE));
  if (cursor !== null) {
    url.searchParams.set("cursor", String(cursor));
  }

  const res = await fetch(url, {
    headers: { Authorization: BALLDONTLIE_API_KEY! },
  });

  if (res.status === 429) {
    console.warn("  レート制限に達しました。60秒待機してリトライします...");
    await sleep(60_000);
    return fetchPage(cursor);
  }

  if (!res.ok) {
    throw new Error(`balldontlie APIエラー: HTTP ${res.status} ${await res.text()}`);
  }

  return res.json() as Promise<BallDontLieResponse>;
}

async function main() {
  if (!BALLDONTLIE_API_KEY) {
    throw new Error("BALLDONTLIE_API_KEY が .env.local に設定されていません");
  }

  const supabase = createAdminSupabaseClient();

  console.log("Supabaseから既存のplayersを取得中...");
  // PostgRESTは1リクエストあたり最大1000件しか返さないため、rangeで全件ページングする。
  const PAGE_SIZE = 1000;
  const existingPlayers: { id: string; first_name: string; last_name: string }[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error: fetchError } = await supabase
      .from("players")
      .select("id, first_name, last_name")
      .range(from, from + PAGE_SIZE - 1);

    if (fetchError) {
      throw new Error(`既存players取得に失敗しました: ${fetchError.message}`);
    }
    existingPlayers.push(...(data ?? []));
    if (!data || data.length < PAGE_SIZE) break;
  }

  const existingIdByName = new Map<string, string>();
  for (const p of existingPlayers) {
    existingIdByName.set(nameKey(p.first_name, p.last_name), p.id);
  }
  console.log(`既存players: ${existingIdByName.size}件\n`);

  let cursor: number | null = null;
  let page = 0;
  let totalFetched = 0;
  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  do {
    page += 1;
    console.log(`ページ${page}取得中（cursor=${cursor ?? "先頭"}）...`);
    const { data: players, meta } = await fetchPage(cursor);
    totalFetched += players.length;
    console.log(`  ${players.length}件取得（累計 ${totalFetched}件）`);

    const toInsert: PlayerInsert[] = [];

    for (const p of players) {
      if (!p.first_name || !p.last_name) {
        skipped += 1;
        continue;
      }

      const row = {
        first_name: p.first_name,
        last_name: p.last_name,
        position: p.position && p.position.trim() !== "" ? p.position : null,
        height_cm: heightToCm(p.height),
        weight_kg: weightToKg(p.weight),
        draft_year: p.draft_year,
        draft_round: p.draft_round,
        draft_pick: p.draft_number,
        nationality: p.country && p.country.trim() !== "" ? p.country : null,
        is_active: true,
      };

      const key = nameKey(p.first_name, p.last_name);
      const existingId = existingIdByName.get(key);

      if (existingId) {
        const { error } = await supabase
          .from("players")
          .update(row)
          .eq("id", existingId);
        if (error) {
          console.error(`  更新失敗 (${p.first_name} ${p.last_name}): ${error.message}`);
          continue;
        }
        updated += 1;
      } else {
        toInsert.push(row);
      }
    }

    if (toInsert.length > 0) {
      const { data: insertedRows, error } = await supabase
        .from("players")
        .insert(toInsert)
        .select("id, first_name, last_name");

      if (error) {
        console.error(`  一括登録に失敗しました: ${error.message}`);
      } else {
        for (const row of insertedRows ?? []) {
          existingIdByName.set(nameKey(row.first_name, row.last_name), row.id);
        }
        inserted += insertedRows?.length ?? 0;
      }
    }

    const MAX_INT32 = 2147483647;
    if (
      typeof meta.next_cursor === "number" &&
      Number.isInteger(meta.next_cursor) &&
      meta.next_cursor > 0 &&
      meta.next_cursor <= MAX_INT32
    ) {
      cursor = meta.next_cursor;
      await sleep(REQUEST_INTERVAL_MS);
    } else {
      if (meta.next_cursor) {
        console.warn(
          `  next_cursor(${meta.next_cursor})が不正な範囲のため、ここでページネーションを終了します。`
        );
      }
      cursor = null;
    }
  } while (cursor !== null);

  console.log("\n=== 完了 ===");
  console.log(`取得総数: ${totalFetched}件`);
  console.log(`新規登録: ${inserted}件`);
  console.log(`更新: ${updated}件`);
  console.log(`スキップ（氏名欠損）: ${skipped}件`);
}

main().catch((error) => {
  console.error("スクリプト実行中にエラーが発生しました:", error);
  process.exit(1);
});
