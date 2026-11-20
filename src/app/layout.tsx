import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MicroDrama Studio — Production OS",
  description: "AI-powered micro-series production and streaming platform.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}</body></html>;
}
