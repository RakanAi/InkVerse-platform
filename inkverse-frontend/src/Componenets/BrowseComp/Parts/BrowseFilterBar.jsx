import { useEffect, useMemo, useState } from "react";
import "./BrowseFilter.css"

const VERSE_TYPES = ["Original", "Fanfic", "AU"];
const ORIGIN_TYPES = ["PlatformOriginal", "Translation"];

const SORT_OPTIONS = [
  { value: "UpdatedAt", label: "Updated" },
  { value: "CreatedAt", label: "New" },
  { value: "Random", label: "Random" },
  { value: "TotalViews", label: "Views" },
  { value: "Title", label: "Name" },
  { value: "ChapterCount", label: "Chapters" },
  { value: "AverageRating", label: "Rating" },
  { value: "ReviewCount", label: "Reviews" },
];

const STATUS_OPTIONS = ["Ongoing", "Completed", "Paused", "Dropped"];

function toggleInArray(arr, value) {
  const s = new Set(arr || []);
  if (s.has(value)) s.delete(value);
  else s.add(value);
  return Array.from(s);
}

// mode: "include" | "exclude"
function cyclePick({ includeArr, excludeArr, id }) {
  const inc = new Set(includeArr || []);
  const exc = new Set(excludeArr || []);

  if (inc.has(id)) {
    inc.delete(id);
    exc.add(id); // include -> exclude
  } else if (exc.has(id)) {
    exc.delete(id); // exclude -> none
  } else {
    inc.add(id); // none -> include
  }

  return {
    include: Array.from(inc),
    exclude: Array.from(exc),
  };
}

function Chip({ text, variant = "secondary", onClick, title }) {
  return (
    <button
      type="button"
      className={`btn btn-${variant} btn-sm`}
      style={{ borderRadius: 999 }}
      onClick={onClick}
      title={title}
    >
      {text}
    </button>
  );
}

export default function BrowseFilterBar({ query, setQuery, genres, tags }) {
  const [showMore, setShowMore] = useState(false);

  // debounce search input (so typing doesn't spam the API)
  const [searchLocal, setSearchLocal] = useState(query.search || "");
  useEffect(() => setSearchLocal(query.search || ""), [query.search]);

  useEffect(() => {
    const t = setTimeout(() => {
      setQuery((p) =>
        p.search === searchLocal
          ? p
          : { ...p, search: searchLocal, pageNumber: 1 },
      );
    }, 350);
    return () => clearTimeout(t);
  }, [searchLocal, setQuery]);

  const selectedGenreChips = useMemo(() => {
    const byId = new Map((genres || []).map((g) => [g.id ?? g.ID, g]));
    const res = [];
    for (const id of query.genreIds || []) {
      const g = byId.get(id);
      if (g) res.push({ id, name: g.name, type: "include" });
    }
    for (const id of query.excludeGenreIds || []) {
      const g = byId.get(id);
      if (g) res.push({ id, name: g.name, type: "exclude" });
    }
    return res;
  }, [genres, query.genreIds, query.excludeGenreIds]);

  const selectedTagChips = useMemo(() => {
    const byId = new Map((tags || []).map((t) => [t.id ?? t.ID, t]));
    const res = [];
    for (const id of query.tagIds || []) {
      const t = byId.get(id);
      if (t) res.push({ id, name: t.name, type: "include" });
    }
    for (const id of query.excludeTagIds || []) {
      const t = byId.get(id);
      if (t) res.push({ id, name: t.name, type: "exclude" });
    }
    return res;
  }, [tags, query.tagIds, query.excludeTagIds]);

  const clearAll = () => {
    setQuery((p) => ({
      ...p,
      // keep verseType (main) on purpose
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
    }));
  };

  const statusLabel = useMemo(() => {
    const s = query.statuses || [];
    if (s.length === 0) return "Status";
    return `Status: ${s[0]}`;
  }, [query.statuses]);

  const verseTab = (vt) =>
    setQuery((p) => ({ ...p, verseType: vt, pageNumber: 1 }));

  return (
    <div className="card " style={{ top: 12, zIndex: 10 }}>
      <div className="card-body m">
        {/* Row 0: VerseType tabs + Clear */}
        <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
          <div className="btn-group">
            {VERSE_TYPES.map((vt) => (
              <button
                key={vt}
                className={`btn ${
                  query.verseType === vt ? "btn-dark" : "btn-outline-dark"
                }`}
                onClick={() => verseTab(vt)}
              >
                {vt}
              </button>
            ))}
          </div>

          <div className="ms-auto d-flex gap-2 align-items-center">
            <button
              className="btn btn-outline-dark btn-sm"
              onClick={() => setShowMore((x) => !x)}
            >
              {showMore ? "Hide filters" : "More filters"}
            </button>
            <button
              className="btn btn-outline-danger btn-sm"
              onClick={clearAll}
            >
              Clear
            </button>
          </div>
        </div>

        {/* Row 1: Search + Sort + Asc + Status */}
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-5">
            <input
              className="form-control"
              placeholder="Search title, author, summary…"
              value={searchLocal}
              onChange={(e) => setSearchLocal(e.target.value)}
            />
          </div>

          <div className="col-7 col-md-3">
            <select
              className="form-select"
              value={query.sortBy}
              onChange={(e) =>
                setQuery((p) => ({
                  ...p,
                  sortBy: e.target.value,
                  pageNumber: 1,
                }))
              }
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  Sort: {o.label}
                </option>
              ))}
            </select>
          </div>

          <div className="col-5 col-md-2">
            <button
              className="btn btn-outline-dark w-100"
              onClick={() =>
                setQuery((p) => ({
                  ...p,
                  isAscending: !p.isAscending,
                  pageNumber: 1,
                }))
              }
              title="Toggle ascending/descending"
            >
              {query.isAscending ? "Asc" : "Desc"}
            </button>
          </div>

          <div className="col-12 col-md-2">
            <div className="dropdown w-100">
              <button
                className="btn btn-outline-dark dropdown-toggle w-100 overflow-hidden"
                data-bs-toggle="dropdown"
                type="button"
              >
                {statusLabel}
                {query.statuses?.length ? ` (${query.statuses.length})` : ""}
              </button>
              <div className="dropdown-menu p-2" style={{ minWidth: 220 }}>
                {STATUS_OPTIONS.map((s) => {
                  const checked = (query.statuses || []).includes(s);
                  return (
                    <label
                      key={s}
                      className="d-flex align-items-center gap-2 py-1"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          setQuery((p) => ({
                            ...p,
                            statuses: toggleInArray(p.statuses, s),
                            pageNumber: 1,
                          }))
                        }
                      />
                      <span>{s}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* More filters (collapsible) */}
        {showMore && (
          <>
            <hr className="my-3" />
            <div className="row g-2">
              <div className="col-12 col-md-4">
                <select
                  className="form-select"
                  value={query.originType}
                  onChange={(e) =>
                    setQuery((p) => ({
                      ...p,
                      originType: e.target.value,
                      pageNumber: 1,
                    }))
                  }
                >
                  <option value="">All Origin Types</option>
                  {ORIGIN_TYPES.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-6 col-md-4">
                <input
                  className="form-control"
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  placeholder="Min rating (0–5)"
                  value={query.minRating}
                  onChange={(e) =>
                    setQuery((p) => ({
                      ...p,
                      minRating: e.target.value,
                      pageNumber: 1,
                    }))
                  }
                />
              </div>

              <div className="col-6 col-md-4">
                <input
                  className="form-control"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="Min review count"
                  value={query.minReviewCount}
                  onChange={(e) =>
                    setQuery((p) => ({
                      ...p,
                      minReviewCount: e.target.value,
                      pageNumber: 1,
                    }))
                  }
                />
              </div>
            </div>

            <div className="row g-2 mt-2">
              {/* Genres picker */}
              <div className="col-12 ">
                <div className="d-flex align-items-center justify-content-between mb-1">
                  <span className="borderStart"></span>

                  <div className="fw-semibold text-start">Genres</div>
                  <div className="small text-muted text-end">
                    click cycles: include → exclude → remove
                  </div>
                </div>

                <div className="d-flex flex-wrap gap-2">
                  {(genres || []).slice(0, 30).map((g) => {
                    const gid = g.id ?? g.ID;
                    const isInc = (query.genreIds || []).includes(gid);
                    const isExc = (query.excludeGenreIds || []).includes(gid);

                    const variant = isInc
                      ? "dark"
                      : isExc
                        ? "danger"
                        : "outline-secondary";
                    const title = isInc
                      ? "Included"
                      : isExc
                        ? "Excluded"
                        : "Not selected";

                    return (
                      <Chip
                        key={gid}
                        text={g.name}
                        variant={variant}
                        title={title}
                        onClick={() => {
                          const next = cyclePick({
                            includeArr: query.genreIds,
                            excludeArr: query.excludeGenreIds,
                            id: gid,
                          });
                          setQuery((p) => ({
                            ...p,
                            genreIds: next.include,
                            excludeGenreIds: next.exclude,
                            pageNumber: 1,
                          }));
                        }}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Tags picker */}
              <div className="col-12 mt-2">
                <div className="d-flex align-items-center justify-content-between mb-1">
                  <span className="borderStart"></span>
                  <div className="fw-semibold text-start">Tags</div>
                  <div className="small text-muted text-end">
                    click cycles: include → exclude → remove
                  </div>
                </div>

                <div className="d-flex flex-wrap gap-2 hightLimiter">
                  {(tags || []).slice(0, 1000).map((t) => {
                    const tid = t.id ?? t.ID;
                    const isInc = (query.tagIds || []).includes(tid);
                    const isExc = (query.excludeTagIds || []).includes(tid);

                    const variant = isInc
                      ? "dark"
                      : isExc
                        ? "danger"
                        : "outline-secondary";
                    const title = isInc
                      ? "Included"
                      : isExc
                        ? "Excluded"
                        : "Not selected";

                    return (
                      <Chip
                        key={tid}
                        text={t.name}
                        variant={variant}
                        title={title}
                        onClick={() => {
                          const next = cyclePick({
                            includeArr: query.tagIds,
                            excludeArr: query.excludeTagIds,
                            id: tid,
                          });
                          setQuery((p) => ({
                            ...p,
                            tagIds: next.include,
                            excludeTagIds: next.exclude,
                            pageNumber: 1,
                          }));
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Selected chips summary (always visible) */}
        {(selectedGenreChips.length > 0 || selectedTagChips.length > 0) && (
          <>
            <hr className="my-3" />
            <div className="d-flex flex-wrap gap-2">
              {selectedGenreChips.map((x) => (
                <Chip
                  key={`g-${x.type}-${x.id}`}
                  text={`${x.type === "exclude" ? "−" : "+"} ${x.name}`}
                  variant={x.type === "exclude" ? "danger" : "dark"}
                  title="Click to remove"
                  onClick={() => {
                    setQuery((p) => ({
                      ...p,
                      genreIds: (p.genreIds || []).filter((id) => id !== x.id),
                      excludeGenreIds: (p.excludeGenreIds || []).filter(
                        (id) => id !== x.id,
                      ),
                      pageNumber: 1,
                    }));
                  }}
                />
              ))}

              {selectedTagChips.map((x) => (
                <Chip
                  key={`t-${x.type}-${x.id}`}
                  text={`${x.type === "exclude" ? "−" : "+"} ${x.name}`}
                  variant={x.type === "exclude" ? "danger" : "dark"}
                  title="Click to remove"
                  onClick={() => {
                    setQuery((p) => ({
                      ...p,
                      tagIds: (p.tagIds || []).filter((id) => id !== x.id),
                      excludeTagIds: (p.excludeTagIds || []).filter(
                        (id) => id !== x.id,
                      ),
                      pageNumber: 1,
                    }));
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
