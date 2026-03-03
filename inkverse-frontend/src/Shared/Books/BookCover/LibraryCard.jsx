import { Link } from "react-router-dom";
import BookCover from "@/Shared/books/BookCover/BookCover";
import DropdownSelect from "@/Shared/ui/DropdownSelect";
import Button from "@/Shared/ui/Button";
import { getBookCoverSrc } from "@/domain/books/book-cover";
import "./LibraryCard.css";

const STATUS_OPTIONS = [
  { value: "Reading", label: "Reading" },
  { value: "Completed", label: "Completed" },
  { value: "Planned", label: "Planned" },
  { value: "Dropped", label: "Dropped" },
];

export default function LibraryCard({ item, onChangeStatus, onRemove }) {
  const bookId = item.bookId ?? item.BookId;
  const title = item.title ?? item.Title ?? "Untitled";
  const status = item.status ?? item.Status ?? "Reading";

  return (
    <div className="iv-lib-card">
      <div className="iv-lib-coverWrap">
        {/* cover (clipped) */}
        <Link to={`/book/${bookId}`} className="iv-lib-coverLink">
          <BookCover variant="tile" src={getBookCoverSrc(item)} alt={title} />
        </Link>

        {/* overlay (NOT clipped, so dropdown can open) */}
        <div
          className="iv-lib-overlay"
          onClick={(e) => e.preventDefault()} // avoid accidental navigation/select issues
        >
          <DropdownSelect
            value={status}
            options={STATUS_OPTIONS}
            onChange={(v) => onChangeStatus(bookId, v)}
            size="sm"
            style={{ width: 160 }}
          />

          <Button
            variant="secondary"
            size="sm"
            className="iv-lib-removeBtn"
            onClick={() => onRemove(bookId)}
            title="Remove"
          >
            ✕
          </Button>
        </div>
      </div>

      <div className="iv-lib-meta text-center ">
        <div className="iv-lib-title" title={title}>
          {title}
        </div>
      </div>
    </div>
  );
}