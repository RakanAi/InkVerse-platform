import { useEffect, useMemo, useState } from "react";
import api from "../../Api/api";
import { absUrl } from "../../Utils/absUrl";
import Button from "../../Shared/ui/Button";
import LinkButton from "../../Shared/ui/LinkButton";
import LoadingState from "../../Shared/ui/LoadingState";
import ErrorState from "../../Shared/ui/ErrorState";
import TextField from "../../Shared/ui/TextField";
import AdminSection from "../../features/admin/components/AdminSection";
import AdminTable from "../../features/admin/components/AdminTable";

function CoverThumb({ src, alt }) {
  const [failed, setFailed] = useState(false);
  const resolved = src ? absUrl(src) : "";

  if (!resolved || failed) {
    return <div className="admin-cover-thumb__placeholder">No cover</div>;
  }

  return <img src={resolved} alt={alt} onError={() => setFailed(true)} />;
}

function formatOriginType(value) {
  if (!value) return "Unknown origin";
  return String(value)
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (char) => char.toUpperCase());
}

export default function AdminBooksPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("CreatedAt");
  const [isAscending, setIsAscending] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);

  const pageSize = 12;
  const pageCountLabel = `${items.length} ${items.length === 1 ? "title" : "titles"} on this page`;
  const sortDirectionLabel = isAscending ? "Ascending" : "Descending";

  const query = useMemo(
    () => ({
      SearchTerm: search,
      SortBy: sortBy,
      IsAscending: isAscending,
      PageNumber: pageNumber,
      PageSize: pageSize,
    }),
    [search, sortBy, isAscending, pageNumber],
  );

  const load = async () => {
    try {
      setLoading(true);
      setErr("");
      const res = await api.get("/books", { params: query });
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error(error);
      setItems([]);
      setErr("Failed to load books.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, sortBy, isAscending, pageNumber]);

  const remove = async (id) => {
    if (!window.confirm("Delete this book?")) return;

    try {
      await api.delete(`/books/${id}`);

      if (items.length === 1 && pageNumber > 1) {
        setPageNumber((value) => value - 1);
      } else {
        await load();
      }
    } catch (error) {
      console.error(error);
      window.alert("Delete failed.");
    }
  };

  if (loading) return <LoadingState text="Loading books..." />;
  if (err) return <ErrorState title="Cannot load books" subtitle={err} onRetry={load} />;

  return (
    <AdminSection flat>
      <div className="admin-books-toolbar">
        <TextField
          className="admin-search-field admin-books-toolbar__search"
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPageNumber(1);
          }}
          placeholder="Search title or description..."
        />

        <div className="admin-books-toolbar__controls">
          <span className="admin-books-toolbar__eyebrow">Sort by</span>
          <select
            className="admin-select admin-books-toolbar__select"
            value={sortBy}
            onChange={(event) => {
              setSortBy(event.target.value);
              setPageNumber(1);
            }}
          >
            <option value="Title">Title</option>
            <option value="CreatedAt">Created at</option>
            <option value="UpdatedAt">Updated at</option>
            <option value="AverageRating">Average rating</option>
            <option value="TotalViews">Total views</option>
          </select>

          <Button
            variant="outline"
            className="admin-books-toolbar__direction"
            onClick={() => {
              setIsAscending((value) => !value);
              setPageNumber(1);
            }}
          >
            <i className={`bi ${isAscending ? "bi-sort-up" : "bi-sort-down"}`} />
            <span>{sortDirectionLabel}</span>
          </Button>
        </div>

        <span className="admin-books-toolbar__summary-pill">{pageCountLabel}</span>

        <LinkButton to="/admin/books/new" className="admin-books-toolbar__create">
          New book
        </LinkButton>
      </div>

      <AdminTable
        className="admin-books-table-shell"
        tableClassName="admin-books-table"
        columns={[
          {
            key: "book",
            label: "Book",
            width: "42%",
            render: (book) => {
              const title = book.title ?? "Untitled";
              const description = book.description ?? "";

              return (
                <div className="admin-book-cell">
                  <div className="admin-cover-thumb">
                    <CoverThumb
                      src={book.coverImageUrl ?? book.CoverImageUrl ?? ""}
                      alt={title}
                    />
                  </div>

                  <div className="admin-simple-stack admin-simple-stack--sm">
                    <p className="admin-row-title">{title}</p>
                    <p className="admin-row-subtitle admin-clamp-3">
                      {description || "No description yet."}
                    </p>
                  </div>
                </div>
              );
            },
          },
          {
            key: "details",
            label: "Details",
            width: "22%",
            render: (book) => {
              const verseType = book.verseType ?? book.VerseType ?? "";
              const rawOriginType = book.originType ?? book.OriginType ?? "";
              const originType = rawOriginType ? formatOriginType(rawOriginType) : "";
              const detailLabel = [verseType, originType].filter(Boolean).join(" / ");

              return (
                <div className="admin-book-details admin-book-details--inline">
                  <span className="admin-pill admin-pill--neutral">
                    {book.status ?? book.Status ?? "Unknown"}
                  </span>
                  <span className="admin-book-details__meta-pill">{detailLabel || "Unknown"}</span>
                </div>
              );
            },
          },
          {
            key: "wordCount",
            label: "Words",
            align: "right",
            width: "10%",
            render: (book) => (
              <div className="admin-book-metric admin-book-metric--inline">
                <strong>{(book.wordCount ?? book.WordCount ?? 0).toLocaleString()}</strong>
                <span>words</span>
              </div>
            ),
          },
          {
            key: "actions",
            label: "Actions",
            align: "right",
            width: "20%",
            render: (book) => {
              const id = book.id ?? book.ID;

              return (
                <div className="admin-book-actions admin-book-actions--inline">
                  <LinkButton
                    to={`/admin/books/${id}/chapters`}
                    variant="outline"
                    size="sm"
                    className="admin-book-action-icon"
                    aria-label="Chapters"
                    title="Chapters"
                  >
                    <i className="bi bi-journals" />
                  </LinkButton>
                  <LinkButton
                    to={`/admin/books/${id}`}
                    variant="outline"
                    size="sm"
                    className="admin-book-action-icon"
                    aria-label="Edit"
                    title="Edit"
                  >
                    <i className="bi bi-pencil-square" />
                  </LinkButton>
                  <Button
                    variant="danger"
                    size="sm"
                    className="admin-book-action-icon"
                    onClick={() => remove(id)}
                    aria-label="Delete"
                    title="Delete"
                  >
                    <i className="bi bi-trash3" />
                  </Button>
                </div>
              );
            },
          },
        ]}
        rows={items}
        rowKey={(book) => book.id ?? book.ID}
        rowClassName="admin-book-row"
        emptyTitle="No books found"
        emptySubtitle="Try another search or create a new title."
        footer={
          <div className="admin-pagination">
            <Button
              variant="outline"
              disabled={pageNumber <= 1}
              onClick={() => setPageNumber((value) => value - 1)}
            >
              Previous
            </Button>
            <span className="admin-page-note">Page {pageNumber}</span>
            <Button
              variant="outline"
              disabled={items.length < pageSize}
              onClick={() => setPageNumber((value) => value + 1)}
            >
              Next
            </Button>
          </div>
        }
      />
    </AdminSection>
  );
}
