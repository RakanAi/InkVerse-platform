import { Link } from "react-router-dom";
import DropdownSelect from "@/Shared/ui/DropdownSelect";
import { LIBRARY_STATUS_OPTIONS } from "@/features/Library/library.presets";
import "./LibraryBookCard.css";

export default function LibraryBookCard({ item, onChangeStatus, onRemove }) {
  const bookId = item.bookId;

  return (
    <article className="iv-libraryCard">
      <div className="iv-libraryCard__media">
        <Link to={`/book/${bookId}`} className="iv-libraryCard__coverLink">
          <img src={item.coverImageUrl} alt={item.title} className="iv-libraryCard__coverImg" />
        </Link>

        <button
          className="iv-libraryCard__remove"
          type="button"
          onClick={(e) => {
            e.preventDefault();
            onRemove(bookId);
          }}
          aria-label={`Remove ${item.title} from library`}
        >
          <i className="bi bi-x-lg" />
        </button>
      </div>

      <div className="iv-libraryCard__body">
        <h3 className="iv-libraryCard__title">
          <Link to={`/book/${bookId}`}>{item.title}</Link>
        </h3>

        <div className="iv-libraryCard__actions">
          <DropdownSelect
            value={item.status}
            options={LIBRARY_STATUS_OPTIONS}
            onChange={(value) => onChangeStatus(bookId, value)}
            className="iv-libraryCard__select"
          />
          <Link to={`/book/${bookId}`} className="iv-libraryCard__open">
            Open book
          </Link>
        </div>
      </div>
    </article>
  );
}
