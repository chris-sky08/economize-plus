import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Painel do Parceiro - Economize+",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function PartnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
