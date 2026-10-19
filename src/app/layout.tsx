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
import { getProductServiceDeps } from "../infra/db/connection";
import { getShowroomSettings } from "../services/settings.service";
import { StoreThemeStyles } from "../components/theme/StoreThemeStyles";
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

export const metadata: Metadata = {
  title: "Aura Studio | Showroom & Catálogo",
  description: "Piezas únicas y selección exclusiva con reserva directa por WhatsApp.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let settings;
  try {
    const deps = getProductServiceDeps();
    settings = await getShowroomSettings(deps);
  } catch {
    settings = {
      themePalette: "lino",
      themePrimaryColor: null,
      themeFont: "cormorant",
    };
  }

  const fontClasses = `${geistSans.variable} ${geistMono.variable} ${cormorant.variable} ${playfair.variable} ${dmSerif.variable} ${montserrat.variable}`;

  return (
    <html lang="es" className={`${fontClasses} h-full antialiased`}>
      <head>
        <StoreThemeStyles
          paletteId={settings.themePalette}
          primaryColor={settings.themePrimaryColor}
          fontId={settings.themeFont}
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#faf8f5] text-[#1c1917] selection:bg-[#926a3c]/20">
        <Suspense fallback={null}>
          <RouteLoadingIndicator />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
