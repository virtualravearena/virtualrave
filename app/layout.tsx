import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "@/lib/providers";

const virtualText = localFont({
  variable: "--font-text",
  display: "swap",
  src: [
    { path: "../public/fonts/virtualtext-medium.woff", weight: "500", style: "normal" },
    { path: "../public/fonts/virtualtext-semibold.woff", weight: "600", style: "normal" },
    { path: "../public/fonts/virtualtext-bold.woff", weight: "700", style: "normal" },
    { path: "../public/fonts/virtualtext-extrabold.woff", weight: "800", style: "normal" },
    { path: "../public/fonts/virtualtext-black.woff", weight: "900", style: "normal" },
  ],
});

const virtualTitles = localFont({
  variable: "--font-titles",
  display: "swap",
  src: "../public/fonts/virtualtitles.woff",
});

const virtualCali = localFont({
  variable: "--font-cali",
  display: "swap",
  src: "../public/fonts/virtualcali.woff",
});

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "VIRTUAL RAVE",
  description: "For the culture.",
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    title: "VIRTUAL RAVE",
    description: "For the culture.",
    images: [{ url: "/logo.webp", width: 1938, height: 670, alt: "VIRTUAL RAVE" }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${virtualText.variable} ${virtualTitles.variable} ${virtualCali.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
