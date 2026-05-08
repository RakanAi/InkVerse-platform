import { Link } from "react-router-dom";
import Surface from "@/Shared/ui/Surface";
import LoadingState from "@/Shared/ui/LoadingState";
import EmptyState from "@/Shared/ui/EmptyState";
import BookCover from "@/Shared/books/BookCover/BookCover";
import { getBookCoverSrc } from "@/domain/books/book-cover";
import { normalizeHomeBookPreview } from "@/features/home/shared/home.models";

export default function TopBooksColumn({ title, items, loading, ctaLabel }) {
  return (
    <div className="iv-top-col">
      <Surface className="iv-top-card">
        <div className="iv-top-head">
          <p className="m-0 text-start iv-top-label">{title}</p>
        </div>

        {loading ? (
          <div className="p-2">
            <LoadingState text="Loading…" />
          </div>
        ) : !items?.length ? (
          <div className="p-2">
            <EmptyState title="No books yet." />
          </div>
        ) : (
          <ul className="iv-top-list">
            {items.map((item, index) => {
              const book = normalizeHomeBookPreview(item);

              return (
                <li key={book.id ?? index} className="iv-top-item">
                  <Link to={`/book/${book.id}`} className="iv-top-cover">
                    <BookCover
                      variant="tile"
                      src={getBookCoverSrc(item)}
                      alt={book.title}
                    />
                  </Link>

                  <div className="iv-top-meta">
                    <div className="iv-top-row">
                      <span className="iv-top-rank">#{index + 1}</span>
                      <Link
                        to={`/book/${book.id}`}
                        className="iv-top-title"
                        title={book.title}
                      >
                        {book.title}
                      </Link>
                    </div>

                    <div className="iv-top-sub text-start">{book.authorName || "—"}</div>

                    <div className="iv-top-stats text-start">
                      ⭐ {book.averageRating != null ? book.averageRating.toFixed(1) : "N/A"}
                      <span className="iv-top-dot">•</span>
                      <span>{book.totalViews} views</span>
                    </div>
                  </div>

                  <span className="iv-top-status">{book.status}</span>
                </li>
              );
            })}
          </ul>
        )}

        <div className="text-end mt-2">
          <Link className="iv-top-link" to="/Browser">
            {ctaLabel}
          </Link>
        </div>
      </Surface>
    </div>
  );
}
