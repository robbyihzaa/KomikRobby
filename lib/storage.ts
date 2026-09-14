/**
 * Shared localStorage helpers for bookmarks and history.
 * All functions are safe to call (no-op) on SSR / if localStorage is unavailable.
 */

export interface ComicMeta {
  slug: string;
  title: string;
  image?: string;
  type?: string;
  addedAt?: number; // epoch ms
}

export interface HistoryEntry {
  slug: string;
  title: string;
  image?: string;
  type?: string;
  chapterNumber: string;
  chapterTitle?: string;
  readAt: number; // epoch ms
}

/* ─── Bookmarks ──────────────────────────────────────────── */
const BM_KEY = "comic_bookmarks";

export function getBookmarks(): ComicMeta[] {
  try {
    return JSON.parse(localStorage.getItem(BM_KEY) || "[]");
  } catch {
    return [];
  }
}

export function isBookmarked(slug: string): boolean {
  return getBookmarks().some((b) => b.slug === slug);
}

export function toggleBookmark(meta: ComicMeta): boolean {
  const list = getBookmarks();
  const idx = list.findIndex((b) => b.slug === meta.slug);
  if (idx >= 0) {
    list.splice(idx, 1);
    localStorage.setItem(BM_KEY, JSON.stringify(list));
    return false; // removed
  } else {
    list.unshift({ ...meta, addedAt: Date.now() });
    localStorage.setItem(BM_KEY, JSON.stringify(list));
    return true; // added
  }
}

export function removeBookmark(slug: string) {
  const list = getBookmarks().filter((b) => b.slug !== slug);
  localStorage.setItem(BM_KEY, JSON.stringify(list));
}

/* ─── History ────────────────────────────────────────────── */
const HX_KEY = "comic_history";

export function getHistory(): HistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem(HX_KEY) || "[]");
  } catch {
    return [];
  }
}

export function pushHistory(entry: HistoryEntry) {
  try {
    // Deduplicate by slug+chapter; keep latest at top
    let list = getHistory().filter(
      (h) => !(h.slug === entry.slug && h.chapterNumber === entry.chapterNumber)
    );
    list.unshift(entry);
    if (list.length > 200) list = list.slice(0, 200); // cap
    localStorage.setItem(HX_KEY, JSON.stringify(list));
  } catch {
    // no-op
  }
}

export function clearHistory() {
  localStorage.removeItem(HX_KEY);
}

/* ─── Read Chapters ──────────────────────────────────────── */
const RC_KEY = "comic_read_chapters";

export function getReadChapters(slug: string): string[] {
  try {
    const map: Record<string, string[]> = JSON.parse(
      localStorage.getItem(RC_KEY) || "{}"
    );
    return map[slug] || [];
  } catch {
    return [];
  }
}

export function markChapterRead(slug: string, number: string) {
  try {
    const map: Record<string, string[]> = JSON.parse(
      localStorage.getItem(RC_KEY) || "{}"
    );
    const list = map[slug] || [];
    if (!list.includes(number)) {
      list.push(number);
      map[slug] = list;
      localStorage.setItem(RC_KEY, JSON.stringify(map));
    }
  } catch {
    // no-op
  }
}
