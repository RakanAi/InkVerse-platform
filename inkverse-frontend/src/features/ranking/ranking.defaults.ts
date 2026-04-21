import type { RankingQuery } from "./ranking.query";

export const DEFAULT_RANKING_QUERY: RankingQuery = {
  tab: "topRated",
  timeRange: "All",
  verseType: "",
  originType: "",
  status: "",
  pageNumber: 1,
};