import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { getThemePreset } from "@/config/theme";
import { getSiteUrl } from "@/lib/site-url";

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
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "Trading Trainer",
    template: "%s | Trading Trainer",
  },
  description:
    "Entrena toma de decisiones de trading mediante escenarios históricos o controlados.",
  applicationName: "Trading Trainer",
  robots: {
    index: true,
    follow: true,
  },
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
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
