import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ① /guide/glossary?level=beginner など(前の用語辞典のレベル絞り込みのURL)を転送する。難易度は廃止して学習導線にしたので、
//    初心者向け → 最初に知る用語、上級者向け → 深掘りする用語、中級者向け → 用語辞典のトップ。
// ② /admin配下の暫定的な保護。News Collector Phase D（Supabase Auth +
// ADMIN_EMAIL_ALLOWLIST）で正式な認証に置き換えるまでの一時措置。
// ADMIN_BASIC_AUTH_PASSWORD未設定の場合は/adminへのアクセス自体を止める
// （誤って本番で誰でも入れる状態を避けるため）。
export const config = {
  matcher: ["/admin/:path*", "/guide/glossary"],
};

const GLOSSARY_LEVEL_REDIRECT: Record<string, string> = {
  beginner: "/guide/glossary/first",
  intermediate: "/guide/glossary",
  advanced: "/guide/glossary/deep",
};

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/guide/glossary") {
    const level = request.nextUrl.searchParams.get("level");
    const to = level ? GLOSSARY_LEVEL_REDIRECT[level] : undefined;
    if (!to) return NextResponse.next();
    const url = request.nextUrl.clone();
    url.pathname = to;
    url.search = "";
    return NextResponse.redirect(url, 308);
  }

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
