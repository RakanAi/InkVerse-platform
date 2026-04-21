import type { RankingTabKey, RankingTimeRange } from "./ranking.query";

export const RANKING_TABS: Array<{
  key: RankingTabKey;
  label: string;
  sortBy: string;
  isAscending: boolean;
  minReviewCount?: number;
}> = [
  { key: "topRated", label: "Top Rated", sortBy: "AverageRating", isAscending: false, minReviewCount: 3 },
  { key: "mostViewed", label: "Most Viewed", sortBy: "TotalViews", isAscending: false },
  { key: "mostReviewed", label: "Most Reviewed", sortBy: "ReviewCount", isAscending: false },
  { key: "new", label: "New", sortBy: "CreatedAt", isAscending: false },
];

export const RANKING_TIME_RANGES: Array<{ key: RankingTimeRange; label: string }> = [
  { key: "All", label: "All Time" },
  { key: "Week", label: "This Week" },
  { key: "Month", label: "This Month" },
  { key: "HalfYear", label: "6 Months" },
  { key: "Year", label: "This Year" },
];