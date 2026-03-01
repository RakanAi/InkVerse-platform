/**
 * Builds the /books query string from a params object.
 * Keeps API naming consistent (PascalCase) like your current usage.
 */
export function buildBooksQuery(params) {
  const sp = new URLSearchParams();

  if (params.sortBy) sp.set("SortBy", params.sortBy);
  if (typeof params.isAscending === "boolean")
    sp.set("IsAscending", String(params.isAscending));
  if (params.pageSize) sp.set("pageSize", String(params.pageSize));
  if (params.pageNumber) sp.set("pageNumber", String(params.pageNumber));

  return `/books?${sp.toString()}`;
}