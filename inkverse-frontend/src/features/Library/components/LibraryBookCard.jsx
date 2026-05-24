import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import DropdownSelect from "@/Shared/ui/DropdownSelect";
import { getLibraryStatusOptions } from "@/features/Library/library.presets";
import BookCover from "@/Shared/Books/BookCover/BookCover";
import "./LibraryBookCard.css";

export default function LibraryBookCard({ item, onChangeStatus, onRemove }) {
  const { t } = useTranslation();
  const bookId = item.bookId;
  const statusOptions = getLibraryStatusOptions(t);

  return (
    <article className="iv-libraryCard">
      <div className="iv-libraryCard__media">
        <Link to={`/book/${bookId}`} className="iv-libraryCard__coverLink">
          <BookCover
            variant="fill"
            src={item.coverImageUrl}
            alt={item.title}
            className="iv-libraryCard__coverMedia"
          />
        </Link>

        <button
          className="iv-libraryCard__remove"
          type="button"
          onClick={(e) => {
            e.preventDefault();
            onRemove(bookId);
          }}
          aria-label={t("common.actions.removeFromLibrary", { title: item.title })}
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
            options={statusOptions}
            onChange={(value) => onChangeStatus(bookId, value)}
            className="iv-libraryCard__select"
          />
          <Link to={`/book/${bookId}`} className="iv-libraryCard__open">
            {t("common.actions.openBook")}
          </Link>
        </div>
      </div>
    </article>
  );
}
