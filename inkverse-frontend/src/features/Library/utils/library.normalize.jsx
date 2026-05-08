import { getBookCoverSrc } from "@/domain/books/book-cover";
import { LIBRARY_STATUS_COPY, normalizeLibraryStatus } from "@/features/Library/library.presets";

function buildStatusLabel(status) {
  switch (status) {
    case "Completed":
      return "Finished";
    case "Planned":
      return "Planning";
    default:
      return status;
  }
}

export function normalizeLibraryItem(x) {
  const bookId = x.bookId ?? x.BookId ?? x.book?.id ?? x.Book?.Id;
  const title = x.title ?? x.Title ?? x.book?.title ?? x.Book?.Title ?? "Untitled";
  const status = normalizeLibraryStatus(x.status ?? x.Status ?? "Reading");
  const isInLibrary = x.isInLibrary ?? x.IsInLibrary ?? true;
  const lastReadAt = x.lastReadAt ?? x.LastReadAt ?? null;
  const lastReadChapterId =
    x.lastReadChapterId ?? x.LastReadChapterId ?? x.book?.lastReadChapterId ?? null;

  return {
    bookId,
    title,
    titleKey: String(title).trim().toLowerCase(),
    coverImageUrl: getBookCoverSrc(x),
    isInLibrary,
    status,
    statusKey: status.toLowerCase(),
    statusLabel: buildStatusLabel(status),
    statusCopy: isInLibrary
      ? LIBRARY_STATUS_COPY[status]
      : "Kept in your reading trail even after it left the active shelf.",
    lastReadAt,
    lastReadChapterId,
    hasHistory: Boolean(lastReadAt),
    raw: x,
  };
}
