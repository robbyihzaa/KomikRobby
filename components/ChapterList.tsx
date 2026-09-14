"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getReadChapters } from "../lib/storage";

interface Chapter {
  name?: string;
  title?: string;
  number?: string;
  chapter_number?: string;
  endpoint?: string;
  url?: string;
  release_date?: string;
  date?: string;
}

export default function ChapterList({ slug, chapters }: { slug: string; chapters: Chapter[] }) {
  const [readChapters, setReadChapters] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setReadChapters(getReadChapters(slug));
  }, [slug]);

  if (!chapters || chapters.length === 0) {
    return <div className="muted">Tidak ada chapter.</div>;
  }

  const filtered = chapters.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase().trim();
    const titleText = (c.name || c.title || "").toLowerCase();
    const num = (c.chapter_number || c.number || "").toLowerCase();
    return titleText.includes(q) || num.includes(q);
  });

  return (
    <div className="chapter-list-container">
      {chapters.length > 8 && (
        <div className="chapter-search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="chapter-search-input"
            placeholder={`Cari dari ${chapters.length} chapter... (contoh: 50)`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="clear-search-btn" onClick={() => setSearch("")}>
              ✕
            </button>
          )}
        </div>
      )}

      <div className="chapters">
        {filtered.length === 0 ? (
          <div className="muted" style={{ padding: "16px", textAlign: "center" }}>
            Chapter "{search}" tidak ditemukan.
          </div>
        ) : (
          filtered.map((c, i) => {
            const ep = c.endpoint || c.url || "";
            const parts = ep.split("/").filter(Boolean);
            const last = parts[parts.length - 1] || "";
            const n = c.chapter_number || c.number || last.match(/chapter[- ]?([0-9.]+)/i)?.[1] || last;
            const releaseDate = c.release_date || c.date || "";
            const titleText = c.name || c.title || `Chapter ${n}`;
            const isRead = readChapters.includes(n) || readChapters.includes(ep);

            return (
              <Link
                className={`chapter ${isRead ? "chapter-read" : ""}`}
                key={i}
                href={`/manga/${slug}/chapter/${encodeURIComponent(n)}`}
              >
                <div className="chapter-info">
                  <span className="chapter-title">{titleText}</span>
                  {releaseDate && <span className="chapter-date">📅 {releaseDate}</span>}
                </div>
                {isRead && <span className="read-badge">✓ Dibaca</span>}
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
