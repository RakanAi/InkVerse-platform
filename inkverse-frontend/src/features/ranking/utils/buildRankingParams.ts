import type { RankingQuery } from "../ranking.query";
import { RANKING_TABS } from "../ranking.presets";

export function buildRankingParams(q: RankingQuery) {
  const preset = RANKING_TABS.find(t => t.key === q.tab) ?? RANKING_TABS[0];

  const p: any = {
    pageNumber: q.pageNumber ?? 1,
    pageSize: 20,
    sortBy: preset.sortBy,
    isAscending: !!preset.isAscending,
    timeRange: q.timeRange,
  };

  if (q.verseType) p.verseType = q.verseType;
  if (q.originType) p.originType = q.originType;

  if (q.status) p.statuses = [q.status]; // keep backend shape consistent with Browse

  if (preset.minReviewCount != null) p.minReviewCount = preset.minReviewCount;

  return { params: p, preset };
}