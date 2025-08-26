import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { FontLoader } from "../components/FontLoader";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MiDiSketch - ブラウザベースの音楽制作アプリ",
  description: "ブラウザで音楽制作ができるピアノロールエディタ",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/icon.svg", type: "image/svg+xml" }
    ],
    apple: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" }
    ]
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MiDiSketch"
  },
  applicationName: "MiDiSketch",
  authors: [{ name: "MiDiSketch Team" }],
  keywords: ["music", "production", "piano roll", "midi", "作曲"],
  viewport: "width=device-width, initial-scale=1, viewport-fit=cover",
  themeColor: "#1f2937"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        <meta name="color-scheme" content="dark light" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined&display=swap" rel="stylesheet" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <FontLoader />
        {children}
      </body>
    </html>
  );
}
