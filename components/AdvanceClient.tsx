"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import VipMangaGrid from "./VipMangaGrid";

interface AdvanceClientProps {
  items: any[];
  page: number;
}

export default function AdvanceClient({ items, page }: AdvanceClientProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem("komikzone_user");
      if (saved) {
        const parsed = JSON.parse(saved);
        setIsLoggedIn(true);
        setUsername(parsed.username || "VIP Member");
      } else {
        setIsLoggedIn(false);
      }
    } catch {
      setIsLoggedIn(false);
    }
  }, []);

  return (
    <div>
      {/* Warning or Welcome Banner based on Login state */}
      {mounted && !isLoggedIn && (
        <div className="vip-warning-box" style={{ marginBottom: 24 }}>
          <div className="vip-warning-header">
            <span className="vip-warning-icon">⚠️</span>
            <div>
              <h3 className="vip-warning-title">PERINGATAN: Akses Terkunci!</h3>
              <p className="vip-warning-desc">
                Halaman <strong>Advance VIP</strong> ini berisi komik eksklusif dari ManhwaDesu. Anda belum masuk (login) ke sistem KomikZone.
              </p>
            </div>
          </div>
          <div className="vip-warning-body">
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 14 }}>
              Orang tanpa login hanya dapat melihat pratinjau judul & gambar yang disamarkan (blur). Silakan login terlebih dahulu untuk membuka kunci seluruh konten VIP.
            </p>
            <Link href="/account" className="btn btn-primary vip-login-cta-btn">
              🔑 Login Sekarang ke Panel Akun →
            </Link>
          </div>
        </div>
      )}

      {mounted && isLoggedIn && (
        <div className="vip-welcome-box" style={{ marginBottom: 24 }}>
          <div className="vip-welcome-header">
            <span className="vip-welcome-icon">👑</span>
            <div>
              <h3 className="vip-welcome-title">Mode Advance VIP Aktif</h3>
              <p className="vip-welcome-desc">
                Selamat datang kembali, <strong>{username}</strong>! Seluruh komik eksklusif ManhwaDesu terbuka penuh untuk Anda.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Grid of VIP Comics */}
      <section className="section">
        <div className="section-header">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h2>👑 Koleksi Komik VIP (Advance)</h2>
            <span className="section-badge vip-section-badge">
              {mounted && isLoggedIn ? "🔓 UNLOCKED" : "🔒 LOGIN REQUIRED"}
            </span>
          </div>
          <span className="muted" style={{ fontSize: 13 }}>
            Source: ManhwaDesu
          </span>
        </div>

        {items.length === 0 ? (
          <div className="muted" style={{ padding: "40px 0", textAlign: "center" }}>
            Tidak ada komik VIP ditemukan atau gagal memuat data ManhwaDesu.
          </div>
        ) : (
          <div className="grid">
            <VipMangaGrid items={items} />
          </div>
        )}

        {/* Pagination */}
        {items.length > 0 && (
          <div className="pagination" style={{ marginTop: 28 }}>
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
    </div>
  );
}
