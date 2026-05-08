export const NEWBOOKS_VISIBLE_BY_WIDTH = [
  { minWidth: 992, count: 6 },
  { minWidth: 768, count: 4 },
  { minWidth: 0, count: 3 },
];

export const NEWBOOKS_QUERY = {
  sortBy: "CreatedAt",
  isAscending: false,
  pageSize: 6,
  pageNumber: 1,
};

export const NEWBOOKS_LABELS = {
  title: "New on InkVerse",
  subtitle: "Fresh shelves, new obsessions, and the latest worlds added to the platform.",
  cta: "Browse all",
  loading: "Loading new books…",
  empty: "No books yet.",
  error: "Failed to load new books.",
};
