import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";

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
  title: "ARPT Guinée | Autorité de Régulation des Postes et Télécommunications",
  description:
    "Plateforme nationale de supervision des télécommunications — République de Guinée. Monitoring QoS, cartographie SIG, scoring opérateurs et rapports réglementaires. Autorité de Régulation des Postes et Télécommunications (ARPT).",
  keywords: [
    "ARPT",
    "Guinée",
    "télécommunications",
    "QoS",
    "supervision",
    "régulation",
    "couverture réseau",
    "opérateurs",
    "postes",
    "scoring",
  ],
  authors: [{ name: "ARPT Guinée" }],
  icons: {
    icon: "/arpt-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider>
          {children}
        </ThemeProvider>
        <Toaster position="top-right" richColors closeButton duration={4000} />
      </body>
    </html>
  );
}
