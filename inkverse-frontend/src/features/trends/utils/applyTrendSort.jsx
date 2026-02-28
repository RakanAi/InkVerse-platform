export function applyTrendSort(trends, sortBy) {
  const list = [...trends];

  if (sortBy === "newest") {
    return list.sort(
      (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    );
  }

  if (sortBy === "az") {
    return list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  }

  return list.sort((a, b) => {
    const ao = a.sortOrder ?? 0;
    const bo = b.sortOrder ?? 0;
    if (ao !== bo) return ao - bo;
    return (a.name || "").localeCompare(b.name || "");
  });
}