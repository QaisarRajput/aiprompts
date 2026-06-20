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
    images: [{ url: `${assetBase}/og-image.svg`, width: 1200, height: 630 }]
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Prompts — Discover • Create • Inspire",
    description: "The most fire AI image prompts on the internet.",
    images: [`${assetBase}/og-image.svg`]
  },
  icons: {
    icon: [
      { url: `${assetBase}/favicon.svg`, type: "image/svg+xml" }
    ],
    shortcut: `${assetBase}/favicon.svg`,
    apple: `${assetBase}/favicon.svg`
  }
};

export default async function RootLayout({ children }: { children: React.ReactNode }): Promise<JSX.Element> {
  const categories = await getAllCategories();
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className={`${inter.variable} ${jetBrainsMono.variable} antialiased`}>
        <Providers>
          <AppShell categories={categories}>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
