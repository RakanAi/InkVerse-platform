import { getBookCoverSrc } from "@/domain/books/book-cover";
import { normalizeLibraryStatus } from "@/features/Library/library.presets";

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
    lastReadAt,
    lastReadChapterId,
    hasHistory: Boolean(lastReadAt),
    raw: x,
  };
}
