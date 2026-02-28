export const RANKING_TABS = [
  { key: "topRated", label: "Top Rated", sortBy: "AverageRating", isAscending: false, minReviewCount: 3 },
  { key: "mostViewed", label: "Most Viewed", sortBy: "TotalViews", isAscending: false },
  { key: "mostReviewed", label: "Most Reviewed", sortBy: "ReviewsCount", isAscending: false },
  { key: "new", label: "New", sortBy: "CreatedAt", isAscending: false },
];

export const RANKING_TIME_RANGES = [
  { key: "All", label: "All Time" },
  { key: "Week", label: "This Week" },
  { key: "Month", label: "This Month" },
  { key: "HalfYear", label: "6 Months" },
  { key: "Year", label: "This Year" },
];

export const RANKING_STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "Ongoing", label: "Ongoing" },
  { value: "Completed", label: "Completed" },
];