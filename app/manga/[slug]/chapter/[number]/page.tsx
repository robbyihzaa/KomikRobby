import { chapter, detail } from "../../../../../lib/api";
import ReadTracker from "../../../../../components/ReadTracker";
import ChapterReader from "../../../../../components/ChapterReader";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; number: string }>;
}) {
  const { slug, number } = await params;
  return {
    title: `Chapter ${number} – ${slug.replace(/-/g, " ")} – Oniforge`,
    description: `Baca Manga / Manhwa Chapter ${number} Sub Indo online gratis di Oniforge.`,
  };
}

export default async function ReaderPage({
  params,
}: {
  params: Promise<{ slug: string; number: string }>;
}) {
  const { slug, number } = await params;
  let d: any;
  let manga: any;
  let error = "";

  try {
    d = await chapter(slug, number);
  } catch (e) {
    error = "Chapter tidak dapat dimuat.";
  }

  try {
    manga = await detail(slug);
  } catch {
    /* non-critical */
  }

  const pages: string[] = d?.image || d?.images || d?.pages || [];
  const mangaTitle = manga?.title || slug;
  const mangaImage = manga?.image || manga?.thumbnail;
  const mangaType = manga?.type;

  const rawChapters = manga?.chapter_list || manga?.chapters || [];
  const chapters = rawChapters.map((c: any) => ({
    number: String(c.number || c.chapter_number || "").trim(),
    endpoint: String(c.endpoint || c.number || "").trim(),
    title: c.title || `Chapter ${c.number}`,
  }));

  const cleanNumber = String(number).trim();
  const chRegex = new RegExp(`chapter-${cleanNumber}(\\D|$)`, "i");
  const currentIndex = chapters.findIndex(
    (c: any) =>
      c.number === cleanNumber ||
      c.endpoint === cleanNumber ||
      c.endpoint === `chapter-${cleanNumber}` ||
      chRegex.test(c.endpoint)
  );

  let prevChapter: any = null;
  let nextChapter: any = null;

  if (currentIndex !== -1) {
    const isDescending =
      chapters.length >= 2
        ? parseFloat(chapters[0].number || "0") >=
          parseFloat(chapters[chapters.length - 1].number || "0")
        : true;

    if (isDescending) {
      // Descending (newest first): previous story chapter is at currentIndex + 1
      prevChapter = chapters[currentIndex + 1] || null;
      // next story chapter is at currentIndex - 1
      nextChapter = chapters[currentIndex - 1] || null;
    } else {
      // Ascending: previous story chapter is at currentIndex - 1
      prevChapter = chapters[currentIndex - 1] || null;
      // next story chapter is at currentIndex + 1
      nextChapter = chapters[currentIndex + 1] || null;
    }
  } else if (chapters.length > 0) {
    // Fallback based on numeric comparison
    const currentNum = parseFloat(cleanNumber);
    if (!isNaN(currentNum)) {
      const sorted = [...chapters].sort(
        (a, b) => parseFloat(a.number || "0") - parseFloat(b.number || "0")
      );
      const prevs = sorted.filter((c) => parseFloat(c.number || "0") < currentNum);
      const nexts = sorted.filter((c) => parseFloat(c.number || "0") > currentNum);
      if (prevs.length > 0) prevChapter = prevs[prevs.length - 1];
      if (nexts.length > 0) nextChapter = nexts[0];
    }
  }

  return (
    <>
      {/* Track read status & history */}
      <ReadTracker
        slug={slug}
        number={number}
        mangaTitle={mangaTitle}
        mangaImage={mangaImage}
        mangaType={mangaType}
      />

      {/* Reader with touch-toggle, auto-hide, prev/next, and chapter jump */}
      <ChapterReader
        slug={slug}
        number={number}
        pages={pages}
        mangaTitle={mangaTitle}
        chapters={chapters}
        prevChapter={prevChapter}
        nextChapter={nextChapter}
        error={error}
      />
    </>
  );
}