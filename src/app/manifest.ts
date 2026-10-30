import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Economize+ | Compare. Escolha. Economize.",
    short_name: "Economize+",
    description:
      "Compare preços reais de supermercados locais, escaneie códigos de barras e monte sua lista de compras inteligente perto de você.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#F8FBFF",
    theme_color: "#176BCE",
    categories: ["shopping", "finance", "food"],
    icons: [
      {
        src: "/logo-oficial.jpg",
        sizes: "192x192",
        type: "image/jpeg",
        purpose: "any",
      },
      {
        src: "/logo-oficial.jpg",
        sizes: "512x512",
        type: "image/jpeg",
        purpose: "maskable",
      },
    ],
  };
}
