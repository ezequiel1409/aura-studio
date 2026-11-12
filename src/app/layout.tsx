import type { Metadata } from "next";
import { Suspense } from "react";
import {
  Cormorant_Garamond,
  Playfair_Display,
  DM_Serif_Display,
  Montserrat,
  Geist,
  Geist_Mono,
} from "next/font/google";
import { RouteLoadingIndicator } from "../components/layout/RouteLoadingIndicator";
import { getDefaultBrandName } from "../lib/brand";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const dmSerif = DM_Serif_Display({
  variable: "--font-dm-serif",
  subsets: ["latin"],
  weight: ["400"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const defaultBrand = getDefaultBrandName();
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://mitienda.local";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: defaultBrand,
    template: `%s · ${defaultBrand}`,
  },
  description: "Catálogo online con reserva directa y gestión integral.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const fontClasses = `${geistSans.variable} ${geistMono.variable} ${cormorant.variable} ${playfair.variable} ${dmSerif.variable} ${montserrat.variable}`;

  return (
    <html lang="es" className={`${fontClasses} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#faf8f5] text-[#1c1917] selection:bg-[#926a3c]/20">
        <Suspense fallback={null}>
          <RouteLoadingIndicator />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
