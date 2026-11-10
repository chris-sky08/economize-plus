import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: "#0F1E36", // Azul Marinho Nobre Profundo
          blue: "#2563EB", // Azul Real Vibrante
          sky: "#38BDF8",  // Azul Claro Luminoso (degradês)
          green: "#16A34A", // Verde Economia Fresco de Supermercado
          yellow: "#F59E0B", // Âmbar Dourado Sofisticado
          light: "#F0F7FF", // Fundo Suave com Frescor Celeste
          surface: "#F8FAFC", // Superfície Off-White Ultra Limpa
          white: "#FFFFFF",
        },
      },
      spacing: {
        "0.2": "0.05rem",
        13: "3.25rem",
        15: "3.75rem",
        18: "4.5rem",
        22: "5.5rem",
      },
      boxShadow: {
        "2xs": "0 1px 2px 0 rgb(0 0 0 / 0.04)",
        xs: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
      },
      backdropBlur: {
        xs: "2px",
      },
      opacity: {
        8: "0.08",
        12: "0.12",
        18: "0.18",
        22: "0.22",
        55: "0.55",
      },
      scale: {
        98: "0.98",
        108: "1.08",
      },
      order: {
        0: "0",
      },
      fontFamily: {
        heading: ["var(--font-poppins)", "sans-serif"],
        sans: ["var(--font-inter)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
