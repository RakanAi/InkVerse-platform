export function normalizeLibraryItem(x) {
  const bookId = x.bookId ?? x.BookId ?? x.book?.id ?? x.Book?.Id;
  return {
    bookId,
    title: x.title ?? x.Title ?? x.book?.title ?? x.Book?.Title ?? "Untitled",
    coverImageUrl: x.coverImageUrl ?? x.CoverImageUrl ?? x.book?.coverImageUrl ?? x.Book?.CoverImageUrl,
    isInLibrary: x.isInLibrary ?? x.IsInLibrary ?? true,
    status: x.status ?? x.Status ?? "Reading",
    lastReadAt: x.lastReadAt ?? x.LastReadAt ?? null,
    raw: x, // optional for debugging
  };
}