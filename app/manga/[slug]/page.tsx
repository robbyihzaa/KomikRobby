import Link from "next/link";
import { detail } from "../../../lib/api";
import ChapterList from "../../../components/ChapterList";
import Navbar from "../../../components/Navbar";
import BookmarkButton from "../../../components/BookmarkButton";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const d = await detail(slug);
    return {
      title: `${d.title} – KomikZone`,
      description: d.description?.slice(0, 155) || `Baca ${d.title} Sub Indo di KomikZone`,
    };
  } catch {
    return { title: "Detail Komik – KomikZone" };
  }
}

function getFlagInfo(typeStr?: string) {
  const t = (typeStr || "").toLowerCase();
  if (t.includes("manhua")) return { label: "🇨🇳 Manhua", cls: "badge-manhua" };
  if (t.includes("manga")) return { label: "🇯🇵 Manga", cls: "badge-manga" };
  return { label: "🇰🇷 Manhwa", cls: "badge-manhwa" };
}

export default async function MangaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let d: any;
  let error = "";
  try { d = await detail(slug); } catch (e) { error = "Detail manga tidak dapat dimuat."; }

  if (error) return (
    <>
      <Navbar />
      <main className="container page-with-nav"><div className="error">{error}</div></main>
    </>
  );

  const chapters = d.chapter_list || d.chapters || [];
  const flagInfo = getFlagInfo(d.type);
  const genres: string[] = Array.isArray(d.genre) ? d.genre : (d.genre ? [d.genre] : []);
  const meta = { slug, title: d.title, image: d.image || d.thumbnail, type: d.type };

  return (
    <>
      <Navbar />
      <main className="container page-with-nav">
        {/* Detail Header */}
        <div className="detail">
          <div className="detail-cover-container">
            {d.thumbnail || d.image ? (
              <img className="detailcover" src={d.thumbnail || d.image} alt={d.title} />
            ) : (
              <div className="detailcover cover-placeholder">📖</div>
            )}
          </div>
          <div className="detail-meta">
            <h1 className="detail-title">{d.title}</h1>
            <Link
              href={`/browse?type=${d.type?.toLowerCase().includes("manhua") ? "manhua" : d.type?.toLowerCase().includes("manga") ? "manga" : "manhwa"}`}
              className={`card-flag-badge ${flagInfo.cls}`}
              style={{ position: "static", display: "inline-flex", marginBottom: 4 }}
            >
              {flagInfo.label}
            </Link>
            <p className="detail-desc">{d.description || d.desc || "Tidak ada deskripsi."}</p>

            <div className="detail-stat-row">
              <span className="detail-stat">Status: <strong>{d.status || "Ongoing"}</strong></span>
              <span className="detail-stat">Author: <strong>{d.author || "-"}</strong></span>
            </div>

            {genres.length > 0 && (
              <div className="detail-tags" style={{ marginTop: 12 }}>
                {genres.map((g, i) => {
                  const genreSlug = g.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
                  return (
                    <Link
                      key={i}
                      href={`/browse?genre=${genreSlug}`}
                      className="detail-tag detail-tag-link"
                    >
                      {g}
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Action Buttons for Mobile & Desktop */}
            <div className="detail-actions-row">
              {chapters.length > 0 && (
                <>
                  <Link
                    href={`/manga/${slug}/chapter/${encodeURIComponent(chapters[chapters.length - 1].chapter_number || chapters[chapters.length - 1].number || "1")}`}
                    className="btn-read-primary"
                  >
                    🚀 Baca Ch. 1
                  </Link>
                  <Link
                    href={`/manga/${slug}/chapter/${encodeURIComponent(chapters[0].chapter_number || chapters[0].number || "1")}`}
                    className="btn-read-secondary"
                  >
                    🔥 Latest (Ch. {chapters[0].chapter_number || chapters[0].number})
                  </Link>
                </>
              )}
              <BookmarkButton meta={meta} />
            </div>
          </div>
        </div>

        {/* Chapter List */}
        <section className="section">
          <div className="section-header">
            <h2>📖 Daftar Chapter ({chapters.length})</h2>
          </div>
          <ChapterList slug={slug} chapters={chapters} />
        </section>
      </main>
    </>
  );
}