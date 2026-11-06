import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://economize-nine.vercel.app";
  const now = new Date();

  const routes = [
    { path: "", priority: 1.0, changeFrequency: "daily" as const },
    { path: "/buscar", priority: 0.9, changeFrequency: "hourly" as const },
    { path: "/lista", priority: 0.9, changeFrequency: "daily" as const },
    { path: "/mercados", priority: 0.85, changeFrequency: "daily" as const },
    { path: "/seja-parceiro", priority: 0.8, changeFrequency: "weekly" as const },
    { path: "/divulgacao", priority: 0.75, changeFrequency: "weekly" as const },
    { path: "/entregas", priority: 0.7, changeFrequency: "weekly" as const },
    { path: "/conta", priority: 0.65, changeFrequency: "monthly" as const },
    { path: "/institucional", priority: 0.6, changeFrequency: "monthly" as const },
  ];

  return routes.map((r) => ({
    url: `${baseUrl}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
