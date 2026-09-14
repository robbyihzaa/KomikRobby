"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";


interface ChapterItem {
  number: string;
  endpoint?: string;
  title?: string;
  url?: string;
}

interface ChapterReaderProps {
  slug: string;
  number: string;
  pages: string[];
  mangaTitle: string;
  chapters: ChapterItem[];
  prevChapter?: ChapterItem | null;
  nextChapter?: ChapterItem | null;
  error?: string;
}


export default function ChapterReader({
  slug,
  number,
  pages,
  mangaTitle,
  chapters,
  prevChapter,
  nextChapter,
  error,
}: ChapterReaderProps) {
  const router = useRouter();
  const [showNav, setShowNav] = useState(true);
  const [hintVisible, setHintVisible] = useState(true);
  const [readPct, setReadPct] = useState(0);
  const lastScrollY = useRef(0);
  const advancedRef = useRef(false);

  // Auto-hide hint after 4s
  useEffect(() => {
    const t = setTimeout(() => setHintVisible(false), 4000);
    return () => clearTimeout(t);
  }, []);

  // Scroll: auto-hide nav + instant auto-advance at bottom
  useEffect(() => {
    advancedRef.current = false; // reset on chapter change
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const diff = currentScrollY - lastScrollY.current;

      if (Math.abs(diff) > 10) {
        if (currentScrollY > 80 && diff > 0) {
          setShowNav(false);
          setHintVisible(false);
        } else if (diff < -20) {
          setShowNav(true);
        }
      }
      lastScrollY.current = currentScrollY;

      // Reading progress percentage
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      setReadPct(docH > 0 ? Math.min(100, Math.round((currentScrollY / docH) * 100)) : 0);

      // Instantly navigate to next chapter when user reaches the bottom
      if (!advancedRef.current && nextChapter) {
        const atBottom =
          window.innerHeight + currentScrollY >= document.documentElement.scrollHeight - 80;
        if (atBottom) {
          advancedRef.current = true;
          router.replace(`/manga/${slug}/chapter/${nextChapter.number}`);
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [nextChapter, router, slug]);

  // Keyboard navigation (← / →)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["INPUT", "SELECT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)) return;
      if (e.key === "ArrowLeft" && prevChapter) {
        router.push(`/manga/${slug}/chapter/${prevChapter.number}`);
      } else if (e.key === "ArrowRight" && nextChapter) {
        router.push(`/manga/${slug}/chapter/${nextChapter.number}`);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router, slug, prevChapter, nextChapter]);

  // Intercept hardware/browser back button on mobile to always return to chapter list (/manga/${slug})
  useEffect(() => {
    window.history.pushState({ readerPage: true }, "");

    const handlePopState = () => {
      router.replace(`/manga/${slug}`);
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [router, slug]);

  // Tap-to-toggle navigator
  const handleScreenClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (
      target.closest("a") ||
      target.closest("button") ||
      target.closest("select") ||
      target.closest(".reader-interactive") ||
      target.closest(".reader-nav-footer")
    ) {
      return;
    }
    setShowNav((prev) => !prev);
  };

  const handleChapterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedNum = e.target.value;
    if (selectedNum && selectedNum !== number) {
      router.replace(`/manga/${slug}/chapter/${selectedNum}`);
    }
  };



  return (
    <div className="reader-wrapper" onClick={handleScreenClick}>
      {/* ─── Reading Progress Bar ────────────────────────────────── */}
      <div className="reader-progress-track" aria-hidden="true">
        <div className="reader-progress-fill" style={{ width: `${readPct}%` }} />
      </div>

      {/* ─── Top Reader Bar ─────────────────────────────────────── */}
      <header className={`readerbar ${!showNav ? "readerbar-hidden" : ""}`}>
        <div className="readerbar-inner">
          {/* Back button */}
          <Link href={`/manga/${slug}`} className="reader-back-btn reader-interactive">
            ← <span className="reader-back-text">Kembali</span>
          </Link>

          {/* Center: Chapter Jump Select */}
          <div className="reader-center-control reader-interactive">
            <select
              className="reader-chapter-dropdown"
              value={number}
              onChange={handleChapterChange}
              aria-label="Pilih Chapter"
            >
              {chapters.length > 0 ? (
                chapters.map((c) => (
                  <option key={c.number} value={c.number}>
                    Chapter {c.number}
                  </option>
                ))
              ) : (
                <option value={number}>Chapter {number}</option>
              )}
            </select>
          </div>

          {/* Right: arrows + page count */}
          <div className="reader-right-controls">
            <span className="reader-page-count">{pages.length} hal.</span>
            <div className="reader-quick-arrows reader-interactive">
              {prevChapter ? (
                <Link
                  href={`/manga/${slug}/chapter/${prevChapter.number}`}
                  className="reader-arrow-btn"
                  title={`Ch. Sebelumnya (${prevChapter.number})`}
                  aria-label="Chapter Sebelumnya"
                >
                  ◀
                </Link>
              ) : (
                <span className="reader-arrow-btn reader-arrow-disabled" aria-hidden="true">◀</span>
              )}
              {nextChapter ? (
                <Link
                  href={`/manga/${slug}/chapter/${nextChapter.number}`}
                  className="reader-arrow-btn"
                  title={`Ch. Selanjutnya (${nextChapter.number})`}
                  aria-label="Chapter Selanjutnya"
                >
                  ▶
                </Link>
              ) : (
                <span className="reader-arrow-btn reader-arrow-disabled" aria-hidden="true">▶</span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Touch hint */}
      {hintVisible && (
        <div className="reader-touch-hint">
          💡 Sentuh layar untuk menyembunyikan / menampilkan menu
        </div>
      )}

      {/* ─── Pages ──────────────────────────────────────────────── */}
      <main className="reader">
        {error ? (
          <div className="error" style={{ margin: "40px 20px" }}>{error}</div>
        ) : pages.length === 0 ? (
          <div className="notice" style={{ margin: "40px 20px" }}>
            Tidak ada halaman yang ditemukan dari sumber data.
          </div>
        ) : (
          pages.map((src: string, i: number) => (
            <img
              className="page"
              key={i}
              src={src}
              alt={`Halaman ${i + 1}`}
              loading={i < 2 ? "eager" : "lazy"}
              decoding="async"
              referrerPolicy="no-referrer"
            />
          ))
        )}



        {/* ─── End of Chapter Navigation Footer ───────────────── */}
        {!error && pages.length > 0 && (
          <div className="reader-nav-footer reader-interactive">
            <div className="reader-footer-title">
              <h3>Selesai Membaca Chapter {number}</h3>
              <p className="muted">{mangaTitle}</p>
            </div>

            <div className="reader-footer-actions">
              {prevChapter ? (
                <Link
                  href={`/manga/${slug}/chapter/${prevChapter.number}`}
                  className="btn reader-footer-btn"
                >
                  ← Ch. Sebelumnya ({prevChapter.number})
                </Link>
              ) : (
                <span className="btn reader-footer-btn" style={{ opacity: 0.4, pointerEvents: "none" }}>
                  ← Chapter Pertama
                </span>
              )}

              <select
                className="reader-chapter-dropdown reader-footer-select"
                value={number}
                onChange={handleChapterChange}
                aria-label="Lompat ke Chapter"
              >
                {chapters.map((c) => (
                  <option key={c.number} value={c.number}>
                    Lompat ke Chapter {c.number}
                  </option>
                ))}
              </select>

              {nextChapter ? (
                <Link
                  href={`/manga/${slug}/chapter/${nextChapter.number}`}
                  className="btn btn-primary reader-footer-btn"
                >
                  Ch. Selanjutnya ({nextChapter.number}) →
                </Link>
              ) : (
                <span className="btn reader-footer-btn" style={{ opacity: 0.4, pointerEvents: "none" }}>
                  Chapter Terakhir
                </span>
              )}
            </div>

            <div style={{ marginTop: 20, textAlign: "center" }}>
              <Link href={`/manga/${slug}`} className="btn-text-toggle" style={{ fontSize: 14 }}>
                📖 Kembali ke Daftar Chapter
              </Link>
            </div>
          </div>
        )}
      </main>

      {/* ─── Bottom Floating Navigator Bar ──────────────────────── */}
      <nav
        className={`reader-bottom-bar ${!showNav ? "reader-bottom-bar-hidden" : ""}`}
        aria-label="Navigasi Membaca"
      >
        <div className="reader-bottom-inner reader-interactive">
          {prevChapter ? (
            <Link
              href={`/manga/${slug}/chapter/${prevChapter.number}`}
              className="reader-bottom-btn"
              title={`Ch. Sebelumnya (${prevChapter.number})`}
            >
              ◀ <span className="reader-bottom-btn-label">Prev</span>
            </Link>
          ) : (
            <span className="reader-bottom-btn reader-bottom-btn-disabled">
              ◀ <span className="reader-bottom-btn-label">Prev</span>
            </span>
          )}

          <select
            className="reader-chapter-dropdown reader-bottom-select"
            value={number}
            onChange={handleChapterChange}
            aria-label="Pilih Chapter"
          >
            {chapters.length > 0 ? (
              chapters.map((c) => (
                <option key={c.number} value={c.number}>
                  Ch. {c.number}
                </option>
              ))
            ) : (
              <option value={number}>Ch. {number}</option>
            )}
          </select>

          {nextChapter ? (
            <Link
              href={`/manga/${slug}/chapter/${nextChapter.number}`}
              className="reader-bottom-btn reader-bottom-btn-primary"
              title={`Ch. Selanjutnya (${nextChapter.number})`}
            >
              <span className="reader-bottom-btn-label">Next</span> ▶
            </Link>
          ) : (
            <span className="reader-bottom-btn reader-bottom-btn-disabled">
              <span className="reader-bottom-btn-label">Next</span> ▶
            </span>
          )}
        </div>
      </nav>
    </div>
  );
}
