"use client";

import { useEffect, useState } from "react";
import MangaCard from "./MangaCard";

interface VipMangaGridProps {
  items: any[];
  rankOffset?: number;
}

/**
 * Client wrapper that reads login status from localStorage and
 * renders MangaCard with the correct isLoggedIn flag.
 * VIP items (manhwadesu) get blurred/locked when user is not logged in.
 */
export default function VipMangaGrid({ items, rankOffset }: VipMangaGridProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem("komikzone_user");
      setIsLoggedIn(Boolean(saved));
    } catch {
      setIsLoggedIn(false);
    }
  }, []);

  // Before mount (SSR), don't show content to avoid hydration mismatch — show locked state
  // After mount, we know the real login status
  return (
    <>
      {items.map((item, i) => (
        <MangaCard
          key={item.slug || i}
          item={item}
          rank={rankOffset !== undefined ? rankOffset + i : undefined}
          isLoggedIn={mounted ? isLoggedIn : false}
        />
      ))}
    </>
  );
}
