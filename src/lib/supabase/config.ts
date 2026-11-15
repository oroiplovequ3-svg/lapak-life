/**
 * Supabase 연결 설정.
 * 환경변수가 비어 있으면 앱은 "데모 모드"로 동작합니다(샘플 데이터, 로컬 저장).
 */
export const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
export const SUPABASE_ANON_KEY = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();

export const isSupabaseConfigured =
  SUPABASE_URL.startsWith("http") && SUPABASE_ANON_KEY.length > 20;

/** 카카오 OAuth redirectTo 계산용. 빌드 시 값이 없으면 런타임 origin을 씁니다. */
export function getSiteUrl(): string {
  const fromEnv = (process.env.NEXT_PUBLIC_SITE_URL ?? "").trim();
  if (fromEnv) return fromEnv.replace(/\/+$/, "");
  if (typeof window !== "undefined") return window.location.origin;
  return "http://localhost:3000";
}
