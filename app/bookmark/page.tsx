"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import { getBookmarks, removeBookmark, ComicMeta } from "../../lib/storage";

export default function BookmarkPage() {
  const [bookmarks, setBookmarks] = useState<ComicMeta[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setBookmarks(getBookmarks());
    setLoaded(true);
  }, []);

  const handleRemove = (slug: string) => {
    removeBookmark(slug);
    setBookmarks(getBookmarks());
  };

  function getComicFlag(typeStr?: string) {
    const t = (typeStr || "").toLowerCase();
    if (t.includes("manhua")) return "🇨🇳 Manhua";
    if (t.includes("manga")) return "🇯🇵 Manga";
    return "🇰🇷 Manhwa";
  }

  return (
    <>
      <Navbar />
      <main className="container page-with-nav">
        <div className="page-header">
          <h1>🔖 Bookmark</h1>
          <p className="muted">Komik yang kamu simpan untuk dibaca nanti.</p>
        </div>

        {!loaded ? (
          <div className="loading-state">Memuat...</div>
        ) : bookmarks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔖</div>
            <h3>Belum ada Bookmark</h3>
            <p className="muted">Tekan ikon <strong>➕</strong> pada komik untuk menambahkannya ke sini.</p>
            <Link href="/" className="btn btn-primary">Jelajahi Komik</Link>
          </div>
        ) : (
          <>
            <p className="muted section-count">{bookmarks.length} komik tersimpan</p>
            <div className="grid">
              {bookmarks.map((item) => (
                <div key={item.slug} className="card">
                  <Link href={`/manga/${item.slug}`} className="card-link">
                    <div className="card-cover-wrap">
                      {item.image ? (
                        <img className="cover" src={item.image} alt={item.title} loading="lazy" />
                      ) : (
                        <div className="cover cover-placeholder" />
                      )}
                      <span className="card-flag-badge">{getComicFlag(item.type)}</span>
                    </div>
                    <div className="cardbody">
                      <div className="card-title">{item.title}</div>
                      {item.addedAt && (
                        <div className="card-subtitle">
                          Disimpan {new Date(item.addedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                        </div>
                      )}
                    </div>
                  </Link>
                  <div className="card-footer">
                    <button
                      className="bookmark-btn bookmarked"
                      onClick={() => handleRemove(item.slug)}
                      title="Hapus Bookmark"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </>
  );
}
