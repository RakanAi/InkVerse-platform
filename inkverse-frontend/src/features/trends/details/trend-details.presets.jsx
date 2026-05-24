export const TREND_DETAILS = {
  pageSize: 24,
  headerMaxWidth: 1000,
};

export const TREND_SORT = [
  { key: "newest", sortBy: "CreatedAt", isAscending: false },
  { key: "rating", sortBy: "AverageRating", isAscending: false },
  { key: "views", sortBy: "TotalViews", isAscending: false },
  { key: "az", sortBy: "Title", isAscending: true },
];

export function getTrendSort(t) {
  return TREND_SORT.map((option) => ({
    ...option,
    label: t(`trends.details.sortOptions.${option.key}`),
  }));
}
