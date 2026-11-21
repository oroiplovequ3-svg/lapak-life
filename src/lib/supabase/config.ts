/**
 * Supabase 연결 설정.
 * 환경변수가 비어 있으면 앱은 "데모 모드"로 동작합니다(샘플 데이터, 로컬 저장).
 */
export const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
export const SUPABASE_ANON_KEY = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();

export const isSupabaseConfigured =
  SUPABASE_URL.startsWith("http") && SUPABASE_ANON_KEY.length > 20;

/**
 * 구글 OAuth redirectTo 계산용.
 * 브라우저에서는 지금 열린 주소(origin)를 그대로 씁니다.
 * inblue-fan.vercel.app 과 lapak-life.vercel.app 처럼 주소가 둘 이상일 때
 * 로그인을 시작한 주소로 되돌아와야 PKCE code verifier 가 맞습니다.
 */
export function getSiteUrl(): string {
  if (typeof window !== "undefined") return window.location.origin;
  const fromEnv = (process.env.NEXT_PUBLIC_SITE_URL ?? "").trim();
  if (fromEnv) return fromEnv.replace(/\/+$/, "");
  return "http://localhost:3000";
}
