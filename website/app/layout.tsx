import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PULL — Extract complete source code and assets from any Vercel deployment",
  description: "Snag full source code and assets from any Vercel deployment directly from your terminal or local web inspector.",
  openGraph: {
    title: "PULL — Vercel Deployment Source Extractor",
    description: "Extract complete source code and assets from any Vercel deployment.",
    url: "https://github.com/carbonthecoder/PULL",
    siteName: "PULL",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
