import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import api from "../../Api/api";
import BrowseFilterBar from "./Parts/BrowseFilterBar";
import BrowseBookCard from "../../Shared/Books/brows-book-card/BrowseBookCard";
import Pager from "./Parts/Pagination";

import PageHeader from "../../Shared/ui/PageHeader";
import LoadingState from "../../Shared/ui/LoadingState";
import EmptyState from "../../Shared/ui/EmptyState";
import ErrorState from "../../Shared/ui/ErrorState";
import { DEFAULT_BROWSE_QUERY } from "@/features/browse/browse.defaults";
import "./Browse.css";

/**
 * @typedef {import("@/features/browse/browse.query").BrowseQuery} BrowseQuery
 */

/**
 * @param {BrowseQuery} q
 */
function buildParams(q) {
  const p = {};

  if (q.verseType) p.verseType = q.verseType;
  if (q.originType) p.originType = q.originType;
  if (q.search?.trim()) p.search = q.search.trim();
  if (q.sortBy) p.sortBy = q.sortBy;

  p.isAscending = !!q.isAscending;

  if (q.statuses?.length) p.statuses = q.statuses;
  if (q.minRating !== "" && q.minRating != null) p.minRating = q.minRating;
  if (q.minReviewCount !== "" && q.minReviewCount != null) {
    p.minReviewCount = q.minReviewCount;
  }
  if (q.genreIds?.length) p.genreIds = q.genreIds;
  if (q.excludeGenreIds?.length) p.excludeGenreIds = q.excludeGenreIds;
  if (q.tagIds?.length) p.tagIds = q.tagIds;
  if (q.excludeTagIds?.length) p.excludeTagIds = q.excludeTagIds;

  p.pageNumber = q.pageNumber ?? 1;
  p.pageSize = 20;

  return p;
}

const norm = (s) =>
  String(s ?? "")
    .trim()
    .toLowerCase();

function countActiveFilters(q) {
  let count = 0;

  if (q.search?.trim()) count += 1;
  if (q.originType) count += 1;
  if (q.statuses?.length) count += q.statuses.length;
  if (q.minRating !== "" && q.minRating != null) count += 1;
  if (q.minReviewCount !== "" && q.minReviewCount != null) count += 1;

  count += q.genreIds?.length ?? 0;
  count += q.excludeGenreIds?.length ?? 0;
  count += q.tagIds?.length ?? 0;
  count += q.excludeTagIds?.length ?? 0;

  return count;
}

export default function Browse() {
  /** @type {[BrowseQuery, Function]} */
  const [query, setQuery] = useState(() => ({ ...DEFAULT_BROWSE_QUERY }));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const [genres, setGenres] = useState([]);
  const [tags, setTags] = useState([]);

  const [bookmarkedIds, setBookmarkedIds] = useState(new Set());
  const [bookmarkError, setBookmarkError] = useState("");

  const { search: querySearch } = useLocation();
  const lastAppliedRef = useRef(null);

  const params = useMemo(() => buildParams(query), [query]);
  const activeFilterCount = useMemo(() => countActiveFilters(query), [query]);

  const [data, setData] = useState({
    items: [],
    pageNumber: 1,
    pageSize: 20,
    totalCount: 0,
    totalPages: 0,
  });

  const tagIdByName = useMemo(() => {
    const map = new Map();
    (tags || []).forEach((tag) => {
      const id = Number(tag.id ?? tag.ID ?? tag.Id);
      const name = norm(tag.name ?? tag.Name);

      if (Number.isFinite(id) && name) map.set(name, id);
    });
    return map;
  }, [tags]);

  const genreIdByName = useMemo(() => {
    const map = new Map();
    (genres || []).forEach((genre) => {
      const id = Number(genre.id ?? genre.ID ?? genre.Id);
      const name = norm(genre.name ?? genre.Name);

      if (Number.isFinite(id) && name) map.set(name, id);
    });
    return map;
  }, [genres]);

  useEffect(() => {
    (async () => {
      try {
        const [genreRes, tagRes] = await Promise.all([
          api.get("/genres"),
          api.get("/tags"),
        ]);

        setGenres(genreRes.data || []);
        setTags(tagRes.data || []);
      } catch (fetchError) {
        console.error(fetchError);
      }
    })();
  }, []);

  useEffect(() => {
    const lookupsReady = (genres?.length ?? 0) > 0 && (tags?.length ?? 0) > 0;
    if (!lookupsReady) return;
    if (lastAppliedRef.current === querySearch) return;

    lastAppliedRef.current = querySearch;

    const searchParams = new URLSearchParams(querySearch);
    const genreName = norm(searchParams.get("genre"));
    const tagName = norm(searchParams.get("tag"));

    if (!genreName && !tagName) return;

    const genreId = genreName ? genreIdByName.get(genreName) : null;
    const tagId = tagName ? tagIdByName.get(tagName) : null;

    setQuery((current) => ({
      ...current,
      pageNumber: 1,
      genreIds: genreId ? [genreId] : [],
      tagIds: tagId ? [tagId] : [],
      excludeGenreIds: [],
      excludeTagIds: [],
    }));
  }, [querySearch, genres, tags, genreIdByName, tagIdByName]);

  useEffect(() => {
    (async () => {
      try {
        const response = await api.get("/me/library");
        const ids = new Set(
          (response.data || [])
            .filter((item) => item.isInLibrary)
            .map((item) => item.bookId),
        );

        setBookmarkedIds(ids);
      } catch (fetchError) {
        console.error(fetchError);
        console.log("Library not loaded (not logged in).");
      }
    })();
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError("");

      try {
        const response = await api.get("/books/browse", { params });
        const result = response.data || {};
        const pageSize = result.pageSize ?? 20;
        const totalCount = result.totalCount ?? 0;

        if (!cancelled) {
          setData({
            ...result,
            pageSize,
            totalCount,
            totalPages: result.totalPages ?? Math.ceil(totalCount / pageSize),
          });
        }
      } catch (fetchError) {
        console.error(fetchError);
        if (!cancelled) setError("Failed to load books (check API).");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [params, refreshKey]);

  const items = data.items || [];
  const totalCount = Number(data.totalCount || 0);
  const currentPage = Number(data.pageNumber || query.pageNumber || 1);
  const totalPages = Number(data.totalPages || 0);
  const pageSize = Number(data.pageSize || 20);
  const resultStart = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const resultEnd = totalCount === 0 ? 0 : resultStart + items.length - 1;
  const resultsSubtitle =
    totalCount > 0
      ? `Showing ${resultStart}-${resultEnd} of ${totalCount} stories matched to your current shelf.`
      : "Use the filters to shape a shelf around the exact vibe you want.";

  const toggleBookmark = async (book) => {
    const id = book.id ?? book.Id;
    const isMarked = bookmarkedIds.has(id);

    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (isMarked) next.delete(id);
      else next.add(id);
      return next;
    });

    setBookmarkError("");

    try {
      if (isMarked) await api.delete(`/books/${id}/library`);
      else await api.post(`/books/${id}/library`);
    } catch (requestError) {
      setBookmarkedIds((prev) => {
        const next = new Set(prev);
        if (isMarked) next.add(id);
        else next.delete(id);
        return next;
      });

      const status = requestError?.response?.status;
      const url = requestError?.config?.url;
      setBookmarkError(
        `Bookmark failed${status ? ` (HTTP ${status})` : ""}. ${
          url ? `URL: ${url}` : ""
        }`,
      );
      console.error(requestError);
    }
  };

  return (
    <section className="iv-browse-page">
      <div className="iv-browse-shell">
        <section className="iv-browse-panel iv-browse-panel--filters">
          <PageHeader
            title="Shape Your Shelf"
            subtitle="Use quick tabs for broad lanes, then open the advanced controls when you want something more exact."
            actions={
              <div className="iv-browse-head-badge">
                {activeFilterCount > 0
                  ? `${activeFilterCount} filters active`
                  : "Ready to explore"}
              </div>
            }
          />

          <BrowseFilterBar
            query={query}
            setQuery={setQuery}
            genres={genres}
            tags={tags}
          />
        </section>

        {bookmarkError ? (
          <div className="iv-browse-alert" role="alert">
            {bookmarkError}
          </div>
        ) : null}

        <section className="iv-browse-panel iv-browse-panel--results">
          <PageHeader
            title="Shelf Results"
            subtitle={resultsSubtitle}
            actions={
              <div className="iv-browse-resultsMeta">
                <span className="iv-browse-resultsMeta__pill">{query.verseType}</span>
                <span className="iv-browse-resultsMeta__pill">
                  {items.length} showing now
                </span>
              </div>
            }
          />

          {loading ? (
            <LoadingState text="Loading books..." />
          ) : error ? (
            <ErrorState
              subtitle={error}
              onRetry={() => setRefreshKey((value) => value + 1)}
            />
          ) : items.length === 0 ? (
            <EmptyState
              title="No books match your filters"
              subtitle="Try removing some filters, searching a different keyword, or exploring other tags."
            />
          ) : (
            <>
              <div className="iv-browse-grid">
                {items.map((book) => (
                  <div key={book.id ?? book.Id} className="iv-browse-grid__item">
                    <BrowseBookCard
                      book={book}
                      isBookmarked={bookmarkedIds.has(book.id ?? book.Id)}
                      onToggleBookmark={toggleBookmark}
                    />
                  </div>
                ))}
              </div>

              <Pager
                pageNumber={data.pageNumber}
                totalPages={data.totalPages}
                onPage={(page) =>
                  setQuery((prev) => ({ ...prev, pageNumber: page }))
                }
              />
            </>
          )}
        </section>
      </div>
    </section>
  );
}
