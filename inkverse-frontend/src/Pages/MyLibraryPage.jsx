import { useMemo, useState } from "react";
import PageHeader from "@/Shared/ui/PageHeader";
import LoadingState from "@/Shared/ui/LoadingState";
import EmptyState from "@/Shared/ui/EmptyState";
import LibraryCard from "@/Shared/Books/BookCover/LibraryCard";
import { useLibrary } from "@/features/Library/hooks/useLibrary";
import LibraryFilter from "@/features/Library/librarayFilter";

export default function MyLibraryPage() {
  const { items, loading, error, changeStatus, remove } = useLibrary();
  const [filter, setFilter] = useState("All");

  const filtered = useMemo(() => {
    if (filter === "All") return items;
    if (filter === "History")
      return items.filter((b) => b.lastReadAt ?? b.LastReadAt);
    return items.filter(
      (b) => (b.status ?? b.Status) === filter
    );
  }, [items, filter]);

  if (loading) return <LoadingState title="Loading library..." />;
  if (error) return <ErrorState title={error} />;


return (
  <div className="container iv-page  py-3">
<PageHeader
  title="My Library"
  subtitle={
    filter === "All"
      ? `You have ${items.length} total book${items.length !== 1 ? "s" : ""}`
      : `You have ${filtered.length} book${filtered.length !== 1 ? "s" : ""} in ${filter}`
  }
/>
    <div className="d-flex justify-content-center my-3">
      <LibraryFilter value={filter} onChange={setFilter} />
    </div>

    {loading ? (
      <LoadingState title="Loading library..." />
    ) : error ? (
      <ErrorState title={error} />
    ) : filtered.length === 0 ? (
      <EmptyState
        title={filter === "History" ? "No reading history yet." : "No books in this filter."}
      />
    ) : (
      <div className="row g-3 mt-2">
        {filtered.map((b) => (
          <div key={b.bookId ?? b.BookId} className="col-6 col-md-3 d-flex">
            <LibraryCard item={b} onChangeStatus={changeStatus} onRemove={remove} />
          </div>
        ))}
      </div>
    )}
  </div>
);
}