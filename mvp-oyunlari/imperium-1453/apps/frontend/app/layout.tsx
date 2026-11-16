import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Imperium 1453",
  description: "Doğu Akdeniz ve Balkanlar merkezli çok oyunculu büyük strateji MVP'si.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
