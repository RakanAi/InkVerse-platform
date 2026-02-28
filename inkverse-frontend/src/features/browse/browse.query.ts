import type { VerseType, OriginType, BookStatus, SortBy } from "@/domain/books/book-filters";

export interface BrowseQuery {
  verseType: VerseType;
  search: string;
  sortBy: SortBy;
  isAscending: boolean;

  statuses: BookStatus[];
  originType: "" | OriginType;

  minRating: string;
  minReviewCount: string;

  genreIds: number[];
  excludeGenreIds: number[];
  tagIds: number[];
  excludeTagIds: number[];

  pageNumber: number;
}