export function buildRecentReviewsEndpoint({ take }) {
  const sp = new URLSearchParams();
  if (take) sp.set("take", String(take));
  return `/reviews/recent?${sp.toString()}`;
}
