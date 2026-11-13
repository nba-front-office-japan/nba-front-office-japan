import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// /admin配下の暫定的な保護。News Collector Phase D（Supabase Auth +
// ADMIN_EMAIL_ALLOWLIST）で正式な認証に置き換えるまでの一時措置。
// ADMIN_BASIC_AUTH_PASSWORD未設定の場合は/adminへのアクセス自体を止める
// （誤って本番で誰でも入れる状態を避けるため）。
export const config = {
  matcher: ["/admin/:path*"],
};

export function proxy(request: NextRequest) {
  const password = process.env.ADMIN_BASIC_AUTH_PASSWORD;
  if (!password) {
    return new NextResponse("Admin console is not configured.", { status: 503 });
  }

  const expected = `Basic ${btoa(`admin:${password}`)}`;
  const authHeader = request.headers.get("authorization");

  if (authHeader !== expected) {
    return new NextResponse("Authentication required.", {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="NBA Front Office Japan Admin"',
      },
    });
  }

  return NextResponse.next();
}
