export function filterLibraryItems(items, filter) {
  if (filter === "All") return items;
  if (filter === "History") return items.filter((b) => !!b.lastReadAt);
  return items.filter((b) => b.status === filter);
}

export function sortLibraryItems(items, filter) {
  if (filter !== "History") return items;
  return [...items].sort(
    (a, b) => new Date(b.lastReadAt || 0) - new Date(a.lastReadAt || 0),
  );
}