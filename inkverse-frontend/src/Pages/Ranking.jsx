import { useEffect, useMemo, useState, useContext } from "react";
import api from "../Api/api";
import AuthContext from "../Context/AuthProvider";
import BrowseBookCard from "../Componenets/BrowseComp/Parts/BrowseBookCard";
import Pager from "../Componenets/BrowseComp/Parts/Pagination";
import { VERSE_TYPES, normalizeVerseType } from "../Constants/bookEnums";
import { ORIGIN_TYPES } from "../Constants/bookEnums";

const TABS = [
  {
    key: "topRated",
    label: "Top Rated",
    sortBy: "AverageRating",
    isAscending: false,
    // anti-abuse (tweak later)
    minReviewCount: 3,
  },
  {
    key: "mostViewed",
    label: "Most Viewed",
    sortBy: "TotalViews",
    isAscending: false,
  },
  {
    key: "mostReviewed",
    label: "Most Reviewed",
    sortBy: "ReviewsCount",
    isAscending: false,
  },
  {
    key: "new",
    label: "New",
    sortBy: "CreatedAt",
    isAscending: false,
  },
];

const TIME_RANGES = [
  { key: "All", label: "All Time" },
  { key: "Week", label: "This Week" },
  { key: "Month", label: "This Month" },
  { key: "HalfYear", label: "6 Months" },
  { key: "Year", label: "This Year" },
];

export default function Ranking() {
  const [tab, setTab] = useState("topRated");
  const [timeRange, setTimeRange] = useState("All");

  // minimal filters (V1)
  const [verseType, setVerseType] = useState(""); // "" = all
  const [status, setStatus] = useState(""); // "" = all (single select for V1)
  const [originType, setOriginType] = useState("");

  const [data, setData] = useState({
    items: [],
    pageNumber: 1,
    pageSize: 20,
    totalCount: 0,
    totalPages: 0,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Library (bookmark)
  const { auth } = useContext(AuthContext);
  const myUserId = auth?.user?.id;
  const [libraryItems, setLibraryItems] = useState([]);

  const inLib = (bookId) =>
    libraryItems.some((x) => (x.bookId ?? x.book?.id) === bookId);

  const loadLibrary = async () => {
    if (!myUserId) {
      setLibraryItems([]);
      return;
    }
    try {
      const r = await api.get("/me/library");
      setLibraryItems(Array.isArray(r.data) ? r.data : []);
    } catch {
      setLibraryItems([]);
    }
  };

  useEffect(() => {
    loadLibrary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myUserId]);

  const preset = useMemo(
    () => TABS.find((t) => t.key === tab) ?? TABS[0],
    [tab],
  );

  const params = useMemo(() => {
    // V1: use /books/browse
    // Note: your Browse accepts statuses[]; for V1 we pass 0/1 status as array if chosen.
    const p = {
      pageNumber: data.pageNumber ?? 1,
      pageSize: 5,
      sortBy: preset.sortBy,
      isAscending: !!preset.isAscending,
      timeRange,
    };

    if (verseType) p.verseType = verseType;

    if (status) p.statuses = [status]; // backend expects list
    // anti-abuse for Top Rated
    if (preset.minReviewCount != null) p.minReviewCount = preset.minReviewCount;

    return p;
  }, [preset, verseType, status, data.pageNumber]);

  const loadRanked = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await api.get("/books/browse", { params });
      const r = res.data || {};
      const pageSize = r.pageSize ?? 20;
      const totalCount = r.totalCount ?? 0;

      setData({
        ...r,
        items: r.items || [],
        pageSize,
        totalCount,
        totalPages: r.totalPages ?? Math.ceil(totalCount / pageSize),
      });
    } catch (e) {
      console.error(e);
      setError("Failed to load ranking.");
      setData((prev) => ({ ...prev, items: [], totalCount: 0, totalPages: 0 }));
    } finally {
      setLoading(false);
    }
  };

  // Reload when tab/filters/page change
  useEffect(() => {
    loadRanked();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, verseType, status, data.pageNumber]);

  // When changing tab/filters, reset to page 1
  const setTabSafe = (k) => {
    setTab(k);
    setData((p) => ({ ...p, pageNumber: 1 }));
  };
  const setVerseTypeSafe = (v) => {
    setVerseType(v);
    setData((p) => ({ ...p, pageNumber: 1 }));
  };
  const setStatusSafe = (v) => {
    setStatus(v);
    setData((p) => ({ ...p, pageNumber: 1 }));
  };

  const toggleLibrary = async (bookId) => {
    if (!myUserId) return;
    try {
      if (inLib(bookId)) await api.delete(`/books/${bookId}/library`);
      else await api.post(`/books/${bookId}/library`);
      await loadLibrary();
    } catch (e) {
      console.error("toggleLibrary failed", e);
    }
  };

  return (
    <div className="container-fluid py-3" style={{ maxWidth: "1300px" }}>
      <div className="d-flex flex-wrap gap-2 align-items-end justify-content-between mb-3">
        <div>
          <h3 className="m-0">Ranking</h3>
          <div className="text-muted small">
            Discover the best books on InkVerse
          </div>
        </div>

        {/* Minimal V1 filters */}
        <div className="d-flex flex-wrap gap-2 justify-content-center">
          <select
            className="form-select form-select-sm"
            style={{ width: 200 }}
            value={verseType}
            onChange={(e) =>
              setVerseTypeSafe(normalizeVerseType(e.target.value))
            }
          >
            {VERSE_TYPES.map((x) => (
              <option key={x.value || "all"} value={x.value}>
                {x.label}
              </option>
            ))}
          </select>
          <select
            className="form-select form-select-sm"
            style={{ width: 200 }}
            value={originType}
            onChange={(e) => {
              setOriginType(e.target.value);
              setData((p) => ({ ...p, pageNumber: 1 }));
            }}
          >
            {ORIGIN_TYPES.map((x) => (
              <option key={x.value || "all"} value={x.value}>
                {x.label}
              </option>
            ))}
          </select>

          <select
            className="form-select form-select-sm"
            style={{ width: 170 }}
            value={status}
            onChange={(e) => setStatusSafe(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="Ongoing">Ongoing</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>
      {/* Tabs */}
      <div className="d-flex flex-wrap gap-2 mb-3 justify-content-center">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`btn btn-sm ${
              tab === t.key ? "btn-dark" : "btn-outline-dark"
            }`}
            onClick={() => setTabSafe(t.key)}
          >
            {t.label}
          </button>
        ))}
        <div className="d-flex flex-wrap gap-2 mb-3 justify-content-center">
          {TIME_RANGES.map((t) => (
            <button
              key={t.key}
              className={`btn btn-sm ${
                timeRange === t.key ? "btn-dark" : "btn-outline-dark"
              }`}
              onClick={() => {
                setTimeRange(t.key);
                setData((p) => ({ ...p, pageNumber: 1 }));
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <hr />
      {preset.key === "topRated" ? (
        <div className="text-muted small mb-2">
          Showing books with at least {preset.minReviewCount}+ reviews.
        </div>
      ) : null}

      {error ? <div className="alert alert-danger">{error}</div> : null}
      {loading ? <div className="text-muted">Loading…</div> : null}

      {!loading && !error ? (
        <>
          <div className="row g-3 mt-2">
            {(data.items || []).map((b) => (
              <div key={b.id} className="col-12">
                <BrowseBookCard
                  book={b}
                  isBookmarked={inLib(b.id)}
                  onToggleBookmark={(bookObj) => toggleLibrary(bookObj.id)}
                />
              </div>
            ))}
          </div>

          <Pager
            pageNumber={data.pageNumber}
            totalPages={data.totalPages}
            onPage={(p) => setData((prev) => ({ ...prev, pageNumber: p }))}
          />

          {(!data.items || data.items.length === 0) && (
            <div className="text-muted mt-3">No results.</div>
          )}
        </>
      ) : null}
    </div>
  );
}
