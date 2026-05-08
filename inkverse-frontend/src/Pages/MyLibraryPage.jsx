import { useDeferredValue, useMemo, useState } from "react";
import "./MyLibraryPage.css";
import LoadingState from "@/Shared/ui/LoadingState";
import ErrorState from "@/Shared/ui/ErrorState";
import EmptyState from "@/Shared/ui/EmptyState";
import DropdownSelect from "@/Shared/ui/DropdownSelect";
import LibraryBookCard from "@/features/Library/components/LibraryBookCard";
import { useLibrary } from "@/features/Library/hooks/useLibrary";
import LibraryFilter from "@/features/Library/librarayFilter";
import { LIBRARY_SORT_OPTIONS } from "@/features/Library/library.presets";
import {
  filterLibraryItems,
  getLibraryCounts,
  sortLibraryItems,
} from "@/features/Library/utils/library.filters";

export default function MyLibraryPage() {
  const { items, loading, error, changeStatus, remove, reload } = useLibrary();
  const [filter, setFilter] = useState("All");
  const [sort, setSort] = useState("recent");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);

  const counts = useMemo(() => getLibraryCounts(items), [items]);

  const filtered = useMemo(() => {
    const visibleItems = filterLibraryItems(items, filter, deferredSearch);
    return sortLibraryItems(visibleItems, sort);
  }, [items, filter, deferredSearch, sort]);

  const emptyTitle =
    filter === "History" ? "No reading trail yet." : `No books in ${filter.toLowerCase()} yet.`;

  const emptySubtitle = deferredSearch
    ? "Try a different title search or switch to another shelf lane."
    : "Move books between lanes, or come back after adding more stories.";

  if (loading) {
    return (
      <section className="iv-library-page">
        <div className="iv-library-shell">
          <LoadingState text="Loading your library..." />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="iv-library-page">
        <div className="iv-library-shell">
          <ErrorState title={error} subtitle="Please try loading your shelf again." onRetry={reload} />
        </div>
      </section>
    );
  }

  return (
    <section className="iv-library-page">
      <div className="iv-library-shell">
        <section className="iv-library-controls">
          <LibraryFilter value={filter} onChange={setFilter} counts={counts} />

          <div className="iv-library-tools">
            <label className="iv-library-field">
              <span className="iv-library-field__label">Search title</span>
              <input
                type="search"
                className="iv-input iv-library-search"
                placeholder="Search your shelf..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>

            <div className="iv-library-field">
              <span className="iv-library-field__label">Sort by</span>
              <DropdownSelect value={sort} onChange={setSort} options={LIBRARY_SORT_OPTIONS} />
            </div>
          </div>
        </section>

        <section className="iv-library-results">
          {filtered.length === 0 ? (
            <EmptyState title={emptyTitle} subtitle={emptySubtitle} />
          ) : (
            <div className="iv-library-grid">
              {filtered.map((item) => (
                <LibraryBookCard
                  key={item.bookId}
                  item={item}
                  onChangeStatus={changeStatus}
                  onRemove={remove}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
