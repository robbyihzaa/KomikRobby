"use client";

import { useEffect } from "react";
import { markChapterRead, pushHistory } from "../lib/storage";

interface Props {
  slug: string;
  number: string;
  mangaTitle?: string;
  mangaImage?: string;
  mangaType?: string;
}

export default function ReadTracker({ slug, number, mangaTitle, mangaImage, mangaType }: Props) {
  useEffect(() => {
    if (!slug || !number) return;

    // Mark chapter as read
    markChapterRead(slug, number);

    // Push to history
    pushHistory({
      slug,
      title: mangaTitle || slug,
      image: mangaImage,
      type: mangaType,
      chapterNumber: number,
      chapterTitle: `Chapter ${number}`,
      readAt: Date.now(),
    });
  }, [slug, number, mangaTitle, mangaImage, mangaType]);

  return null;
}
