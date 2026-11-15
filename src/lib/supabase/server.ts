import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "./config";

/**
 * 서버(라우트 핸들러 / 서버 컴포넌트)용 Supabase 클라이언트.
 * OAuth 콜백에서 PKCE code 교환을 할 때 세션 쿠키를 읽고 씁니다.
 */
export async function getSupabaseServerClient(): Promise<SupabaseClient | null> {
  if (!isSupabaseConfigured) return null;

  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Component에서 호출된 경우 쿠키 쓰기가 막혀 있을 수 있습니다.
          // 세션 갱신은 middleware/route handler에서 처리되므로 무시해도 됩니다.
        }
      },
    },
  });
}
