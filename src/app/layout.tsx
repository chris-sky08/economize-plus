import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LocationModal from "@/components/LocationModal";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Economize+ | Compare. Escolha. Economize.",
  description:
    "Compare preços de produtos em mercados próximos, monte sua lista de compras inteligente e encontre ofertas no seu bairro com o Economize+.",
  openGraph: {
    title: "Economize+ | Compare preços perto de você",
    description:
      "Compare preços entre mercados locais, monte sua lista de compras e descubra onde sua cesta pode sair mais barata.",
    type: "website",
    locale: "pt_BR",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${poppins.variable}`}>
      <body className="min-h-screen flex flex-col font-sans antialiased">
        <AppProvider>
          <Navbar />
          <LocationModal />
          <main className="flex-1">{children}</main>
          <Footer />
        </AppProvider>
      </body>
    </html>
  );
}
