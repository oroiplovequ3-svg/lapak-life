import type { MetadataRoute } from "next";

const SITE = "https://inblue-fan.vercel.app";

/** 검색엔진에 알려 줄 크롤링 규칙 — 로그인 콜백 같은 내부 경로는 제외합니다. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/auth/", "/api/"],
      },
    ],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
