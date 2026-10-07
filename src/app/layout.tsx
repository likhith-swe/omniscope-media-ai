import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { UIProvider } from "@/components/UIProvider";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://omniscope.tv"),
  title: {
    default: "OmniScope — Identify any movie from a line, a frame, or a half-remembered scene",
    template: "%s — OmniScope",
  },
  description:
    "OmniScope resolves any film from a quoted line, a screenshot, or a vague scene description, then shows exactly which platform streams it in India, the US, or the UK — updated every 24 hours.",
  keywords: [
    "what movie is this",
    "identify movie from quote",
    "movie scene identifier",
    "where to watch",
    "streaming availability",
  ],
  openGraph: {
    type: "website",
    siteName: "OmniScope",
    title: "OmniScope — Identify any movie from a line or a frame",
    description:
      "Quote it, describe it, or drop a screenshot. OmniScope names the film and tells you exactly where it streams.",
  },
  twitter: {
    card: "summary_large_image",
    title: "OmniScope — Identify any movie from a line or a frame",
    description:
      "Quote it, describe it, or drop a screenshot. OmniScope names the film and tells you where it streams.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#08090E",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="bg-obsidian text-ink min-h-screen antialiased">
        <UIProvider>
          <Navigation />
          <main>{children}</main>
          <Footer />
        </UIProvider>
      </body>
    </html>
  );
}
