import type { Metadata, Viewport } from "next";
import { Caveat, Fraunces, Nunito } from "next/font/google";
import "./globals.css";

// Three faces, each with one job: titles, mom's own words, and everything
// the daughter has to read quickly.
const titleFont = Fraunces({ subsets: ["latin"], variable: "--font-title" });
const handFont = Caveat({ subsets: ["latin"], variable: "--font-hand" });
const readFont = Nunito({ subsets: ["latin"], variable: "--font-read" });

export const metadata: Metadata = {
  title: "Handful Is Not a Unit",
  description: "Listens while mom talks through a family recipe and turns her rough amounts into a recipe card.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f6efe0",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${titleFont.variable} ${handFont.variable} ${readFont.variable}`}>
      <body>{children}</body>
    </html>
  );
}
