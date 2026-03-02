import { TREND_SORT } from "../trend-details.presets";

export function getSortConfig(sortKey) {
  return TREND_SORT.find((x) => x.key === sortKey) ?? TREND_SORT[0];
}