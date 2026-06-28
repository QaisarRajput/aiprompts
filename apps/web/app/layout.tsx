import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";

import { AppShell } from "../components/app-shell";
import { Providers } from "../components/providers";
import { ThemeScript } from "../components/theme-script";
import { getAllCategories } from "../lib/data";

import "./globals.css";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"]
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"]
});

const assetBase = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const metadata: Metadata = {
  title: {
    default: "AI Prompts — Discover • Create • Inspire",
    template: "%s | AI Prompts"
  },
  description:
    "The most fire AI image prompts on the internet. Browse, copy, and remix thousands of curated prompts for GPT Image, Seedance, and more. No cap.",
  metadataBase: new URL("https://aiprompts.hubs.dpdns.org"),
  openGraph: {
    type: "website",
    siteName: "AI Prompts",
    title: "AI Prompts — Discover • Create • Inspire",
    description: "The most fire AI image prompts on the internet. Browse, copy, and remix.",
    images: [{ url: `${assetBase}/banner.webp`, width: 1536, height: 1024 }]
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Prompts — Discover • Create • Inspire",
    description: "The most fire AI image prompts on the internet.",
    images: [`${assetBase}/banner.webp`]
  },
  manifest: `${assetBase}/manifest.webmanifest`,
  icons: {
    icon: [
      { url: `${assetBase}/favicon.ico`, type: "image/x-icon" },
      { url: `${assetBase}/icons/icon-192.png`, sizes: "192x192", type: "image/png" },
      { url: `${assetBase}/icons/icon-512.png`, sizes: "512x512", type: "image/png" }
    ],
    shortcut: `${assetBase}/favicon.ico`,
    apple: [{ url: `${assetBase}/apple-touch-icon.png`, sizes: "180x180", type: "image/png" }]
  }
};

export default async function RootLayout({ children }: { children: React.ReactNode }): Promise<JSX.Element> {
  const categories = await getAllCategories();
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
        {/* Google AdSense account meta tag (added for verification) */}
        <meta name="google-adsense-account" content="ca-pub-5974949409227096" />
      </head>
      <body className={`${inter.variable} ${jetBrainsMono.variable} antialiased`}>
        <Providers>
          <AppShell categories={categories}>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
