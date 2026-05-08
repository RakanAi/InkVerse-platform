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

function FilterToggleIcon({ open }) {
  return (
    <svg
      className="iv-browse-filters__toggleIcon"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 6H16"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M6.5 10H13.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M8.5 14H11.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d={open ? "M10 3.75V7.25" : "M10 12.75V16.25"}
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function BrowseFilterBar({ query, setQuery, genres, tags }) {
  const [showMore, setShowMore] = useState(false);
  const [searchLocal, setSearchLocal] = useState(query.search || "");

  useEffect(() => setSearchLocal(query.search || ""), [query.search]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setQuery((prev) =>
        prev.search === searchLocal
          ? prev
          : { ...prev, search: searchLocal, pageNumber: 1 },
      );
    }, 350);

    return () => clearTimeout(timeout);
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
    setQuery((prev) => ({
      ...DEFAULT_BROWSE_QUERY,
      verseType: prev.verseType,
    }));
  };

  const statusLabel = useMemo(() => {
    const statuses = query.statuses || [];
    if (statuses.length === 0) return "Status";
    return `Status: ${statuses[0]}`;
  }, [query.statuses]);

  return (
    <div className="iv-browse-filters">
      <div className="iv-browse-filters__top">
        <div className="iv-browse-filters__verse">
          <Segmented
            className="iv-browse-filters__segmented"
            value={query.verseType}
            onChange={(verseType) =>
              setQuery((prev) => ({ ...prev, verseType, pageNumber: 1 }))
            }
            options={VERSE_TYPES.map((verseType) => ({
              value: verseType,
              label: verseType,
            }))}
          />
        </div>

        <div className="iv-browse-filters__actions">
          <Button
            variant="outline"
            size="md"
            className="iv-browse-filters__topButton iv-browse-filters__topButton--toggle"
            onClick={() => setShowMore((prev) => !prev)}
            aria-label={showMore ? "Hide filters" : "Show more filters"}
            title={showMore ? "Hide filters" : "Show more filters"}
          >
            <FilterToggleIcon open={showMore} />
            <span className="iv-browse-filters__topButtonText">
              {showMore ? "Hide filters" : "More filters"}
            </span>
          </Button>

          <Button
            variant="danger"
            size="md"
            className="iv-browse-filters__topButton"
            onClick={clearAll}
          >
            Clear
          </Button>
        </div>
      </div>

      <div className="iv-browse-filters__searchRow">
        <div className="iv-browse-filters__field iv-browse-filters__field--search">
          <span className="iv-browse-filters__label">Search</span>
          <TextField
            placeholder="Search title, author, summary..."
            value={searchLocal}
            onChange={setSearchLocal}
          />
        </div>

        <div className="iv-browse-filters__field">
          <span className="iv-browse-filters__label">Sort by</span>
          <DropdownSelect
            value={query.sortBy}
            onChange={(sortBy) =>
              setQuery((prev) => ({
                ...prev,
                sortBy,
                pageNumber: 1,
              }))
            }
            options={SORT_OPTIONS}
            renderLabel={(option) => `Sort by: ${option.label}`}
          />
        </div>

        <div className="iv-browse-filters__field">
          <span className="iv-browse-filters__label">Direction</span>
          <Button
            variant="outline"
            className="iv-browse-filters__direction"
            onClick={() =>
              setQuery((prev) => ({
                ...prev,
                isAscending: !prev.isAscending,
                pageNumber: 1,
              }))
            }
            title="Toggle ascending or descending sort"
          >
            {query.isAscending ? "Ascending" : "Descending"}
          </Button>
        </div>

        <div className="iv-browse-filters__field">
          <span className="iv-browse-filters__label">Status</span>
          <MultiSelectDropdown
            label={statusLabel}
            values={query.statuses || []}
            onChange={(statuses) =>
              setQuery((prev) => ({
                ...prev,
                statuses,
                pageNumber: 1,
              }))
            }
            options={STATUS_OPTIONS.map((status) => ({
              value: status,
              label: status,
            }))}
          />
        </div>
      </div>

      {showMore ? (
        <div className="iv-browse-filters__advanced">
          <div className="iv-browse-filters__grid">
            <div className="iv-browse-filters__field">
              <span className="iv-browse-filters__label">Origin type</span>
              <DropdownSelect
                value={query.originType}
                onChange={(originType) =>
                  setQuery((prev) => ({
                    ...prev,
                    originType,
                    pageNumber: 1,
                  }))
                }
                placeholder="All origin types"
                options={ORIGIN_TYPES.map((originType) => ({
                  value: originType,
                  label: originType,
                }))}
                renderLabel={(option) => option.label}
              />
            </div>

            <div className="iv-browse-filters__field">
              <span className="iv-browse-filters__label">Minimum rating</span>
              <TextField
                type="number"
                min="0"
                max="5"
                step="0.1"
                placeholder="0 to 5"
                value={query.minRating}
                onChange={(minRating) =>
                  setQuery((prev) => ({
                    ...prev,
                    minRating,
                    pageNumber: 1,
                  }))
                }
              />
            </div>

            <div className="iv-browse-filters__field">
              <span className="iv-browse-filters__label">Minimum reviews</span>
              <TextField
                type="number"
                min="0"
                step="1"
                placeholder="Review count"
                value={query.minReviewCount}
                onChange={(minReviewCount) =>
                  setQuery((prev) => ({
                    ...prev,
                    minReviewCount,
                    pageNumber: 1,
                  }))
                }
              />
            </div>
          </div>

          <div className="iv-browse-filters__guide">
            Tap once to include a chip, twice to exclude it, and a third time to clear it.
          </div>

          <div className="iv-browse-filters__group">
            <div className="iv-browse-filters__groupHead">
              <span className="iv-browse-filters__groupTitle">Genres</span>
              <span className="iv-browse-filters__groupHint">
                Build the shelf tone.
              </span>
            </div>

            <div className="iv-browse-filters__chips">
              {(genres || []).slice(0, 30).map((genre) => {
                const genreId = genre.id ?? genre.ID;
                const isIncluded = (query.genreIds || []).includes(genreId);
                const isExcluded = (query.excludeGenreIds || []).includes(genreId);

                const tone = isIncluded
                  ? "include"
                  : isExcluded
                    ? "exclude"
                    : "neutral";
                const title = isIncluded
                  ? "Included"
                  : isExcluded
                    ? "Excluded"
                    : "Not selected";

                return (
                  <Chip
                    key={genreId}
                    tone={tone}
                    title={title}
                    onClick={() => {
                      const next = cyclePick({
                        includeArr: query.genreIds,
                        excludeArr: query.excludeGenreIds,
                        id: genreId,
                      });

                      setQuery((prev) => ({
                        ...prev,
                        genreIds: next.include,
                        excludeGenreIds: next.exclude,
                        pageNumber: 1,
                      }));
                    }}
                  >
                    {genre.name}
                  </Chip>
                );
              })}
            </div>
          </div>

          <div className="iv-browse-filters__group">
            <div className="iv-browse-filters__groupHead">
              <span className="iv-browse-filters__groupTitle">Tags</span>
              <span className="iv-browse-filters__groupHint">
                Fine-tune the exact reading energy.
              </span>
            </div>

            <div className="iv-browse-filters__chips iv-browse-filters__chips--scroll">
              {(tags || []).slice(0, 1000).map((tag) => {
                const tagId = tag.id ?? tag.ID;
                const isIncluded = (query.tagIds || []).includes(tagId);
                const isExcluded = (query.excludeTagIds || []).includes(tagId);

                const tone = isIncluded
                  ? "include"
                  : isExcluded
                    ? "exclude"
                    : "neutral";
                const title = isIncluded
                  ? "Included"
                  : isExcluded
                    ? "Excluded"
                    : "Not selected";

                return (
                  <Chip
                    key={tagId}
                    tone={tone}
                    title={title}
                    onClick={() => {
                      const next = cyclePick({
                        includeArr: query.tagIds,
                        excludeArr: query.excludeTagIds,
                        id: tagId,
                      });

                      setQuery((prev) => ({
                        ...prev,
                        tagIds: next.include,
                        excludeTagIds: next.exclude,
                        pageNumber: 1,
                      }));
                    }}
                  >
                    {tag.name}
                  </Chip>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      {selectedGenreChips.length > 0 || selectedTagChips.length > 0 ? (
        <div className="iv-browse-filters__selected">
          <div className="iv-browse-filters__selectedHead">
            <span className="iv-browse-filters__groupTitle">Active filters</span>
            <span className="iv-browse-filters__groupHint">Tap any chip to remove it.</span>
          </div>

          <div className="iv-browse-filters__selectedChips">
            {selectedGenreChips.map((item) => (
              <Chip
                key={`g-${item.type}-${item.id}`}
                tone={item.type === "exclude" ? "exclude" : "include"}
                title="Click to remove"
                onClick={() => {
                  setQuery((prev) => ({
                    ...prev,
                    genreIds: (prev.genreIds || []).filter((id) => id !== item.id),
                    excludeGenreIds: (prev.excludeGenreIds || []).filter(
                      (id) => id !== item.id,
                    ),
                    pageNumber: 1,
                  }));
                }}
              >
                {`${item.type === "exclude" ? "−" : "+"} ${item.name}`}
              </Chip>
            ))}

            {selectedTagChips.map((item) => (
              <Chip
                key={`t-${item.type}-${item.id}`}
                tone={item.type === "exclude" ? "exclude" : "include"}
                title="Click to remove"
                onClick={() => {
                  setQuery((prev) => ({
                    ...prev,
                    tagIds: (prev.tagIds || []).filter((id) => id !== item.id),
                    excludeTagIds: (prev.excludeTagIds || []).filter(
                      (id) => id !== item.id,
                    ),
                    pageNumber: 1,
                  }));
                }}
              >
                {`${item.type === "exclude" ? "−" : "+"} ${item.name}`}
              </Chip>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
