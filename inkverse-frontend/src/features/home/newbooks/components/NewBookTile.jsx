import { Link } from "react-router-dom";
import BookCover from "@/Shared/books/BookCover/BookCover";
import { getBookCoverSrc } from "@/domain/books/book-cover";
import { normalizeHomeBookPreview } from "@/features/home/shared/home.models";

export default function NewBookTile({ book }) {
  const preview = normalizeHomeBookPreview(book);

  return (
    <article className="iv-home-book-card">
      <Link to={`/book/${preview.id}`} className="iv-home-book-card__main">
        <div className="iv-home-book-card__coverWrap">
          <BookCover variant="tile" src={getBookCoverSrc(book)} alt={preview.title} />
        </div>

        <div className="iv-home-book-card__meta">
          <div className="iv-home-book-card__title" title={preview.title}>
            {preview.title}
          </div>
        </div>
      </Link>

      {preview.authorId ? (
        <Link to={`/author/${preview.authorId}`} className="iv-home-book-card__author">
          {preview.authorName}
        </Link>
      ) : (
        <div className="iv-home-book-card__author">{preview.authorName}</div>
      )}
    </article>
  );
}
