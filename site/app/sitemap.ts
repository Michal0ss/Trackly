import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

const pages = [
  { pl: "", en: "/en", changeFrequency: "monthly", priority: 1 },
  { pl: "/privacy", en: "/en/privacy", changeFrequency: "yearly", priority: 0.4 },
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return pages.flatMap((page) => {
    const languages = { pl: `${siteUrl}${page.pl}`, en: `${siteUrl}${page.en}` };

    return [page.pl, page.en].map((path) => ({
      url: `${siteUrl}${path}`,
      lastModified: new Date(),
      changeFrequency: page.changeFrequency,
      priority: page.priority,
      alternates: { languages },
    }));
  });
}
