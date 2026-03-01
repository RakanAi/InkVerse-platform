export function normalizeTopBooksResponse(data) {
  if (Array.isArray(data)) return data;
  return data?.items ?? [];
}