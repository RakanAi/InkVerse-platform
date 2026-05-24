import { useDeferredValue, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import "./MyLibraryPage.css";
import LoadingState from "@/Shared/ui/LoadingState";
import ErrorState from "@/Shared/ui/ErrorState";
import EmptyState from "@/Shared/ui/EmptyState";
import DropdownSelect from "@/Shared/ui/DropdownSelect";
import LibraryBookCard from "@/features/Library/components/LibraryBookCard";
import { useLibrary } from "@/features/Library/hooks/useLibrary";
import LibraryFilter from "@/features/Library/librarayFilter";
import { getLibrarySortOptions } from "@/features/Library/library.presets";
import {
  filterLibraryItems,
  getLibraryCounts,
  sortLibraryItems,
} from "@/features/Library/utils/library.filters";

export default function MyLibraryPage() {
  const { t } = useTranslation();
  const { items, loading, error, changeStatus, remove, reload } = useLibrary();
  const [filter, setFilter] = useState("All");
  const [sort, setSort] = useState("recent");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const sortOptions = getLibrarySortOptions(t);

  const counts = useMemo(() => getLibraryCounts(items), [items]);

  const filtered = useMemo(() => {
    const visibleItems = filterLibraryItems(items, filter, deferredSearch);
    return sortLibraryItems(visibleItems, sort);
  }, [items, filter, deferredSearch, sort]);

  const emptyTitle =
    filter === "History"
      ? t("library.page.historyEmptyTitle")
      : t("library.page.filterEmptyTitle", { filter: filter.toLowerCase() });

  const emptySubtitle = deferredSearch
    ? t("library.page.searchEmptySubtitle")
    : t("library.page.emptySubtitle");

  if (loading) {
    return (
      <section className="iv-library-page">
        <div className="iv-library-shell">
          <LoadingState text={t("library.page.loading")} />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="iv-library-page">
        <div className="iv-library-shell">
          <ErrorState title={error} subtitle={t("library.page.errorSubtitle")} onRetry={reload} />
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
              <span className="iv-library-field__label">{t("library.page.searchTitle")}</span>
              <input
                type="search"
                className="iv-input iv-library-search"
                placeholder={t("library.page.searchPlaceholder")}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>

            <div className="iv-library-field">
              <span className="iv-library-field__label">{t("library.page.sortBy")}</span>
              <DropdownSelect value={sort} onChange={setSort} options={sortOptions} />
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
