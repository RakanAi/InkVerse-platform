export function buildPopularTagsEndpoint({ take }) {
  const sp = new URLSearchParams();
  if (take) sp.set("take", String(take));
  return `/tags/popular?${sp.toString()}`;
}