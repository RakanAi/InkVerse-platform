export function getTrendSortOptions(t) {
  return [
    { value: "sortOrder", label: t("trends.sortOptions.sortOrder") },
    { value: "newest", label: t("trends.sortOptions.newest") },
    { value: "az", label: t("trends.sortOptions.az") },
  ];
}

export const TREND_PAGE_SIZE = 12;
export const TREND_FEATURED_COUNT = 3;
