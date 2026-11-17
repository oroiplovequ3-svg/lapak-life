import type { Metadata, Viewport } from "next";

import { AppProvider } from "@/components/providers/app-provider";
import { ToastProvider } from "@/components/providers/toast-provider";

import "./globals.css";

export const metadata: Metadata = {
  title: "라팍생활 — 삼성 라이온즈 팬 커뮤니티",
  description:
    "라팍(대구 삼성라이온즈파크)에 가는 사람이, 가기 전에·있는 동안·다녀온 뒤에 쓰는 앱. 좌석 시야 후기, 먹거리·주차 정보, 직관 기록.",
  applicationName: "라팍생활",
  appleWebApp: { capable: true, title: "라팍생활", statusBarStyle: "default" },
  openGraph: {
    title: "라팍생활 — 삼성 라이온즈 팬 커뮤니티",
    description:
      "라팍(대구 삼성라이온즈파크)에 가는 사람이, 가기 전에·있는 동안·다녀온 뒤에 쓰는 앱.",
    siteName: "라팍생활",
    locale: "ko_KR",
    type: "website",
    images: [{ url: "/images/lapak-mascot.png", width: 640, height: 640, alt: "라팍생활 마스코트" }],
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
