import Link from "next/link";
import BookmarkButton from "./BookmarkButton";

function getComicFlag(typeStr?: string) {
  const t = (typeStr || "").toLowerCase();
  if (t.includes("manhua")) return { full: "🇨🇳 Manhua", cls: "badge-manhua" };
  if (t.includes("manga")) return { full: "🇯🇵 Manga", cls: "badge-manga" };
  return { full: "🇰🇷 Manhwa", cls: "badge-manhwa" };
}

interface MangaCardProps {
  item: any;
  rank?: number;
}

export default function MangaCard({ item, rank }: MangaCardProps) {
  const slug = item.slug || item.endpoint?.split("/").filter(Boolean).pop() || "";
  const typeInfo = getComicFlag(item.type);
  const meta = { slug, title: item.title || slug, image: item.image || item.thumbnail, type: item.type };

  return (
    <div className="card">
      <Link
        href={`/manga/${slug}`}
        className="card-link"
        title={item.title || slug}
      >
        <div className="card-cover-wrap">
          {item.image || item.thumbnail ? (
            <img
              className="cover"
              src={item.image || item.thumbnail}
              alt={item.title || slug}
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="cover cover-placeholder">📖</div>
          )}
          <span className={`card-flag-badge ${typeInfo.cls}`}>{typeInfo.full}</span>
          {rank !== undefined && (
            <span className="card-rank-badge">#{rank + 1}</span>
          )}
        </div>

        <div className="cardbody">
          <div className="card-title">
            {item.title || slug}
          </div>
          {(item.latestChapter || item.updateDate) && (
            <div className="card-meta-row">
              {item.latestChapter && (
                <span className="card-chapter">{item.latestChapter}</span>
              )}
              {item.updateDate && (
                <span className="card-update">🕓 {item.updateDate}</span>
              )}
            </div>
          )}
        </div>
      </Link>

      <div className="card-footer">
        <BookmarkButton meta={meta} />
      </div>
    </div>
  );
}