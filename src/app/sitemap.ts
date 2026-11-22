import type { MetadataRoute } from "next";

const SITE = "https://inblue-fan.vercel.app";

/** 색인할 공개 페이지 — 앱 본문은 클라이언트 상태라 홈과 약관·개인정보처리방침만 알립니다. */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date("2026-11-22T00:00:00.000Z");
  return [
    {
      url: `${SITE}/`,
      lastModified,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE}/terms`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${SITE}/privacy`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
