import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../Api/api";
import { absUrl } from "../../Utils/absUrl";

export default function AdminBooksPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("CreatedAt");
  const [isAscending, setIsAscending] = useState(false);

  const [pageNumber, setPageNumber] = useState(1);
  const pageSize = 12;

  const query = useMemo(
    () => ({
      SearchTerm: search,
      SortBy: sortBy,
      IsAscending: isAscending,
      PageNumber: pageNumber,
      PageSize: pageSize,
    }),
    [search, sortBy, isAscending, pageNumber]
  );

  const load = async () => {
    try {
      setLoading(true);
      setErr("");
      const res = await api.get("/books", { params: query });
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error(e);
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

  const toggleSort = (field) => {
    if (sortBy === field) setIsAscending((v) => !v);
    else {
      setSortBy(field);
      setIsAscending(true);
    }
    setPageNumber(1);
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this book?")) return;

    try {
      await api.delete(`/books/${id}`);

      if (items.length === 1 && pageNumber > 1) {
        setPageNumber((p) => p - 1);
      } else {
        await load();
      }
    } catch (e) {
      console.error(e);
      alert("Delete failed (are you Admin?)");
    }
  };

  const vtLabel = (b) => b.verseType ?? b.VerseType ?? "-";
  const otLabel = (b) => b.originType ?? b.OriginType ?? "-";
  const statusLabel = (b) => b.status ?? b.Status ?? "-";
  const cover = (b) => b.coverImageUrl ?? b.CoverImageUrl ?? "";

  return (
    <div className="border rounded p-3">
      <div className="d-flex justify-content-between align-items-center gap-2 flex-wrap">
        <h4 className="mb-0">Admin: Books</h4>
        <Link className="btn btn-primary" to="/admin/books/new">
          + New Book
        </Link>
      </div>

      <div className="d-flex gap-2 mt-3 flex-wrap">
        <input
          className="form-control"
          style={{ maxWidth: 320 }}
          placeholder="Search title/description..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPageNumber(1);
          }}
        />

        <select
          className="form-select"
          style={{ maxWidth: 220 }}
          value={sortBy}
          onChange={(e) => {
            setSortBy(e.target.value);
            setPageNumber(1);
          }}
        >
          <option value="Title">Title</option>
          <option value="CreatedAt">CreatedAt</option>
          <option value="AverageRating">AverageRating</option>
          <option value="UpdatedAt">UpdatedAt</option>
          <option value="TotalViews">TotalViews</option>
        </select>

        <button
          className="btn btn-outline-secondary"
          type="button"
          onClick={() => setIsAscending((v) => !v)}
        >
          {isAscending ? "Asc" : "Desc"}
        </button>
      </div>

      {loading ? <p className="text-muted mt-3">Loading...</p> : null}
      {err ? <p className="text-danger mt-3">{err}</p> : null}

      {!loading && !err && (
        <>
          <div className="table-responsive mt-3">
            <table className="table table-sm align-middle">
              <thead>
                <tr>
                  <th style={{ width: 64 }}>Cover</th>
                  <th>Status</th>
                  <th>Verse</th>
                  <th>Origin</th>
                  <th role="button" onClick={() => toggleSort("Title")}>
                    Title
                  </th>
                  <th>WordCount</th>
                  <th>Genres</th>
                  <th>Tags</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>

              <tbody>
                {items.map((b) => (
                  <tr key={b.id ?? b.ID}>
                    <td>
                      {cover(b) ? (
                        <img
                          src={absUrl(cover(b))}
                          alt={b.title ?? "cover"}
                          style={{
                            width: 46,
                            height: 62,
                            objectFit: "cover",
                            borderRadius: 6,
                            border: "1px solid rgba(0,0,0,.12)",
                          }}
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <div
                          className="text-muted"
                          style={{
                            width: 46,
                            height: 62,
                            borderRadius: 6,
                            border: "1px dashed rgba(0,0,0,.2)",
                            display: "grid",
                            placeItems: "center",
                            fontSize: 12,
                          }}
                        >
                          —
                        </div>
                      )}
                    </td>

                    <td>{statusLabel(b)}</td>
                    <td>{vtLabel(b)}</td>
                    <td>{otLabel(b)}</td>

                    <td
                      style={{ maxWidth: 260 }}
                      className="text-truncate"
                      title={b.title}
                    >
                      {b.title}
                    </td>

                    <td className="text-muted">{b.wordCount ?? b.WordCount ?? 0}</td>

                    <td style={{ maxWidth: 220 }} className="text-truncate">
                      {(b.genres ?? b.Genres ?? []).join(", ")}
                    </td>

                    <td style={{ maxWidth: 220 }} className="text-truncate">
                      {(b.tags ?? b.Tags ?? []).join(", ")}
                    </td>

                    <td className="text-end">
                      <Link
                        className="btn btn-sm btn-outline-secondary me-2"
                        to={`/admin/books/${b.id ?? b.ID}/chapters`}
                      >
                        Chapters
                      </Link>

                      <Link
                        className="btn btn-sm btn-outline-primary me-2"
                        to={`/admin/books/${b.id ?? b.ID}`}
                      >
                        Edit
                      </Link>

                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => remove(b.id ?? b.ID)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}

                {!items.length && (
                  <tr>
                    <td colSpan={9} className="text-muted">
                      No books found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="d-flex justify-content-between align-items-center mt-2">
            <button
              className="btn btn-outline-secondary"
              disabled={pageNumber <= 1}
              onClick={() => setPageNumber((p) => p - 1)}
            >
              Prev
            </button>

            <div className="text-muted small">Page {pageNumber}</div>

            <button
              className="btn btn-outline-secondary"
              disabled={items.length < pageSize}
              onClick={() => setPageNumber((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
