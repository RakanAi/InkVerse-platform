export const TREND_DETAILS = {
  pageSize: 24,
  headerMaxWidth: 1000,
};

export const TREND_SORT = [
  { key: "newest", label: "Newest", sortBy: "CreatedAt", isAscending: false },
  { key: "rating", label: "Top Rated", sortBy: "AverageRating", isAscending: false },
  { key: "views", label: "Most Viewed", sortBy: "TotalViews", isAscending: false },
  { key: "az", label: "A → Z", sortBy: "Title", isAscending: true },
];