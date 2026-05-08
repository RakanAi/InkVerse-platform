import { Link } from "react-router-dom";
import "./BrowseBookCard.css";
import BookCover from "@/Shared/books/BookCover/BookCover";
import { getBookCoverSrc } from "@/domain/books/book-cover";

function formatNumber(n) {
  const value = Number(n || 0);

  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  }

  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  }

  return String(value);
}

export default function BrowseBookCard({
  book,
  isBookmarked,
  onToggleBookmark,
}) {
  const id = book.id ?? book.Id;
  const title = book.title ?? book.Title ?? "Untitled";
  const authorName = book.authorName ?? book.AuthorName ?? "Unknown";
  const description = book.description ?? book.Description ?? "No description yet.";
  const status = book.status ?? book.Status ?? "";
  const verseType = book.verseType ?? book.VerseType ?? "Verse";
  const originType = book.originType ?? book.OriginType ?? "";
  const rating = Number(
    book.averageRating ?? book.rating ?? book.AverageRating ?? book.Rating ?? 0,
  ).toFixed(2);
  const reviewsCount = formatNumber(book.reviewsCount ?? book.ReviewsCount ?? 0);
  const chaptersCount = formatNumber(book.chaptersCount ?? book.ChaptersCount ?? 0);
  const bookUrl = `/book/${id}`;

  return (
    <article className={`iv-browse-card iv-status-${status.toLowerCase() || "none"}`}>
      <Link to={bookUrl} className="iv-browse-cover">
        <BookCover variant="fill" src={getBookCoverSrc(book)} alt={title} />
      </Link>

      <div className="iv-browse-body">
        <div className="iv-browse-head">
          <div className="iv-browse-head__meta">
            <span className="iv-browse-kicker">{verseType}</span>
            {status ? <span className="iv-browse-status">{status}</span> : null}
          </div>

          <button
            className="iv-browse-bookmark"
            type="button"
            onClick={() => onToggleBookmark?.(book)}
            title={isBookmarked ? "Remove from bookmarks" : "Add to bookmarks"}
          >
            <i className={`bi ${isBookmarked ? "bi-bookmark-fill" : "bi-bookmark"}`} />
          </button>
        </div>

        <Link to={bookUrl} className="iv-browse-title" title={title}>
          {title}
        </Link>

        <div className="iv-browse-author">
          by <span>{authorName}</span>
          {originType ? <em className="iv-browse-origin"> · {originType}</em> : null}
        </div>

        <p className="iv-browse-desc" title={description}>
          {description}
        </p>

        <div className="iv-browse-meta">
          <div className="iv-browse-leftmeta">
            <span className="iv-browse-star">★</span>
            <span className="iv-browse-rating">{rating}</span>
            <span className="iv-browse-dot">•</span>
            <span className="iv-browse-metric">{reviewsCount} reviews</span>
            <span className="iv-browse-dot">•</span>
            <span className="iv-browse-metric">{chaptersCount} chapters</span>
          </div>

          <Link to={bookUrl} className="iv-browse-open">
            Open story
          </Link>
        </div>
      </div>
    </article>
  );
}
