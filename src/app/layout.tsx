import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MicroDrama — Microseries verticales",
  description: "Descubre historias verticales. Un universo de microseries y producción original.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}</body></html>;
}
