"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import MangaCard from "../../components/MangaCard";

interface UserSession {
  username: string;
  role: string;
  joined: string;
  avatar: string;
}

export default function AccountPage() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [bookmarkCount, setBookmarkCount] = useState(0);
  const [historyCount, setHistoryCount] = useState(0);
  const [manhwaDesuItems, setManhwaDesuItems] = useState<any[]>([]);
  const [loadingManhwa, setLoadingManhwa] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  useEffect(() => {
    // Check saved session
    try {
      const savedUser = localStorage.getItem("komikzone_user");
      if (savedUser) {
        setUser(JSON.parse(savedUser));
        fetchManhwaDesu();
      }

      // Check bookmark and history stats
      const bm = localStorage.getItem("komikzone_bookmarks");
      if (bm) setBookmarkCount(JSON.parse(bm).length || 0);

      const hist = localStorage.getItem("komikzone_history");
      if (hist) setHistoryCount(JSON.parse(hist).length || 0);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchManhwaDesu = async () => {
    setLoadingManhwa(true);
    try {
      const res = await fetch("/api/source/manhwadesu");
      if (res.ok) {
        const data = await res.json();
        setManhwaDesuItems(data.items || []);
      }
    } catch (e) {
      console.error("Gagal memuat ManhwaDesu", e);
    } finally {
      setLoadingManhwa(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const inputId = username.trim();
    const inputPw = password.trim();

    if (inputId === "admin" && inputPw === "!Rr19102213") {
      const sessionData: UserSession = {
        username: "admin",
        role: "Administrator Master 🛡️",
        joined: "September 2026",
        avatar: "👑",
      };
      localStorage.setItem("komikzone_user", JSON.stringify(sessionData));
      setUser(sessionData);
      fetchManhwaDesu();
    } else if (inputId === "exgodson1" && inputPw === "ilomilo!") {
      const sessionData: UserSession = {
        username: "exgodson1",
        role: "VIP Premium Member 👑",
        joined: "September 2026",
        avatar: "⚡",
      };
      localStorage.setItem("komikzone_user", JSON.stringify(sessionData));
      setUser(sessionData);
      fetchManhwaDesu();
    } else {
      setError("ID / Username atau Password yang Anda masukkan salah. Silakan coba lagi.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("komikzone_user");
    setUser(null);
    setManhwaDesuItems([]);
  };

  return (
    <>
      <Navbar />
      <main className="container page-with-nav">
        <div className="page-header">
          <div>
            <h1>👤 Panel Akun</h1>
            <p className="muted">
              Kelola profil akun, akses fitur member, dan pantau aktivitas membacamu.
            </p>
          </div>
        </div>

        {user ? (
          /* ─── Logged In VIP Dashboard ─── */
          <div className="account-dashboard">
            {/* User Profile Card */}
            <div className="profile-card">
              <div className="profile-header">
                <div className="profile-avatar">{user.avatar}</div>
                <div className="profile-info">
                  <div className="profile-username-row">
                    <h2 className="profile-username">{user.username}</h2>
                    <span className="profile-badge">{user.role}</span>
                  </div>
                  <p className="profile-joined">Anggota sejak {user.joined}</p>
                </div>
              </div>

              <div className="profile-stats-grid">
                <div className="stat-card">
                  <span className="stat-icon">🔖</span>
                  <div className="stat-num">{bookmarkCount}</div>
                  <div className="stat-label">Komik Di-bookmark</div>
                </div>

                <div className="stat-card">
                  <span className="stat-icon">🕓</span>
                  <div className="stat-num">{historyCount}</div>
                  <div className="stat-label">Riwayat Dibaca</div>
                </div>

                <div className="stat-card">
                  <span className="stat-icon">👑</span>
                  <div className="stat-num">Aktif</div>
                  <div className="stat-label">Advance VIP</div>
                </div>
              </div>

              <div className="profile-actions">
                <Link href="/advance" className="btn btn-primary" style={{ background: "linear-gradient(135deg, #ffd700, #ff8c00)", color: "#000", fontWeight: 800 }}>
                  👑 Halaman Advance (VIP)
                </Link>
                <Link href="/bookmark" className="btn">
                  🔖 Bookmark Saya
                </Link>
                <Link href="/history" className="btn">
                  🕓 Riwayat Baca
                </Link>
                <Link href="/search" className="btn">
                  🔍 Cari & Filter Komik
                </Link>
                <button type="button" onClick={handleLogout} className="btn btn-danger">
                  🚪 Keluar (Logout)
                </button>
              </div>
            </div>

            {/* ─── Protected Private Panel: ManhwaDesu (Only visible after login) ─── */}
            <div className="vip-panel-section" style={{ marginTop: 32 }}>
              <div className="section-header">
                <div>
                  <h2>🔒 Panel ManhwaDesu (Privat)</h2>
                  <p className="muted" style={{ fontSize: 13, marginTop: 2 }}>
                    Koleksi Manhwa dari ManhwaDesu yang terkunci khusus untuk member terdaftar ({user.username}).
                  </p>
                </div>
                <Link href="/advance" className="btn-text-toggle" style={{ fontSize: 13, color: "#ffd700" }}>
                  Buka Halaman Advance Full →
                </Link>
              </div>

              {loadingManhwa ? (
                <div className="loading-state">Memuat koleksi ManhwaDesu...</div>
              ) : manhwaDesuItems.length > 0 ? (
                <div className="grid">
                  {manhwaDesuItems.map((item, i) => (
                    <MangaCard key={item.slug || i} item={item} isLoggedIn={true} />
                  ))}
                </div>
              ) : (
                <div className="notice">
                  Daftar ManhwaDesu sedang diperbarui.
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ─── Login Form (Public View - No secret credentials exposed) ─── */
          <div className="login-container">
            <div className="login-card">
              <div className="login-header">
                <div className="login-icon">🔒</div>
                <h2>Masuk ke KomikZone</h2>
                <p className="muted">
                  Masuk untuk membuka Halaman Advance (VIP) &amp; fitur khusus member.
                </p>
              </div>

              {error && <div className="error" style={{ marginBottom: 16 }}>{error}</div>}

              <form onSubmit={handleLogin} className="login-form">
                <div className="form-group">
                  <label className="form-label">ID / Username</label>
                  <input
                    type="text"
                    className="input"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Masukkan ID / Username Anda"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    className="input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan Password Anda"
                    required
                  />
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(true)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--accent)",
                        cursor: "pointer",
                        fontSize: 13,
                        fontWeight: 600,
                        padding: 0,
                        textDecoration: "underline"
                      }}
                    >
                      ❓ Lupa Password?
                    </button>
                  </div>
                </div>

                <button type="submit" className="btn btn-primary btn-login">
                  🔑 Masuk Akun
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Modal Lupa Password */}
        {showForgotModal && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.75)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
              padding: 20
            }}
            onClick={() => setShowForgotModal(false)}
          >
            <div
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-lg)",
                padding: 28,
                maxWidth: 440,
                width: "100%",
                boxShadow: "0 12px 40px rgba(0,0,0,0.6)"
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ fontSize: 32, textAlign: "center", marginBottom: 12 }}>🔐</div>
              <h3 style={{ fontSize: 18, fontWeight: 800, textAlign: "center", marginBottom: 10 }}>
                Reset &amp; Lupa Password
              </h3>
              <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6, textAlign: "center" }}>
                Demi menjaga privasi dan keamanan akun VIP member KomikZone, pengubahan password dilakukan secara terverifikasi.
              </p>
              <div
                style={{
                  background: "rgba(108, 99, 255, 0.1)",
                  border: "1px dashed rgba(108, 99, 255, 0.3)",
                  borderRadius: "var(--radius-md)",
                  padding: 12,
                  margin: "16px 0",
                  fontSize: 13,
                  color: "var(--text-primary)",
                  textAlign: "center"
                }}
              >
                💬 Silakan hubungi <strong>Admin KomikZone</strong> untuk melakukan verifikasi identitas &amp; reset password Anda.
              </div>
              <button
                type="button"
                className="btn btn-primary"
                style={{ width: "100%", marginTop: 8 }}
                onClick={() => setShowForgotModal(false)}
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
