import type { BrowseQuery } from "@/features/browse/browse.query";

export const DEFAULT_BROWSE_QUERY: BrowseQuery = {
  verseType: "Original",
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
};