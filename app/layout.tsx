import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Oniforge – Baca Manhwa & Manga Sub Indo",
  description: "Platform baca Manhwa, Manga, dan Manhua Sub Indo terlengkap. Temukan ribuan judul terbaru dan terpopuler di Oniforge.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
      <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://komikindo.ch" />
        <link rel="dns-prefetch" href="https://api.komiku.org" />
        <link rel="dns-prefetch" href="https://komiku.id" />
        <link rel="dns-prefetch" href="https://imageainewgeneration.lol" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}