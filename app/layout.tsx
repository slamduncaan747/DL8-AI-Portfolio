import type { Metadata } from "next";
import { JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const mono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://dl8ai.com"),
  title: { default: "DL8 AI — AI projects by Duncan Larzelere", template: "%s · DL8 AI" },
  description:
    "AI research you can play with: Melody Diffuser turns hand gestures into melodies, and Otto is a poker AI that learns how you play.",
  openGraph: {
    title: "DL8 AI — AI projects by Duncan Larzelere",
    description: "Melody Diffuser turns hand gestures into melodies. Otto is a poker AI that learns how you play.",
    url: "https://dl8ai.com",
    siteName: "DL8 AI",
    type: "website",
  },
  twitter: { card: "summary_large_image", creator: "@duncanlarz" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${jakarta.variable} ${mono.variable} font-sans antialiased`}>
        <Navigation />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
