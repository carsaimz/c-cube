import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "C-Cube — Cubo Mágico 3D",
  description:
    "Jogo de Cubo Mágico 3D interativo: gestos diretos, animações suaves, temas, recordes e cronómetro. React + Capacitor + Electron.",
  applicationName: "C-Cube",
  keywords: ["cubo mágico", "rubik", "jogo", "3D", "puzzle", "C-Cube"],
  authors: [{ name: "carsaimz" }],
  icons: {
    icon: "/icon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0b0d13",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={{ background: "#04050a" }}
      >
        {children}
      </body>
    </html>
  );
}
