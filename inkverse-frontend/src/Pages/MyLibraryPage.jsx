import { useEffect, useState } from "react";
import api from "../Api/api";
import { Link } from "react-router-dom";
import "./MyLibraryPage.css";
import LibraryButton from "../Componenets/Library/AddToLibraryBtn";
import { absUrl } from "../Utils/absUrl";

export default function MyLibrary({ initialFilter = "All", hideTabs = false }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(initialFilter);

  const inLib = (b) => b?.isInLibrary ?? b?.IsInLibrary;
  const lastRead = (b) => b?.lastReadAt ?? b?.LastReadAt;
  const statusOf = (b) => b?.status ?? b?.Status;
  const tabs = [
    { key: "All", label: "All", icon: "bi-collection" },
    { key: "Reading", label: "Reading", icon: "bi-book" },
    { key: "Completed", label: "Finished", icon: "bi-check2-circle" },
    { key: "Planned", label: "Planning", icon: "bi-bookmark" },
    { key: "Dropped", label: "Dropped", icon: "bi-x-circle" },
    { key: "History", label: "History", icon: "bi-clock-history" },
  ];

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/me/library");
      console.log("library:", res.data);
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error("Load library failed:", e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const changeStatus = async (bookId, status) => {
    await api.put(`/books/${bookId}/library/status`, { status });
    await load();
  };

  const remove = async (bookId) => {
    await api.delete(`/books/${bookId}/library`);
    await load();
  };

  if (loading) return <p className="text-muted">Loading...</p>;

  const filteredItems =
    filter === "All"
      ? items.filter(inLib)
      : filter === "History"
        ? items.filter((b) => !!lastRead(b))
        : items.filter((b) => inLib(b) && statusOf(b) === filter);

  console.log("first item:", items[0]);
  console.log(
    items.map((x) => ({
      id: x.bookId,
      inLib: inLib(x),
      lastReadAt: lastRead(x),
      status: statusOf(x),
    })),
  );

  const visibleItems =
    filter === "History"
      ? [...filteredItems].sort(
          (a, b) => new Date(lastRead(b) || 0) - new Date(lastRead(a) || 0),
        )
      : filteredItems;

  return (
    <div className="container py-3">
      <h4 className="mb-3">My Library</h4>

      <div className="text-muted small mb-2">
        items: {items.length} | showing: {filteredItems.length} | filter:{" "}
        {filter}
      </div>

      {!hideTabs && (
        <div className="iv-tabs mb-3 justify-content-evenly">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              className={"iv-tab " + (filter === t.key ? "active" : "")}
              onClick={() => setFilter(t.key)}
            >
              <i className={`bi ${t.icon} me-2`} />
              {t.label}
              <span className="iv-underline" />
            </button>
          ))}
        </div>
      )}

      {!visibleItems.length ? (
        <p className="text-muted">
          {" "}
          {filter === "History"
            ? "No reading history yet."
            : "Your library is empty."}
        </p>
      ) : (
        <div className="row g-3">
          {visibleItems.map((b) => (
            <div key={b.bookId} className="col-6 col-md-3 d-flex">
              <div className="lib-card">
                <Link to={`/book/${b.bookId}`} className="lib-cover">
                  {b.coverImageUrl || b.CoverImageUrl ? (
                    <img
                      src={absUrl(b.coverImageUrl || b.CoverImageUrl)}
                      alt={b.title}
                      loading="lazy"
                    />
                  ) : (
                    <div className="lib-noCover">No cover</div>
                  )}
                  {/* overlay actions */}
                  {inLib(b) && (
                    <div className="lib-overlay">
                      {" "}
                      <select
                        className="lib-select"
                        value={b.status ?? b.Status ?? "Reading"}
                        onChange={(e) => changeStatus(b.bookId, e.target.value)}
                        onClick={(e) => e.preventDefault()} // so it doesn't trigger Link click
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
                          e.preventDefault(); // prevent navigation
                          remove(b.bookId);
                        }}
                        title="Remove"
                      >
                        ✕
                      </button>
                    </div>
                  )}{" "}
                </Link>

                <div className="lib-meta">
                  <div className="lib-title" title={b.title}>
                    {b.title}
                  </div>
                  {!inLib(b) && (
                    <div className="mt-2 btn btn-dark" style={{ top: "" }}>
                      <LibraryButton bookId={b.bookId} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
