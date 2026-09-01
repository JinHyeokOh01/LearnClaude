import type { MetadataRoute } from "next";

// 사이트 URL은 배포 시 확정(D-3). 환경변수로 주입, 없으면 상대 기준.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://stepup.example.com";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
