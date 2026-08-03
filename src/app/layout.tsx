import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
} from "next/font/google";

import { getThemePreset } from "@/config/theme";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Base SaaS",
    template: "%s | Base SaaS",
  },
  description:
    "Plantilla reutilizable para crear productos y negocios digitales.",
};

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function RootLayout({
  children,
}: RootLayoutProps) {
  const themePreset = getThemePreset();

  return (
    <html
      data-scroll-behavior="smooth"
      data-theme={themePreset}
      lang="es"
    >
      <body
        className={`${geistSans.variable} ${geistMono.variable}`}
      >
        {children}
      </body>
    </html>
  );
}