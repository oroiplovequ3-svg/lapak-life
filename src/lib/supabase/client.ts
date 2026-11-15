import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "./config";

let browserClient: SupabaseClient | null = null;

/**
 * 브라우저용 Supabase 클라이언트. Supabase가 설정되지 않았으면 null.
 * (null 이면 앱은 데모 모드로 동작합니다.)
 */
export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (!browserClient) {
    browserClient = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      cookieOptions: { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 30 },
    });
  }
  return browserClient;
}
