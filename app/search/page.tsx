import Link from "next/link";
import MangaCard from "../../components/MangaCard";
import Navbar from "../../components/Navbar";
import FilterBar from "../../components/FilterBar";
import { search, filter } from "../../lib/api";

export const metadata = {
  title: "Cari & Filter Komik – Oniforge",
  description: "Cari judul komik dan filter Manhwa, Manga, Manhua berdasarkan Genre, Status, dan Urutan di Oniforge.",
};

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    genre?: string;
    type?: string;
    status?: string;
    orderby?: string;
    page?: string;
  }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const p = await searchParams;
  const q = p.q || "";
  const genre = p.genre || "";
  const type = p.type || "";
  const status = p.status || "";
  const orderby = p.orderby || "popular";
  const currentPage = Math.max(1, parseInt(p.page || "1", 10) || 1);

  let items: any[] = [];
  let error = "";

  const hasFilters = Boolean(genre || type || status || (orderby && orderby !== "popular"));

  try {
    if (q) {
      // Keyword search
      items = await search(q);
      // Optional client-side filtering if type/genre filters are selected
      if (type) {
        items = items.filter((x: any) => (x.type || "").toLowerCase().includes(type.toLowerCase()));
      }
    } else {
      // Browse / Filter search
      items = await filter({
        genre,
        type,
        status,
        orderby,
        page: currentPage,
      });
    }
  } catch (err) {
    error = "Gagal memuat data pencarian. Silakan coba lagi.";
  }

  // Pagination helper URL builder
  const createPageUrl = (pageNumber: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (genre) params.set("genre", genre);
    if (type) params.set("type", type);
    if (status) params.set("status", status);
    if (orderby && orderby !== "popular") params.set("orderby", orderby);
    if (pageNumber > 1) params.set("page", pageNumber.toString());
    const qs = params.toString();
    return `/search${qs ? `?${qs}` : ""}`;
  };

  return (
    <>
      <Navbar />
      <main className="container page-with-nav">
        <div className="page-header">
          <div>
            <h1>🔍 Cari & Filter Komik</h1>
            <p className="muted">
              Ketik judul komik atau gunakan filter genre, tipe, dan status di bawah.
            </p>
          </div>
        </div>

        {/* Search Input Bar */}
        <form className="search-form" action="/search" method="GET">
          {genre && <input type="hidden" name="genre" value={genre} />}
          {type && <input type="hidden" name="type" value={type} />}
          {status && <input type="hidden" name="status" value={status} />}
          {orderby && orderby !== "popular" && <input type="hidden" name="orderby" value={orderby} />}

          <input
            className="input"
            name="q"
            defaultValue={q}
            placeholder="Ketik judul komik (contoh: Solo Leveling, One Piece)..."
            autoComplete="off"
          />
          <button className="btn btn-primary" type="submit">
            🔍 Cari
          </button>
        </form>

        {/* Integrated Filter Controls Panel */}
        <FilterBar
          currentQ={q}
          currentGenre={genre}
          currentType={type}
          currentStatus={status}
          currentOrder={orderby}
        />

        {error && (
          <div className="empty-state" style={{ borderColor: "rgba(239, 68, 68, 0.3)", background: "rgba(239, 68, 68, 0.05)" }}>
            <div className="empty-icon">🌐</div>
            <h3>Gagal Memuat Data</h3>
            <p className="muted" style={{ maxWidth: 400, margin: "0 auto 16px" }}>
              Koneksi ke sumber komik sedang lambat. Klik tombol di bawah untuk mencoba kembali.
            </p>
            <Link href={createPageUrl(currentPage)} className="btn btn-primary">
              🔄 Coba Lagi
            </Link>
          </div>
        )}

        {/* Results summary */}
        {!error && (q || hasFilters || items.length > 0) && (
          <div className="results-summary-row">
            <span className="section-count muted">
              {items.length > 0
                ? `Menampilkan ${items.length} hasil ${q ? `untuk "${q}"` : ""} (Halaman ${currentPage})`
                : `Tidak ada komik yang ditemukan ${q ? `untuk "${q}"` : ""}.`}
            </span>
          </div>
        )}

        {/* Results Grid */}
        {items.length > 0 && (
          <div className="grid">
            {items.map((x, i) => (
              <MangaCard key={x.slug || i} item={x} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!error && items.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <h3>Komik Tidak Ditemukan</h3>
            <p className="muted">
              Coba kata kunci lain atau sesuaikan filter di atas.
            </p>
            <Link href="/search" className="btn btn-primary" style={{ marginTop: "12px" }}>
              Reset Pencarian & Filter
            </Link>
          </div>
        )}

        {/* Pagination (for filter browse without specific q query) */}
        {!q && items.length > 0 && (
          <div className="pagination">
            {currentPage > 1 ? (
              <Link href={createPageUrl(currentPage - 1)} className="btn">
                ← Sebelumnya
              </Link>
            ) : (
              <span className="btn" style={{ opacity: 0.4, pointerEvents: "none" }}>
                ← Sebelumnya
              </span>
            )}

            <span className="page-btn-current">Halaman {currentPage}</span>

            {items.length >= 10 && (
              <Link href={createPageUrl(currentPage + 1)} className="btn">
                Selanjutnya →
              </Link>
            )}
          </div>
        )}
      </main>
    </>
  );
}