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
  isLoggedIn?: boolean;
}

export default function MangaCard({ item, rank, isLoggedIn = true }: MangaCardProps) {
  const slug = item.slug || item.endpoint?.split("/").filter(Boolean).pop() || "";
  const typeInfo = getComicFlag(item.type);
  const meta = { slug, title: item.title || slug, image: item.image || item.thumbnail, type: item.type };
  const isVip = Boolean(item.isVip);
  const isLocked = false; // All content open like home page

  return (
    <div className={`card${isVip ? " card-vip" : ""}`}>
      {/* VIP label badge — always visible */}
      {isVip && (
        <div className="vip-label-badge">
          👑 VIP
        </div>
      )}

      <Link
        href={isLocked ? "/account" : `/manga/${slug}`}
        className="card-link"
        title={isLocked ? "Login untuk membuka konten VIP" : (item.title || slug)}
      >
        <div className="card-cover-wrap">
          {item.image || item.thumbnail ? (
            <img
              className={`cover${isLocked ? " cover-blurred" : ""}`}
              src={item.image || item.thumbnail}
              alt={isLocked ? "Konten VIP" : item.title}
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="cover cover-placeholder">📖</div>
          )}
          <span className={`card-flag-badge ${typeInfo.cls}`}>{typeInfo.full}</span>
          {rank !== undefined && rank <= 2 && (
            <span className="card-rank-badge">#{rank + 1}</span>
          )}

          {/* Lock overlay for VIP when not logged in */}
          {isLocked && (
            <div className="vip-lock-overlay">
              <div className="vip-lock-content">
                <div className="vip-lock-icon">🔒</div>
                <div className="vip-lock-text">Konten VIP</div>
                <div className="vip-lock-sub">Login untuk akses</div>
              </div>
            </div>
          )}
        </div>

        <div className="cardbody">
          <div className={`card-title${isLocked ? " text-blurred" : ""}`}>
            {isLocked ? "▓▓▓▓▓▓▓▓▓▓" : (item.title || slug)}
          </div>
          {!isLocked && (item.latestChapter || item.updateDate) && (
            <div className="card-meta-row">
              {item.latestChapter && (
                <span className="card-chapter">{item.latestChapter}</span>
              )}
              {item.updateDate && (
                <span className="card-update">🕓 {item.updateDate}</span>
              )}
            </div>
          )}
          {isLocked && (
            <div className="card-meta-row">
              <span className="vip-locked-cta">🔑 Login untuk baca</span>
            </div>
          )}
        </div>
      </Link>

      {!isLocked && (
        <div className="card-footer">
          <BookmarkButton meta={meta} />
        </div>
      )}
      {isLocked && (
        <div className="card-footer">
          <Link href="/account" className="vip-unlock-btn">
            🔓 Buka Akses VIP
          </Link>
        </div>
      )}
    </div>
  );
}