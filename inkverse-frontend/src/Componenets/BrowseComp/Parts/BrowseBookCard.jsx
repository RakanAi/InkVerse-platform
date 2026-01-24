import { Link } from "react-router-dom";
import "./BrowseBookCard.css";
import { absUrl } from "../../../Utils/absUrl";

function formatNumber(n) {
  const x = Number(n || 0);
  if (x >= 1_000_000)
    return (x / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (x >= 1_000) return (x / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(x);
}

export default function BrowseBookCard({
  book,
  isBookmarked,
  onToggleBookmark,
  onPickTag,
  onPickGenre,
}) {
  const bookUrl = `/book/${book.id}`; // ✅ adjust if your route is /book/:id

  return (
<div className="iv-browse-card d-flex gap-2 shadow-sm rounded-4 p-2">
      {/* ✅ Clicking cover navigates */}
      <Link to={bookUrl} className="iv-browse-cover">
        <img
          src={absUrl(book.coverImageUrl) || "/placeholder-cover.png"}
          alt={book.title}
          loading="lazy"
        />
      </Link>

      <div className="iv-browse-body ">
        <div className="iv-browse-tags">
          {(book.tags || []).slice(0, 3).map((name) => (
            <span
              key={`t-${name}`}
              type="button"
              className="iv-browse-tag"
              onClick={(e) => {
                e.preventDefault();
                onPickTag?.(name);
              }}
            >
              #{name}
            </span>
          ))}
          {(book.genres || []).slice(0, 2).map((name) => (
            <span
              key={`g-${name}`}
              type="button"
              className="iv-browse-genre"
              onClick={(e) => {
                e.preventDefault();
                onPickGenre?.(name);
              }}
            >
              #{name}
            </span>
          ))}
        </div>

        {/* ✅ Clicking title navigates */}
        <Link
          to={bookUrl}
          className="iv-browse-title text-start"
          title={book.title}
        >
          {book.title}
        </Link>
        <div className="iv-browse-author text-start">
          by <span>{book.authorName || "Unknown"}</span>
        </div>

        <div className="iv-browse-desc text-start overflow ">
          {book.description || "No description yet."}
        </div>

        <div className="iv-browse-meta">
          <div className="iv-browse-leftmeta">
            <span className="iv-browse-star">★</span>
            <span className="iv-browse-rating">
              {Number(
                book.averageRating ??
                  book.rating ??
                  book.AverageRating ??
                  book.Rating ??
                  0,
              ).toFixed(2)}
            </span>

            <span className="iv-browse-dot">•</span>
            <span className="iv-browse-icon">💬</span>
            <span className="iv-browse-chapters">
              {formatNumber(book.reviewsCount ?? 0)} Reviews
            </span>

            <span className="iv-browse-dot">•</span>
            <span className="iv-browse-icon">📚</span>
            <span className="iv-browse-chapters">
              {formatNumber(book.chaptersCount ?? 0)} Chapters
            </span>
          </div>

          <button
            className="iv-browse-bookmark"
            type="button"
            onClick={() => onToggleBookmark?.(book)}
            title={isBookmarked ? "Remove from bookmarks" : "Add to bookmarks"}
          >
            <i
              className={`bi ${isBookmarked ? "bi-bookmark-fill" : "bi-bookmark"}`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
