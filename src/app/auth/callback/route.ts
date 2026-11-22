import { NextResponse, type NextRequest } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabase/server";

/**
 * 구글 OAuth 콜백 (PKCE code 교환).
 * Supabase Auth → Redirect URL 로 이 라우트를 지정합니다.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const oauthError = searchParams.get("error_description") ?? searchParams.get("error");
  const next = searchParams.get("next") ?? "/";

  if (oauthError) {
    return NextResponse.redirect(`${origin}/?auth_error=${encodeURIComponent(oauthError)}`);
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/?auth_error=${encodeURIComponent("인가 코드가 없어요")}`);
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.redirect(
      `${origin}/?auth_error=${encodeURIComponent("Supabase가 연결되지 않았어요")}`,
    );
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    // 영구 정지된 계정은 Supabase Auth 가 "User is banned" 로 밀어냅니다.
    const banned = /banned/i.test(error.message) || error.code === "user_banned";
    const message = banned ? "운영 정책 위반으로 영구 정지된 계정입니다." : error.message;
    return NextResponse.redirect(`${origin}/?auth_error=${encodeURIComponent(message)}`);
  }

  return NextResponse.redirect(`${origin}${next.startsWith("/") ? next : "/"}`);
}
