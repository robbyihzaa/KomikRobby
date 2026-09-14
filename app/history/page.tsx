"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import { getHistory, clearHistory, HistoryEntry } from "../../lib/storage";

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Baru saja";
  if (mins < 60) return `${mins} menit lalu`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} jam lalu`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} hari lalu`;
  return new Date(ts).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

function getComicFlag(typeStr?: string) {
  const t = (typeStr || "").toLowerCase();
  if (t.includes("manhua")) return "🇨🇳 Manhua";
  if (t.includes("manga")) return "🇯🇵 Manga";
  return "🇰🇷 Manhwa";
}

// Group entries by manga slug (for showing latest chapter per manga)
function groupByManga(entries: HistoryEntry[]): HistoryEntry[] {
  const seen = new Set<string>();
  return entries.filter((h) => {
    if (seen.has(h.slug)) return false;
    seen.add(h.slug);
    return true;
  });
}

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [grouped, setGrouped] = useState(true);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setHistory(getHistory());
    setLoaded(true);
  }, []);

  const handleClear = () => {
    if (confirm("Hapus semua riwayat baca?")) {
      clearHistory();
      setHistory([]);
    }
  };

  const displayed = grouped ? groupByManga(history) : history;

  return (
    <>
      <Navbar />
      <main className="container page-with-nav">
        <div className="page-header">
          <div>
            <h1>🕓 History</h1>
            <p className="muted">Riwayat chapter yang sudah kamu baca.</p>
          </div>
          {history.length > 0 && (
            <div className="page-header-actions">
              <button
                className={`toggle-btn ${grouped ? "active" : ""}`}
                onClick={() => setGrouped(true)}
              >
                Per Komik
              </button>
              <button
                className={`toggle-btn ${!grouped ? "active" : ""}`}
                onClick={() => setGrouped(false)}
              >
                Semua Chapter
              </button>
              <button className="btn-danger" onClick={handleClear}>
                🗑 Hapus Semua
              </button>
            </div>
          )}
        </div>

        {!loaded ? (
          <div className="loading-state">Memuat...</div>
        ) : history.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🕓</div>
            <h3>Belum ada History</h3>
            <p className="muted">Riwayat bacamu akan muncul di sini setelah kamu membuka chapter.</p>
            <Link href="/" className="btn btn-primary">Mulai Baca</Link>
          </div>
        ) : (
          <>
            <p className="muted section-count">{displayed.length} {grouped ? "komik" : "chapter"} terakhir dibaca</p>
            <div className="history-list">
              {displayed.map((h, i) => (
                <Link
                  key={i}
                  href={`/manga/${h.slug}/chapter/${encodeURIComponent(h.chapterNumber)}`}
                  className="history-item"
                >
                  <div className="history-thumb">
                    {h.image ? (
                      <img src={h.image} alt={h.title} className="history-img" loading="lazy" />
                    ) : (
                      <div className="history-img-placeholder">📖</div>
                    )}
                  </div>
                  <div className="history-info">
                    <div className="history-title">{h.title}</div>
                    <div className="history-chapter">{h.chapterTitle || `Chapter ${h.chapterNumber}`}</div>
                    <div className="history-meta">
                      <span className="history-type">{getComicFlag(h.type)}</span>
                      <span className="history-time">🕓 {timeAgo(h.readAt)}</span>
                    </div>
                  </div>
                  <div className="history-arrow">›</div>
                </Link>
              ))}
            </div>
          </>
        )}
      </main>
    </>
  );
}
