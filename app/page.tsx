import Link from "next/link";
import { latest, popular } from "../lib/api";
import MangaCard from "../components/MangaCard";
import Navbar from "../components/Navbar";

export const metadata = {
  title: "KomikZone – Baca Manhwa & Manga Sub Indo Terbaru",
  description: "Temukan ribuan Manhwa, Manga, dan Manhua Sub Indo terbaru dan terpopuler di KomikZone.",
};

export default async function Home({ searchParams }: { searchParams: Promise<{ page?: string; tab?: string }> }) {
  const p = await searchParams;
  const page = Math.max(1, Number(p.page || 1));

  // Fetch all sections in parallel
  const [latestItems, popularItems] = await Promise.allSettled([
    latest(page),
    popular(1),
  ]);

  const latestData = latestItems.status === "fulfilled" ? latestItems.value : [];
  const popularData = popularItems.status === "fulfilled" ? popularItems.value.slice(0, 12) : [];

  const latestError = latestItems.status === "rejected";
  const popularError = popularItems.status === "rejected";

  return (
    <>
      <Navbar />
      <main className="container page-with-nav">

        {/* Hero */}
        <section className="hero">
          <h1>Baca Komik Sub Indo</h1>
          <p>Manhwa · Manga · Manhua — Terbaru &amp; Terpopuler</p>

          {/* Quick filter shortcut pills */}
          <div className="filter-chips filter-chips-home">
            <Link href="/browse?type=manhwa" className="filter-chip">
              🇰🇷 Manhwa
            </Link>
            <Link href="/browse?type=manga" className="filter-chip">
              🇯🇵 Manga
            </Link>
            <Link href="/browse?type=manhua" className="filter-chip">
              🇨🇳 Manhua
            </Link>
            <Link href="/browse?genre=action" className="filter-chip">
              ⚡ Action
            </Link>
            <Link href="/browse?genre=romance" className="filter-chip">
              💖 Romance
            </Link>
            <Link href="/browse" className="filter-chip filter-chip-active">
              🗂️ Semua Filter
            </Link>
          </div>
        </section>

        {/* Popular Section */}
        <section className="section">
          <div className="section-header">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <h2>🔥 Terpopuler</h2>
              <span className="section-badge">Ranking</span>
            </div>
            <Link href="/browse?orderby=popular" className="btn-text-toggle" style={{ fontSize: 13 }}>
              Lihat Semua →
            </Link>
          </div>
          {popularError ? (
            <div className="error">Gagal memuat daftar populer.</div>
          ) : popularData.length === 0 ? (
            <div className="muted">Memuat...</div>
          ) : (
            <div className="grid">
              {popularData.map((x, i) => (
                <MangaCard key={i} item={x} rank={i} />
              ))}
            </div>
          )}
        </section>

        {/* Latest Section */}
        <section className="section">
          <div className="section-header">
            <div>
              <h2>🕓 Terbaru (Hal. {page})</h2>
              <span className="muted" style={{ fontSize: 13 }}>Diurutkan dari tanggal update</span>
            </div>
            <Link href="/browse?orderby=update" className="btn-text-toggle" style={{ fontSize: 13 }}>
              Filter &amp; Urutkan →
            </Link>
          </div>
          {latestError ? (
            <div className="error">Gagal memuat daftar terbaru.</div>
          ) : latestData.length === 0 ? (
            <div className="muted">Memuat...</div>
          ) : (
            <div className="grid">
              {latestData.map((x, i) => (
                <MangaCard key={i} item={x} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {!latestError && latestData.length > 0 && (
            <div className="pagination">
              {page > 1 && (
                <Link className="btn" href={`/?page=${page - 1}`}>← Sebelumnya</Link>
              )}
              <span className="page-btn-current">Halaman {page}</span>
              <Link className="btn" href={`/?page=${page + 1}`}>Berikutnya →</Link>
            </div>
          )}
        </section>

      </main>
    </>
  );
}