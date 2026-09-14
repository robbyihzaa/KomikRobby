import Link from "next/link";
import Navbar from "../components/Navbar";

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main className="container page-with-nav">
        <div className="empty-state" style={{ minHeight: "60vh", justifyContent: "center" }}>
          <div className="empty-icon">404</div>
          <h2>Halaman Tidak Ditemukan</h2>
          <p className="muted">
            Maaf, halaman yang kamu cari tidak ditemukan atau telah dipindahkan.
          </p>
          <Link href="/" className="btn btn-primary" style={{ marginTop: 16 }}>
            🏠 Kembali ke Beranda
          </Link>
        </div>
      </main>
    </>
  );
}
