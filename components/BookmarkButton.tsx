"use client";

import { useEffect, useState } from "react";
import { isBookmarked, toggleBookmark, ComicMeta } from "../lib/storage";

interface Props {
  meta: ComicMeta;
}

export default function BookmarkButton({ meta }: Props) {
  const [bookmarked, setBookmarked] = useState(false);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setBookmarked(isBookmarked(meta.slug));
  }, [meta.slug]);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const result = toggleBookmark(meta);
    setBookmarked(result);
    setAnimate(true);
    setTimeout(() => setAnimate(false), 400);
  };

  return (
    <button
      onClick={handleClick}
      className={`bookmark-btn ${bookmarked ? "bookmarked" : ""} ${animate ? "bm-animate" : ""}`}
      title={bookmarked ? "Hapus Bookmark" : "Tambah Bookmark"}
      aria-label={bookmarked ? "Hapus Bookmark" : "Tambah Bookmark"}
    >
      {bookmarked ? "🔖" : "➕"}
    </button>
  );
}
