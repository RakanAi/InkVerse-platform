export const RANKING_TABS = [
  { key: "topRated", sortBy: "AverageRating", isAscending: false, minReviewCount: 3 },
  { key: "mostViewed", sortBy: "TotalViews", isAscending: false },
  { key: "mostReviewed", sortBy: "ReviewsCount", isAscending: false },
  { key: "new", sortBy: "CreatedAt", isAscending: false },
];

export function getRankingTabs(t) {
  return RANKING_TABS.map((tab) => ({
    ...tab,
    label: t(`ranking.tabs.${tab.key}`),
  }));
}

export function getRankingTimeRanges(t) {
  return [
    { key: "All", label: t("ranking.timeRanges.All") },
    { key: "Week", label: t("ranking.timeRanges.Week") },
    { key: "Month", label: t("ranking.timeRanges.Month") },
    { key: "HalfYear", label: t("ranking.timeRanges.HalfYear") },
    { key: "Year", label: t("ranking.timeRanges.Year") },
  ];
}

export function getRankingStatusOptions(t) {
  return [
    { value: "", label: t("ranking.statuses.all") },
    { value: "Ongoing", label: t("ranking.statuses.ongoing") },
    { value: "Completed", label: t("ranking.statuses.completed") },
  ];
}
