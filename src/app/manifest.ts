import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Economize+ | Compare. Escolha. Economize.",
    short_name: "Economize+",
    description:
      "Compare preços coletados em supermercados locais, escaneie códigos de barras e monte sua lista de compras inteligente.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#F4FAFC",
    theme_color: "#063A6B",
    categories: ["shopping", "finance", "food"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
