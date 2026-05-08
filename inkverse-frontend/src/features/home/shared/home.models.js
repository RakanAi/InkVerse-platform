/**
 * @typedef {Object} HomeBookPreview
 * @property {number | string | null} id
 * @property {string} title
 * @property {number | string | null} authorId
 * @property {string} authorName
 * @property {number | null} averageRating
 * @property {number} totalViews
 * @property {string} status
 */

/**
 * @typedef {Object} HomeTrendPreview
 * @property {number | string | null} id
 * @property {string} name
 * @property {string} slug
 * @property {string} description
 * @property {string} imageUrl
 */

export function getCollectionItems(data) {
  if (Array.isArray(data)) return data;
  return data?.items ?? [];
}

export function shuffleItems(items) {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }

  return copy;
}

/**
 * @param {Record<string, any>} book
 * @returns {HomeBookPreview}
 */
export function normalizeHomeBookPreview(book) {
  const averageRating = Number(book?.averageRating ?? book?.AverageRating);

  return {
    id: book?.id ?? book?.Id ?? null,
    title: book?.title ?? book?.Title ?? "Untitled",
    authorId: book?.authorId ?? book?.AuthorId ?? book?.userId ?? book?.UserId ?? null,
    authorName:
      book?.authorName ??
      book?.AuthorName ??
      book?.userName ??
      book?.UserName ??
      "Unknown author",
    averageRating: Number.isFinite(averageRating) ? averageRating : null,
    totalViews: Number(book?.totalViews ?? book?.TotalViews ?? 0),
    status: book?.status ?? book?.Status ?? "",
  };
}

/**
 * @param {Record<string, any>} trend
 * @returns {HomeTrendPreview}
 */
export function normalizeHomeTrendPreview(trend) {
  return {
    id: trend?.id ?? trend?.Id ?? trend?.ID ?? null,
    name: trend?.name ?? trend?.Name ?? "",
    slug: trend?.slug ?? trend?.Slug ?? "",
    description: trend?.description ?? trend?.Description ?? "",
    imageUrl: trend?.imageUrl ?? trend?.ImageUrl ?? "",
  };
}
