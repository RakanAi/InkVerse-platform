import { useEffect, useMemo, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import api from "../../Api/api";
import BrowseFilterBar from "./Parts/BrowseFilterBar";
import BrowseBookCard from "./Parts/BrowseBookCard";
import Pager from "./Parts/Pagination";

function buildParams(q) {
  const p = {};

  if (q.verseType) p.verseType = q.verseType;
  if (q.originType) p.originType = q.originType;

  if (q.search?.trim()) p.search = q.search.trim();

  if (q.sortBy) p.sortBy = q.sortBy;
  p.isAscending = !!q.isAscending;

  if (q.statuses?.length) p.statuses = q.statuses;

  if (q.minRating !== "" && q.minRating != null) p.minRating = q.minRating;
  if (q.minReviewCount !== "" && q.minReviewCount != null)
    p.minReviewCount = q.minReviewCount;

  if (q.genreIds?.length) p.genreIds = q.genreIds;
  if (q.excludeGenreIds?.length) p.excludeGenreIds = q.excludeGenreIds;

  if (q.tagIds?.length) p.tagIds = q.tagIds;
  if (q.excludeTagIds?.length) p.excludeTagIds = q.excludeTagIds;

  p.pageNumber = q.pageNumber ?? 1;
  p.pageSize = 20; // ✅ fixed to 20

  return p;
}

const addIncludedId = (arr, id) => Array.from(new Set([...(arr || []), id]));
const norm = (s) =>
  String(s ?? "")
    .trim()
    .toLowerCase();

export default function Browse() {
  const [query, setQuery] = useState({
    verseType: "Original",
    search: "",
    sortBy: "UpdatedAt",
    isAscending: false,
    statuses: [],
    originType: "",
    minRating: "",
    minReviewCount: "",
    genreIds: [],
    excludeGenreIds: [],
    tagIds: [],
    excludeTagIds: [],
    pageNumber: 1,
  });

  const [genres, setGenres] = useState([]);
  const [tags, setTags] = useState([]);

  const [bookmarkedIds, setBookmarkedIds] = useState(new Set());
  const [bookmarkError, setBookmarkError] = useState("");

  const [data, setData] = useState({
    items: [],
    pageNumber: 1,
    pageSize: 20,
    totalCount: 0,
    totalPages: 0,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const params = useMemo(() => buildParams(query), [query]);

  const tagIdByName = useMemo(() => {
    const m = new Map();
    (tags || []).forEach((t) => {
      const id = Number(t.id ?? t.ID ?? t.Id);
      const name = norm(t.name ?? t.Name);
      if (Number.isFinite(id) && name) m.set(name, id);
    });
    return m;
  }, [tags]);

  const genreIdByName = useMemo(() => {
    const m = new Map();
    (genres || []).forEach((g) => {
      const id = Number(g.id ?? g.ID ?? g.Id);
      const name = norm(g.name ?? g.Name);
      if (Number.isFinite(id) && name) m.set(name, id);
    });
    return m;
  }, [genres]);

  // Load genres/tags once
  useEffect(() => {
    (async () => {
      try {
        const [g, t] = await Promise.all([
          api.get("/genres"),
          api.get("/tags"),
        ]);
        setGenres(g.data || []);
        setTags(t.data || []);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

const { search: qs } = useLocation();
const lastAppliedRef = useRef(null);

useEffect(() => {
  // require both lookups loaded so ids can resolve safely
  const lookupsReady = (genres?.length ?? 0) > 0 && (tags?.length ?? 0) > 0;
  if (!lookupsReady) return;

  // prevent re-applying same qs
  if (lastAppliedRef.current === qs) return;
  lastAppliedRef.current = qs;

  const p = new URLSearchParams(qs);

  const genreName = norm(p.get("genre"));
  const tagName = norm(p.get("tag"));

  // if URL has neither, do nothing
  if (!genreName && !tagName) return;

  const gId = genreName ? genreIdByName.get(genreName) : null;
  const tId = tagName ? tagIdByName.get(tagName) : null;

  setQuery((q) => ({
    ...q,
    pageNumber: 1,

    // set ONLY if we successfully resolved
    genreIds: gId ? [gId] : [],
    tagIds: tId ? [tId] : [],

    // clear excludes so filters are clean
    excludeGenreIds: [],
    excludeTagIds: [],
  }));
}, [qs, genres, tags, genreIdByName, tagIdByName]);


  useEffect(() => {
    (async () => {
      try {
        const r = await api.get("/me/library"); // ✅ your route
        const ids = new Set(
          (r.data || [])
            .filter((x) => x.isInLibrary) // your dto includes IsInLibrary
            .map((x) => x.bookId),
        );
        setBookmarkedIds(ids);
      } catch (e) {
        console.error(e);
        // likely 401 if not logged in -> ignore
        console.log("Library not loaded (not logged in).");
      }
    })();
  }, []);

  // Fetch browse results
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await api.get("/books/browse", { params });
        const r = res.data || {};
        const pageSize = r.pageSize ?? 20;
        const totalCount = r.totalCount ?? 0;

        if (!cancelled) {
          setData({
            ...r,
            pageSize,
            totalCount,
            totalPages: r.totalPages ?? Math.ceil(totalCount / pageSize),
          });
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) setError("Failed to load books (check API).");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [params]);

  // Bookmark toggle (ENDPOINT PLACEHOLDER)
  const toggleBookmark = async (book) => {
    const id = book.id;
    const isMarked = bookmarkedIds.has(id);

    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (isMarked) next.delete(id);
      else next.add(id);
      return next;
    });

    setBookmarkError("");

    try {
      // ⚠️ Replace these URLs with your real bookmark/library endpoints
      if (isMarked) await api.delete(`/books/${id}/library`);
      else await api.post(`/books/${id}/library`);
    } catch (e) {
      // rollback
      setBookmarkedIds((prev) => {
        const next = new Set(prev);
        if (isMarked) next.add(id);
        else next.delete(id);
        return next;
      });

      const status = e?.response?.status;
      const url = e?.config?.url;
      setBookmarkError(
        `Bookmark failed${status ? ` (HTTP ${status})` : ""}. ${
          url ? `URL: ${url}` : ""
        }`,
      );
      console.error(e);
    }
  };

  return (
    <div className="container-fluid py-3" style={{ maxWidth: "1300px" }}>
      <BrowseFilterBar
        query={query}
        setQuery={setQuery}
        genres={genres}
        tags={tags}
      />

      {bookmarkError && (
        <div className="alert alert-warning mt-2 py-2">{bookmarkError}</div>
      )}

      <div className="mt-3">
        {error && <div className="alert alert-danger">{error}</div>}
        {loading && <div className="text-muted">Loading…</div>}

        {!loading && !error && (
          <>
            <div className="row g-3 mt-2">
              {(data.items || []).map((b) => (
                <div key={b.id} className="col-12 col-lg-6 d-flex">
                  <BrowseBookCard
                    book={b}
                    isBookmarked={bookmarkedIds.has(b.id)}
                    onToggleBookmark={toggleBookmark}
                    onPickTag={(name) => {
                      const id = tagIdByName.get(String(name).toLowerCase());
                      if (!id) return;
                      setQuery((p) => ({
                        ...p,
                        tagIds: addIncludedId(p.tagIds, id),
                        excludeTagIds: (p.excludeTagIds || []).filter(
                          (x) => x !== id,
                        ),
                        pageNumber: 1,
                      }));
                    }}
                    onPickGenre={(name) => {
                      const id = genreIdByName.get(String(name).toLowerCase());
                      if (!id) return;
                      setQuery((p) => ({
                        ...p,
                        genreIds: addIncludedId(p.genreIds, id),
                        excludeGenreIds: (p.excludeGenreIds || []).filter(
                          (x) => x !== id,
                        ),
                        pageNumber: 1,
                      }));
                    }}
                  />
                </div>
              ))}
            </div>

            <Pager
              pageNumber={data.pageNumber}
              totalPages={data.totalPages}
              onPage={(p) => setQuery((prev) => ({ ...prev, pageNumber: p }))}
            />

            {(!data.items || data.items.length === 0) && (
              <div className="text-muted mt-3">
                No books match your filters.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
