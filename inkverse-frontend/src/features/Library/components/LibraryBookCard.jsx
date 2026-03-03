import { Link } from "react-router-dom";
import BookCover from "@/Shared/Books/BookCover/BookCover";
import { getBookCoverSrc } from "@/domain/books/book-cover";

export default function LibraryBookCard({ item, onChangeStatus, onRemove }) {
  return (
    <div className="lib-card">
      <Link to={`/book/${item.bookId}`} className="lib-cover">
        {item.coverImageUrl ? (
          <BookCover variant="tile" src={getBookCoverSrc(item)} alt={item.title} />
        ) : (
          <div className="lib-noCover">No cover</div>
        )}

        <div className="lib-overlay">
          <select
            className="lib-select"
            value={item.status}
            onChange={(e) => onChangeStatus(item.bookId, e.target.value)}
            onClick={(e) => e.preventDefault()}
          >
            <option value="Reading">Reading</option>
            <option value="Completed">Completed</option>
            <option value="Dropped">Dropped</option>
            <option value="Planned">Planned</option>
          </select>

          <button
            className="lib-remove"
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onRemove(item.bookId);
            }}
            title="Remove"
          >
            ✕
          </button>
        </div>
      </Link>

      <div className="lib-meta">
        <div className="lib-title" title={item.title}>{item.title}</div>
      </div>
    </div>
  );
}