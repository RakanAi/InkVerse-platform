import { useEffect, useMemo, useState } from "react";
import "./BrowseFilter.css";
import {
  VERSE_TYPES,
  STATUS_OPTIONS,
  SORT_OPTIONS,
  ORIGIN_TYPES,
} from "@/domain/books/book-filters";
import DropdownSelect from "@/Shared/ui/DropdownSelect";
import Button from "@/Shared/ui/Button";
import TextField from "@/Shared/ui/TextField";
import Chip from "@/Shared/ui/Chip";
import Segmented from "@/Shared/ui/Segmented";
import MultiSelectDropdown from "@/Shared/ui/MultiSelectDropdown";
import { cyclePick } from "@/features/browse/utils/cyclePick";
import { buildSelectedChips } from "@/features/browse/utils/selectedChips";
import { DEFAULT_BROWSE_QUERY } from "@/features/browse/browse.defaults";


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

  const selectedGenreChips = useMemo(
    () => buildSelectedChips(genres, query.genreIds, query.excludeGenreIds),
    [genres, query.genreIds, query.excludeGenreIds],
  );

  const selectedTagChips = useMemo(
    () => buildSelectedChips(tags, query.tagIds, query.excludeTagIds),
    [tags, query.tagIds, query.excludeTagIds],
  );

  const clearAll = () => {
  setQuery((p) => ({
    ...DEFAULT_BROWSE_QUERY,
    // keep verseType on purpose (your original behavior)
    verseType: p.verseType,
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
    <div className="card" style={{ top: 12, zIndex: 10 }}>
      <div className="card-body">
        {/* Row 0: VerseType tabs + Clear */}
        <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
          <Segmented
            value={query.verseType}
            onChange={(vt) => verseTab(vt)}
            options={VERSE_TYPES.map((vt) => ({ value: vt, label: vt }))}
          />

          <div className="ms-auto d-flex gap-2 align-items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMore((x) => !x)}
            >
              {showMore ? "Hide filters" : "More filters"}
            </Button>

            <Button variant="danger" size="sm" onClick={clearAll}>
              Clear
            </Button>
          </div>
        </div>

        {/* Row 1: Search + Sort + Asc + Status */}
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-5">
            <TextField
              placeholder="Search title, author, summary…"
              value={searchLocal}
              onChange={setSearchLocal}
            />
          </div>

          <div className="col-7 col-md-3">
            <DropdownSelect
              value={query.sortBy}
              onChange={(v) =>
                setQuery((p) => ({
                  ...p,
                  sortBy: v,
                  pageNumber: 1,
                }))
              }
              options={SORT_OPTIONS}
              renderLabel={(o) => `Sort by: ${o.label}`}
            />
          </div>

          <div className="col-5 col-md-2">
            <Button
              variant="outline"
              className="w-100"
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
            </Button>
          </div>

          {/* status stays bootstrap for now (we can convert next) */}
          <div className="col-12 col-md-2">
            <MultiSelectDropdown
              label={statusLabel}
              values={query.statuses || []}
              onChange={(vals) =>
                setQuery((p) => ({
                  ...p,
                  statuses: vals,
                  pageNumber: 1,
                }))
              }
              options={STATUS_OPTIONS.map((s) => ({
                value: s,
                label: s,
              }))}
            />
          </div>
        </div>

        {/* More filters (collapsible) */}
        {showMore && (
          <>
            <hr className="my-3" />
            <div className="row g-2">
              <div className="col-12 col-md-4">
                <DropdownSelect
                  value={query.originType}
                  onChange={(v) =>
                    setQuery((p) => ({
                      ...p,
                      originType: v,
                      pageNumber: 1,
                    }))
                  }
                  placeholder="All Origin Types"
                  options={ORIGIN_TYPES.map((o) => ({ value: o, label: o }))}
                  renderLabel={(o) => o.label}
                />
              </div>

              <div className="col-6 col-md-4">
                <TextField
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  placeholder="Min rating (0–5)"
                  value={query.minRating}
                  onChange={(v) =>
                    setQuery((p) => ({
                      ...p,
                      minRating: v,
                      pageNumber: 1,
                    }))
                  }
                />
              </div>

              <div className="col-6 col-md-4">
                <TextField
                  type="number"
                  min="0"
                  step="1"
                  placeholder="Min review count"
                  value={query.minReviewCount}
                  onChange={(v) =>
                    setQuery((p) => ({
                      ...p,
                      minReviewCount: v,
                      pageNumber: 1,
                    }))
                  }
                />
              </div>
            </div>

            <div className="row g-2 mt-2">
              {/* Genres picker */}
              <div className="col-12">
                <div className="d-flex align-items-center justify-content-between mb-1">
                  <span className="borderStart"></span>
                  <div className="fw-semibold text-start">Genres</div>
                </div>

                <div className="d-flex flex-wrap gap-2">
                  {(genres || []).slice(0, 30).map((g) => {
                    const gid = g.id ?? g.ID;
                    const isInc = (query.genreIds || []).includes(gid);
                    const isExc = (query.excludeGenreIds || []).includes(gid);

                    const tone = isInc
                      ? "include"
                      : isExc
                        ? "exclude"
                        : "neutral";
                    const title = isInc
                      ? "Included"
                      : isExc
                        ? "Excluded"
                        : "Not selected";

                    return (
                      <Chip
                        key={gid}
                        tone={tone}
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
                      >
                        {g.name}
                      </Chip>
                    );
                  })}
                </div>
              </div>

              {/* Tags picker */}
              <div className="col-12 mt-2">
                <div className="d-flex align-items-center justify-content-between mb-1">
                  <span className="borderStart"></span>
                  <div className="fw-semibold text-start">Tags</div>
                </div>

                <div className="d-flex flex-wrap gap-2 hightLimiter">
                  {(tags || []).slice(0, 1000).map((t) => {
                    const tid = t.id ?? t.ID;
                    const isInc = (query.tagIds || []).includes(tid);
                    const isExc = (query.excludeTagIds || []).includes(tid);

                    const tone = isInc
                      ? "include"
                      : isExc
                        ? "exclude"
                        : "neutral";
                    const title = isInc
                      ? "Included"
                      : isExc
                        ? "Excluded"
                        : "Not selected";

                    return (
                      <Chip
                        key={tid}
                        tone={tone}
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
                      >
                        {t.name}
                      </Chip>
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
                  tone={x.type === "exclude" ? "exclude" : "include"}
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
                >
                  {`${x.type === "exclude" ? "−" : "+"} ${x.name}`}
                </Chip>
              ))}

              {selectedTagChips.map((x) => (
                <Chip
                  key={`t-${x.type}-${x.id}`}
                  tone={x.type === "exclude" ? "exclude" : "include"}
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
                >
                  {`${x.type === "exclude" ? "−" : "+"} ${x.name}`}
                </Chip>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
