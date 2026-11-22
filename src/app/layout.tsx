import type { Metadata, Viewport } from "next";

import { AppProvider } from "@/components/providers/app-provider";
import { ToastProvider } from "@/components/providers/toast-provider";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://inblue-fan.vercel.app"),
  title: "인블루 — 삼성 라이온즈 팬 커뮤니티",
  description:
    "인블루(INBLUE)는 라팍(대구 삼성라이온즈파크)에 가는 사람이, 가기 전에·있는 동안·다녀온 뒤에 쓰는 팬 커뮤니티입니다. 좌석 시야 후기, 먹거리·주차 정보, 직관 기록.",
  applicationName: "인블루",
  alternates: { canonical: "/" },
  verification: {
    google: "XOPbO7BbvXH6hNyuSaxW9tbE0K56BiekCDJ2ZZC7CPk",
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "인블루", statusBarStyle: "default" },
  other: {
    // iOS 홈 화면 추가 시 주소창 없이 열리도록 (appleWebApp 은 apple-mobile-web-app-capable 만 넣습니다)
    "mobile-web-app-capable": "yes",
  },
  openGraph: {
    title: "인블루 — 삼성 라이온즈 팬 커뮤니티",
    description:
      "라팍(대구 삼성라이온즈파크)에 가는 사람이, 가기 전에·있는 동안·다녀온 뒤에 쓰는 팬 커뮤니티. 좌석 시야, 먹거리·주차, 직관 기록.",
    url: "https://inblue-fan.vercel.app",
    siteName: "인블루",
    locale: "ko_KR",
    type: "website",
    images: [
      {
        url: "/og-inblue.png",
        width: 1200,
        height: 630,
        alt: "인블루 (INBLUE) — 삼성 라이온즈 팬 커뮤니티",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "인블루 — 삼성 라이온즈 팬 커뮤니티",
    description:
      "라팍(대구 삼성라이온즈파크) 직관 팬 커뮤니티. 좌석 시야, 먹거리·주차, 직관 기록.",
    images: [{ url: "/og-inblue.png", alt: "인블루 (INBLUE) — 삼성 라이온즈 팬 커뮤니티" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#074CA1",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-[#E7EBF2] font-sans text-ink antialiased">
        <ToastProvider>
          <AppProvider>{children}</AppProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
