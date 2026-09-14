import Link from "next/link";
import Navbar from "../../components/Navbar";
import { manhwadesu } from "../../lib/api";
import MangaCard from "../../components/MangaCard";

export const metadata = {
  title: "Advance Komik – KomikZone",
  description: "Koleksi komik terbaru dan terpopuler di Advance KomikZone.",
};

export default async function AdvancePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const p = await searchParams;
  const page = Math.max(1, Number(p.page || 1));

  let items: any[] = [];
  let error = false;
  try {
    items = await manhwadesu(page);
  } catch (e) {
    error = true;
  }

  return (
    <>
      <Navbar />
      <main className="container page-with-nav">
        <section className="section">
          <div className="section-header">
            <div>
              <h2>👑 Advance (Hal. {page})</h2>
              <span className="muted" style={{ fontSize: 13 }}>Koleksi komik eksklusif Manhwa</span>
            </div>
          </div>

          {error ? (
            <div className="error">Gagal memuat daftar Advance.</div>
          ) : items.length === 0 ? (
            <div className="muted">Memuat...</div>
          ) : (
            <div className="grid">
              {items.map((x, i) => (
                <MangaCard key={x.slug || i} item={x} isLoggedIn={true} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {!error && items.length > 0 && (
            <div className="pagination">
              {page > 1 && (
                <Link className="btn" href={`/advance?page=${page - 1}`}>
                  ← Halaman Sebelumnya
                </Link>
              )}
              <span className="page-btn-current">Halaman {page}</span>
              <Link className="btn" href={`/advance?page=${page + 1}`}>
                Halaman Berikutnya →
              </Link>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
