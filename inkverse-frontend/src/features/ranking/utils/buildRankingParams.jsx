import { RANKING_TABS } from "../ranking.presets";

export function buildRankingParams(query) {
  const preset = RANKING_TABS.find((t) => t.key === query.tab) ?? RANKING_TABS[0];

  const params = {
    pageNumber: query.pageNumber ?? 1,
    pageSize: 20,
    sortBy: preset.sortBy,
    isAscending: !!preset.isAscending,
    timeRange: query.timeRange,
  };

  if (query.verseType) params.verseType = query.verseType;
  if (query.originType) params.originType = query.originType;
  if (query.status) params.statuses = [query.status];
  if (preset.minReviewCount != null) params.minReviewCount = preset.minReviewCount;

  return { params, preset };
}