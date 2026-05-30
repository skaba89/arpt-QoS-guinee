import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ONIT-PNG | Observatoire National Intelligent des Télécommunications",
  description:
    "Plateforme nationale de supervision des télécommunications — République de Guinée. Monitoring QoS, cartographie SIG, scoring opérateurs et rapports réglementaires. Autorité de Régulation des Postes et Télécommunications (ARPT).",
  keywords: [
    "ONIT-PNG",
    "ARPT",
    "Guinée",
    "télécommunications",
    "QoS",
    "supervision",
    "observatoire",
    "régulation",
    "couverture réseau",
    "opérateurs",
  ],
  authors: [{ name: "ARPT Guinée" }],
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${geistMono.variable} antialiased bg-[#080C1A] text-slate-50`}
      >
        {children}
        <Toaster position="top-right" richColors closeButton duration={4000} />
      </body>
    </html>
  );
}
