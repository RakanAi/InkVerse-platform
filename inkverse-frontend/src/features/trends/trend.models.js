import { absUrl } from "@/Utils/absUrl";

/**
 * @typedef {Object} TrendPreview
 * @property {number | null} id
 * @property {string} name
 * @property {string} slug
 * @property {string} description
 * @property {string} imageUrl
 * @property {boolean} isActive
 * @property {number} sortOrder
 * @property {string | null} createdAt
 */

/**
 * @param {Record<string, any>} trend
 * @returns {TrendPreview}
 */
export function normalizeTrendPreview(trend) {
  return {
    id: Number(
      trend?.id ?? trend?.Id ?? trend?.ID ?? trend?.trendId ?? trend?.TrendId ?? 0,
    ) || null,
    name: trend?.name ?? trend?.Name ?? "Untitled Trend",
    slug: trend?.slug ?? trend?.Slug ?? "",
    description:
      trend?.description ?? trend?.Description ?? "Explore this curated collection.",
    imageUrl: trend?.imageUrl ?? trend?.ImageUrl ?? "",
    isActive: trend?.isActive ?? trend?.IsActive ?? true,
    sortOrder: Number(trend?.sortOrder ?? trend?.SortOrder ?? 0),
    createdAt: trend?.createdAt ?? trend?.CreatedAt ?? null,
  };
}

export function getTrendImageSrc(trend) {
  return absUrl(trend?.imageUrl ?? "");
}

export function selectActiveTrends(trends) {
  return trends.filter((trend) => trend?.isActive !== false);
}

export function splitTrendCollection(trends, featuredCount) {
  const featured = trends.slice(0, featuredCount);
  const remainder = trends.slice(featuredCount);

  return {
    featured,
    remainder,
  };
}

export function getTrendBadgeLabel(trend) {
  if (trend?.slug) {
    return trend.slug.replace(/[-_]+/g, " ");
  }

  return "Curated concept";
}
