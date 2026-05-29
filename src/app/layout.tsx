import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ONIT-PNG | Observatoire National Intelligent des Télécommunications",
  description: "Plateforme nationale de supervision des télécommunications - ARPT Guinée. Monitoring QoS, cartographie SIG, scoring opérateurs et rapports réglementaires.",
  keywords: ["ONIT-PNG", "ARPT", "Guinée", "télécommunications", "QoS", "supervision", "observatoire"],
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#0A0F1E] text-slate-50`}
      >
        {children}
        <Toaster position="top-right" richColors closeButton duration={4000} />
      </body>
    </html>
  );
}
