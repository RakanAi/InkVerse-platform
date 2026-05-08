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

function formatList(values) {
  if (!Array.isArray(values) || !values.length) return "—";
  const visible = values.slice(0, 2).join(", ");
  const hiddenCount = values.length - 2;
  return hiddenCount > 0 ? `${visible} +${hiddenCount}` : visible;
}

function CoverThumb({ src, alt }) {
  const [failed, setFailed] = useState(false);
  const resolved = src ? absUrl(src) : "";

  if (!resolved || failed) {
    return <div className="admin-cover-thumb__placeholder">No cover</div>;
  }

  return <img src={resolved} alt={alt} onError={() => setFailed(true)} />;
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
        <div className="admin-books-toolbar__primary">
          <TextField
            className="admin-search-field admin-books-toolbar__search"
            value={search}
            onChange={(value) => {
              setSearch(value);
              setPageNumber(1);
            }}
            placeholder="Search title or description..."
          />
          <LinkButton to="/admin/books/new" className="admin-books-toolbar__create">
            New book
          </LinkButton>
        </div>

        <div className="admin-books-toolbar__secondary">
          <div className="admin-books-toolbar__filters">
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
              {sortDirectionLabel}
            </Button>
          </div>

          <div className="admin-books-toolbar__summary">
            <span className="admin-books-toolbar__summary-pill">{pageCountLabel}</span>
          </div>
        </div>
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
            width: "28%",
            render: (book) => (
              <div className="admin-book-details">
                <div className="admin-book-details__head">
                  <span className="admin-pill admin-pill--neutral">
                    {book.status ?? book.Status ?? "Unknown"}
                  </span>
                  <span className="admin-book-details__meta">
                    {book.verseType ?? book.VerseType ?? "—"} ·{" "}
                    {book.originType ?? book.OriginType ?? "—"}
                  </span>
                </div>
                <div className="admin-book-details__stack">
                  <p className="admin-book-details__line">
                    <span>Genres</span>
                    <strong>{formatList(book.genres ?? book.Genres ?? [])}</strong>
                  </p>
                  <p className="admin-book-details__line">
                    <span>Tags</span>
                    <strong>{formatList(book.tags ?? book.Tags ?? [])}</strong>
                  </p>
                </div>
              </div>
            ),
          },
          {
            key: "wordCount",
            label: "Words",
            align: "right",
            width: "10%",
            render: (book) => (
              <div className="admin-book-metric">
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
                <div className="admin-book-actions">
                  <LinkButton
                    to={`/admin/books/${id}/chapters`}
                    variant="outline"
                    size="sm"
                    className="admin-book-actions__primary"
                  >
                    Chapters
                  </LinkButton>
                  <LinkButton to={`/admin/books/${id}`} variant="outline" size="sm">
                    Edit
                  </LinkButton>
                  <Button variant="danger" size="sm" onClick={() => remove(id)}>
                    Delete
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
