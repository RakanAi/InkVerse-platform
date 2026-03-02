import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../Api/api";
import AuthContext from "../Context/AuthProvider";

import PageHeader from "@/Shared/ui/PageHeader";
import LoadingState from "@/Shared/ui/LoadingState";
import ErrorState from "@/Shared/ui/ErrorState";
import EmptyState from "@/Shared/ui/EmptyState";
import DropdownSelect from "@/Shared/ui/DropdownSelect";
import Button from "@/Shared/ui/Button";

import BrowseBookCard from "@/Shared/Books/brows-book-card/BrowseBookCard";
import Pager from "../Componenets/BrowseComp/Parts/Pagination";

import {
  TREND_DETAILS,
  TREND_SORT,
} from "@/features/trends/details/trend-details.presets";
import { parseTrendId } from "@/features/trends/details/utils/parseTrendId";
import { getSortConfig } from "@/features/trends/details/utils/getSortConfig";
import { pickFirst } from "@/features/trends/details/utils/pickFirst";

export default function TrendDetails() {
  const { id } = useParams();
  const trendId = useMemo(() => parseTrendId(id), [id]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [trend, setTrend] = useState(null);

  // Sorting (server-side via /books/browse)
  const [sortKey, setSortKey] = useState("newest");

  const trendName = pickFirst(trend, ["name", "Name", "title", "Title"], "—");
  const trendDesc = pickFirst(
    trend,
    ["description", "Description", "desc", "Desc"],
    "No description yet.",
  );

  // for DropdownSelect (shared)
  const sortOptions = TREND_SORT.map((o) => ({
    value: o.key,
    label: o.label,
  }));

  // Pagination
  const [pageNumber, setPageNumber] = useState(1);

  const [data, setData] = useState({
    items: [],
    pageNumber: 1,
    pageSize: TREND_DETAILS.pageSize,
    totalCount: 0,
    totalPages: 0,
  });

  // Library
  const { auth } = useContext(AuthContext);
  const myUserId = auth?.user?.id;

  const [libraryItems, setLibraryItems] = useState([]);
  const inLib = useCallback(
    (bookId) => libraryItems.some((x) => (x.bookId ?? x.book?.id) === bookId),
    [libraryItems],
  );

  const loadLibrary = useCallback(async () => {
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
  }, [myUserId]);

  const loadTrend = useCallback(async () => {
    // Best backend is GET /trends/{id}. If you don't have it yet,
    // this will fallback to fetching /trends and finding it.
    try {
      setTrend(null);
      const res = await api.get("/trends");
      const list = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.items)
          ? res.data.items
          : [];

      const getTrendId = (t) =>
        Number(t?.id ?? t?.Id ?? t?.ID ?? t?.trendId ?? t?.TrendId);

      const found = list.find((t) => getTrendId(t) === trendId) || null;
      setTrend(found);

      console.log("TrendDetails trend object:", found);
    } catch (e) {
      console.error("Failed to load trend", e);
      setTrend(null);
    }
  }, [trendId]);

  const loadBooks = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const sort = getSortConfig(sortKey);

      const res = await api.get("/books/browse", {
        params: {
          trendId,
          pageNumber,
          pageSize: TREND_DETAILS.pageSize,
          sortBy: sort.sortBy,
          isAscending: sort.isAscending,
        },
      });

      const r = res.data || {};
      const pageSizeRes = r.pageSize ?? TREND_DETAILS.pageSize;
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
        pageSize: TREND_DETAILS.pageSize,
        totalCount: 0,
        totalPages: 0,
      });
      setError("Failed to load trend books.");
    } finally {
      setLoading(false);
    }
  }, [trendId, pageNumber, sortKey]);

  const toggleLibrary = useCallback(
    async (bookId) => {
      if (!myUserId) return;
      try {
        if (inLib(bookId)) await api.delete(`/books/${bookId}/library`);
        else await api.post(`/books/${bookId}/library`);
        await loadLibrary();
      } catch (e) {
        console.error("toggleLibrary failed", e);
      }
    },
    [myUserId, inLib, loadLibrary],
  );

  // Validate trendId once
  useEffect(() => {
    if (!trendId) {
      setError("Invalid trend id.");
      setLoading(false);
      return;
    }
    loadTrend();
  }, [trendId, loadTrend]);

  // Load books when filters change (ONLY ONCE)
  useEffect(() => {
    if (!trendId) return;
    loadBooks();
  }, [trendId, pageNumber, sortKey, loadBooks]);

  // Load library when user changes
  useEffect(() => {
    loadLibrary();
  }, [loadLibrary]);

  const items = data.items || [];

  return (
    <div className="container py-3" style={{ textAlign: "center" }}>
      <div className="d-flex flex-wrap gap-2  mb-3">
        <div className="align-items-end justify-content-center rounded-3 p-5 HERE"
        >
          <div
            className="m-auto bg-white rounded-2"
            style={{ maxWidth: `${TREND_DETAILS.headerMaxWidth}px` }}
          >
            <PageHeader title={`Trend: ${trendName}`} subtitle={trendDesc} />
          </div>
        </div>

        <div className="d-flex gap-2 align-items-center">
          <DropdownSelect
            value={sortKey}
            options={sortOptions}
            onChange={(v) => {
              setSortKey(v);
              setPageNumber(1);
            }}
            style={{ width: 200 }}
          />
          <Link to="/trend">
            <Button variant="secondary" size="sm" className="text-white">
              Back
            </Button>
          </Link>
        </div>
      </div>

      <hr />

      {loading ? (
        <LoadingState title="Loading…" />
      ) : error ? (
        <ErrorState title={error} />
      ) : items.length === 0 ? (
        <EmptyState title="No books linked yet." />
      ) : (
        <>
          <div className="row g-3">
            <div className="text-muted small">Books linked to this trend</div>

            {items.map((b) => (
              <div className="col-12 col-lg-6 d-flex" key={b.id ?? b.Id}>
                <BrowseBookCard
                  book={b}
                  isBookmarked={inLib(b.id ?? b.Id)}
                  onToggleBookmark={() => toggleLibrary(b.id ?? b.Id)}
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
