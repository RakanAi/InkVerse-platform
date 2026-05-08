import { Link } from "react-router-dom";
import BookCover from "@/Shared/books/BookCover/BookCover";
import { getBookCoverSrc } from "@/domain/books/book-cover";
import "./RankingEntryCard.css";

function formatNumber(value) {
  const n = Number(value || 0);

  if (n >= 1_000_000) {
    return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  }

  if (n >= 1_000) {
    return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  }

  return String(n);
}

function formatOrigin(originType) {
  switch (originType) {
    case "PlatformOriginal":
      return "InkVerse Original";
    case "AlternateUniverse":
      return "AU";
    default:
      return originType || "";
  }
}

export default function RankingEntryCard({
  book,
  rank,
  metric,
  featured = false,
  isBookmarked = false,
  onToggleBookmark,
}) {
  const id = book.id ?? book.Id;
  const title = book.title ?? book.Title ?? "Untitled";
  const authorName = book.authorName ?? book.AuthorName ?? "Unknown";
  const description = book.description ?? book.Description ?? "No description yet.";
  const status = book.status ?? book.Status ?? "";
  const verseType = book.verseType ?? book.VerseType ?? "Verse";
  const originType = formatOrigin(book.originType ?? book.OriginType ?? "");
  const rating = Number(
    book.averageRating ?? book.rating ?? book.AverageRating ?? book.Rating ?? 0,
  ).toFixed(2);
  const reviewsCount = formatNumber(book.reviewsCount ?? book.ReviewsCount ?? 0);
  const chaptersCount = formatNumber(book.chaptersCount ?? book.ChaptersCount ?? 0);
  const totalViews = formatNumber(book.totalViews ?? book.TotalViews ?? 0);
  const bookUrl = `/book/${id}`;
  const rankTone =
    rank === 1 ? "gold" : rank === 2 ? "silver" : rank === 3 ? "bronze" : "standard";

  return (
    <article
      className={`iv-ranking-entry iv-ranking-entry--${rankTone} ${
        featured ? "is-featured" : ""
      }`}
    >
      <div className="iv-ranking-entry__rankRail">
        <span className="iv-ranking-entry__rankLabel">{featured ? "Spotlight" : "Rank"}</span>
        <span className="iv-ranking-entry__rankNumber">#{rank}</span>
      </div>

      <Link to={bookUrl} className="iv-ranking-entry__cover">
        <BookCover variant="fill" src={getBookCoverSrc(book)} alt={title} />
      </Link>

      <div className="iv-ranking-entry__body">
        <div className="iv-ranking-entry__head">
          <div className="iv-ranking-entry__pills">
            <span className="iv-ranking-entry__pill iv-ranking-entry__pill--verse">
              {verseType}
            </span>
            {status ? (
              <span className="iv-ranking-entry__pill iv-ranking-entry__pill--status">
                {status}
              </span>
            ) : null}
          </div>

          <button
            className="iv-ranking-entry__bookmark"
            type="button"
            onClick={() => onToggleBookmark?.(book)}
            title={isBookmarked ? "Remove from bookmarks" : "Add to bookmarks"}
          >
            <i className={`bi ${isBookmarked ? "bi-bookmark-fill" : "bi-bookmark"}`} />
          </button>
        </div>

        <Link to={bookUrl} className="iv-ranking-entry__title" title={title}>
          {title}
        </Link>

        <div className="iv-ranking-entry__author">
          by <span>{authorName}</span>
          {originType ? <em className="iv-ranking-entry__origin"> · {originType}</em> : null}
        </div>

        <p className="iv-ranking-entry__desc" title={description}>
          {description}
        </p>

        <div className="iv-ranking-entry__footer">
          <div className="iv-ranking-entry__metric">
            <span className="iv-ranking-entry__metricLabel">{metric?.label ?? "Leader signal"}</span>
            <strong className="iv-ranking-entry__metricValue">
              {metric?.value ?? `${rating} rating`}
            </strong>
          </div>

          <div className="iv-ranking-entry__stats">
            <span className="iv-ranking-entry__statHighlight">★ {rating}</span>
            <span>{reviewsCount} reviews</span>
            <span>{chaptersCount} chapters</span>
            <span>{totalViews} views</span>
          </div>

          <Link to={bookUrl} className="iv-ranking-entry__cta">
            Open story
          </Link>
        </div>
      </div>
    </article>
  );
}
