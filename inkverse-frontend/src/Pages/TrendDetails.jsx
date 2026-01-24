import { useEffect, useState, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../Api/api";
import AuthContext from "../Context/AuthProvider";
import BrowseBookCard from "../Componenets/BrowseComp/Parts/BrowseBookCard";
import Pager from "../Componenets/BrowseComp/Parts/Pagination";

export default function TrendDetails() {
  const { id } = useParams();
  const trendId = Number(id);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [trend, setTrend] = useState("");

  // Sorting (server-side via /books/browse)
  const [sortBy, setSortBy] = useState("newest"); // newest | rating | views | az

  // Pagination (server-side)
  const [pageNumber, setPageNumber] = useState(1);
  const pageSize = 24;

  const [data, setData] = useState({
    items: [],
    pageNumber: 1,
    pageSize,
    totalCount: 0,
    totalPages: 0,
  });

  // Library (bookmark)
  const { auth } = useContext(AuthContext);
  const myUserId = auth?.user?.id;

  const [libraryItems, setLibraryItems] = useState([]);
  const inLib = (bookId) =>
    libraryItems.some((x) => (x.bookId ?? x.book?.id) === bookId);

  const loadTrend = async () => {
  try {
    const res = await api.get("/trends");
    const list = Array.isArray(res.data) ? res.data : [];
    const found =
      list.find((t) => Number(t.id ?? t.ID) === trendId) || null;
    setTrend(found);
  } catch (e) {
    console.error("Failed to load trend", e);
    setTrend(null);
  }
};

useEffect(() => {
  if (!trendId || Number.isNaN(trendId)) {
    setError("Invalid trend id.");
    setLoading(false);
    return;
  }
  loadTrend();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [trendId]);

useEffect(() => {
  if (!trendId || Number.isNaN(trendId)) return;
  loadBooks();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [trendId, pageNumber, sortBy]);

  const loadLibrary = async () => {
    if (!myUserId) {
      setLibraryItems([]);
      return;
    }
    try {
      const res = await api.get("/me/library");
      setLibraryItems(Array.isArray(res.data) ? res.data : []);
    } catch {
      setLibraryItems([]);
    }
  };

  const loadBooks = async () => {
    try {
      setLoading(true);
      setError("");

      const sortKey =
        sortBy === "newest"
          ? "CreatedAt"
          : sortBy === "rating"
          ? "AverageRating"
          : sortBy === "views"
          ? "TotalViews"
          : "Title";

      const res = await api.get("/books/browse", {
        params: {
          trendId,
          pageNumber,
          pageSize,
          sortBy: sortKey,
          isAscending: sortBy === "az",
          // Optional: keep verseType empty so it doesn't filter
          // verseType: "",
        },
      });

      const r = res.data || {};
      const pageSizeRes = r.pageSize ?? pageSize;
      const totalCount = r.totalCount ?? 0;

      setData({
        ...r,
        items: r.items || [],
        pageSize: pageSizeRes,
        totalCount,
        totalPages: r.totalPages ?? Math.ceil(totalCount / pageSizeRes),
      });
    } catch (e) {
      console.error(e);
      setData({
        items: [],
        pageNumber: 1,
        pageSize,
        totalCount: 0,
        totalPages: 0,
      });
      setError("Failed to load trend books.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!trendId || Number.isNaN(trendId)) {
      setError("Invalid trend id.");
      setLoading(false);
      return;
    }
    loadBooks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trendId, pageNumber, sortBy]);

  useEffect(() => {
    loadLibrary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myUserId]);

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

  const items = data.items || [];

  return (
    <div className="container py-3" style={{textAlign:"center"}}>
      <div className="d-flex flex-wrap gap-2 align-items-end justify-content-between mb-3">
        <div className="m-auto" style={{maxWidth:"1000px"}}>
          <h3 className="m-0">Trend: {trend?.name ||"_"}</h3>
          <div className="" style={{overflow:"hidden", height:"auto", wordBreak:"break-all", overflowY:"scroll", scrollbarWidth:"none"}}>Discription:{trend?.description || "Nothing to Read here Kid..."} </div>
        </div>

        <div className="d-flex gap-2 align-items-center">
          <select
            className="form-select form-select-sm"
            style={{ width: 200 }}
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setPageNumber(1);
            }}
          >
            <option value="newest">Newest</option>
            <option value="rating">Top Rated</option>
            <option value="views">Most Viewed</option>
            <option value="az">A → Z</option>
          </select>

          <Link className="btn btn-outline-secondary btn-sm" to="/trend">
            Back
          </Link>
        </div>
      </div>
      <hr />

      {loading ? (
        <div className="text-muted">Loading…</div>
      ) : error ? (
        <div className="alert alert-warning">{error}</div>
      ) : items.length === 0 ? (
        <div className="text-muted">No books linked yet.</div>
      ) : (
        <>
          <div className="row g-3">
                      <div className="text-muted small">Books linked to this TREND</div>

            {items.map((b) => (
              <div className="col-12 col-lg-6 d-flex" key={b.id}>
                <BrowseBookCard
                  book={b}
                  isBookmarked={inLib(b.id)}
                  onToggleBookmark={() => toggleLibrary(b.id)}
                />
              </div>
            ))}
          </div>

          <Pager
            pageNumber={data.pageNumber}
            totalPages={data.totalPages}
            onPage={setPageNumber}
          />
        </>
      )}
    </div>
  );
}
