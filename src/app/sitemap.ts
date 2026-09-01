import type { MetadataRoute } from "next";
import { buildContentIndex } from "@/lib/content/index";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://stepup.example.com";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const index = buildContentIndex();
  const staticPaths = ["/", "/tracks/", "/diagnostic/", "/settings/"];
  const trackPaths = index.tracks.map((t) => `/tracks/${t.id}/`);
  const lessonPaths = index.lessons.map((l) => `/lessons/${l.id}/`);

  return [...staticPaths, ...trackPaths, ...lessonPaths].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
  }));
}
