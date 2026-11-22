import { AppProvider } from "@/components/providers/app-provider";

/**
 * 앱(홈) 라우트 그룹 — 커뮤니티 데이터를 읽는 AppProvider 는 이 안에서만 돕니다.
 * /privacy · /terms 같은 정적 페이지는 이 그룹 밖이라 커뮤니티 쿼리를 하지 않습니다.
 */
export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  return <AppProvider>{children}</AppProvider>;
}
