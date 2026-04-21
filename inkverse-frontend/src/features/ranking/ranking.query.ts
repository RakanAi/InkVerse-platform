import type { VerseType, OriginType, BookStatus } from "@/domain/books/book-filters";

export type RankingTabKey = "topRated" | "mostViewed" | "mostReviewed" | "new";
export type RankingTimeRange = "All" | "Week" | "Month" | "HalfYear" | "Year";

export interface RankingQuery {
  tab: RankingTabKey;
  timeRange: RankingTimeRange;

  verseType: "" | VerseType;
  originType: "" | OriginType;
  status: "" | BookStatus; // keep single-select for now (easy to upgrade later)

  pageNumber: number;
}