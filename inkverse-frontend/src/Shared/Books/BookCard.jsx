import React, { useMemo } from "react";
import { Link } from "react-router-dom";

function clampText(s, max = 180) {
  const t = String(s ?? "");
  if (t.length <= max) return t;
  return t.slice(0, max).trim() + "…";
}

function normalizeList(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.filter(Boolean);
}

export default function BookCard({
  book,
  variant = "list", // list | compact | rank
  rank, // number (for rank variant)
  isBookmarked = false,
  onToggleBookmark,
  onPickTag,
  onPickGenre,
  showActions = true,
  showStats = true,
}) {
  const id = book?.id;
  const title = book?.title ?? "Untitled";
  const author = book?.authorName ?? book?.author?.userName ?? book?.author ?? "";
  const cover = book?.coverImageUrl || book?.cover || book?.imageUrl || "";
  const desc = book?.description ?? book?.summary ?? "";
  const rating = book?.averageRating ?? book?.rating ?? null;
  const reviews = book?.reviewCount ?? null;
  const views = book?.totalViews ?? null;
  const chapters = book?.chapterCount ?? null;
  const status = book?.status ?? "";
  const verseType = book?.verseType ?? "";
  const originType = book?.originType ?? "";

  // support either arrays of strings or arrays of objects
  const tags = useMemo(() => {
    const raw = book?.tags ?? [];
    return normalizeList(raw).map((t) => (typeof t === "string" ? t : t?.name)).filter(Boolean);
  }, [book]);

  const genres = useMemo(() => {
    const raw = book?.genres ?? [];
    return normalizeList(raw).map((g) => (typeof g === "string" ? g : g?.name)).filter(Boolean);
  }, [book]);

  const href = id ? `/books/${id}` : "#";

  return (
    <div className={`iv-book iv-book-${variant}`}>
      {variant === "rank" && (
        <div className="iv-book-rank">
          <div className="iv-rank-pill">#{rank ?? ""}</div>
        </div>
      )}

      <Link to={href} className="iv-book-cover">
        {cover ? (
          <img src={cover} alt={title} loading="lazy" />
        ) : (
          <div className="iv-book-cover-fallback">INK</div>
        )}
      </Link>

      <div className="iv-book-body">
        <div className="iv-book-top">
          <div className="iv-book-titlewrap">
            <Link to={href} className="iv-book-title">
              {title}
            </Link>

            <div className="iv-book-sub">
              {author ? <span className="iv-book-author">by {author}</span> : null}
              {(status || verseType || originType) ? (
                <span className="iv-book-badges">
                  {status ? <span className="iv-badge">{status}</span> : null}
                  {verseType ? <span className="iv-badge iv-badge-soft">{verseType}</span> : null}
                  {originType ? <span className="iv-badge iv-badge-soft">{originType}</span> : null}
                </span>
              ) : null}
            </div>
          </div>

          {showActions && (
            <div className="iv-book-actions">
              {onToggleBookmark && (
                <button
                  type="button"
                  className={`iv-iconbtn ${isBookmarked ? "is-active" : ""}`}
                  title={isBookmarked ? "Remove from library" : "Add to library"}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onToggleBookmark(book);
                  }}
                >
                  {isBookmarked ? "★" : "☆"}
                </button>
              )}
            </div>
          )}
        </div>

        {variant !== "compact" && desc ? (
          <div className="iv-book-desc">{clampText(desc, 190)}</div>
        ) : null}

        {showStats && (rating != null || reviews != null || views != null || chapters != null) ? (
          <div className="iv-book-stats">
            {rating != null ? <span>⭐ {Number(rating).toFixed(1)}</span> : null}
            {reviews != null ? <span>💬 {reviews}</span> : null}
            {views != null ? <span>👁️ {views}</span> : null}
            {chapters != null ? <span>📚 {chapters}</span> : null}
          </div>
        ) : null}

        {(genres?.length > 0 || tags?.length > 0) && (
          <div className="iv-book-chips">
            {genres.slice(0, variant === "compact" ? 2 : 3).map((g) => (
              <button
                key={`g-${g}`}
                type="button"
                className="iv-mini-chip"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onPickGenre?.(g);
                }}
                title="Filter by genre"
              >
                {g}
              </button>
            ))}

            {tags.slice(0, variant === "compact" ? 2 : 4).map((t) => (
              <button
                key={`t-${t}`}
                type="button"
                className="iv-mini-chip iv-mini-chip-soft"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onPickTag?.(t);
                }}
                title="Filter by tag"
              >
                {t}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}