import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "KomikZone – Baca Manhwa & Manga Sub Indo",
  description: "Platform baca Manhwa, Manga, dan Manhua Sub Indo terlengkap. Temukan ribuan judul terbaru dan terpopuler.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}