import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://economize-plus.vercel.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/buscar",
          "/lista",
          "/mercados",
          "/produto/",
          "/seja-parceiro",
          "/divulgacao",
          "/entregas",
          "/institucional",
        ],
        disallow: ["/admin", "/painel-parceiro", "/api/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
