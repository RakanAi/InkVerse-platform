export function getLibraryFilters(t) {
  return [
    { value: "All", label: t("library.filters.All"), icon: "bi-collection" },
    { value: "Reading", label: t("library.filters.Reading"), icon: "bi-book" },
    { value: "Completed", label: t("library.filters.Completed"), icon: "bi-check2-circle" },
    { value: "Planned", label: t("library.filters.Planned"), icon: "bi-bookmark" },
    { value: "Dropped", label: t("library.filters.Dropped"), icon: "bi-x-circle" },
    { value: "History", label: t("library.filters.History"), icon: "bi-clock-history" },
  ];
}

export function getLibraryStatusOptions(t) {
  return [
    { value: "Reading", label: t("library.statusOptions.Reading") },
    { value: "Completed", label: t("library.statusOptions.Completed") },
    { value: "Planned", label: t("library.statusOptions.Planned") },
    { value: "Dropped", label: t("library.statusOptions.Dropped") },
  ];
}

export function getLibrarySortOptions(t) {
  return [
    { value: "recent", label: t("library.sortOptions.recent") },
    { value: "title", label: t("library.sortOptions.title") },
    { value: "status", label: t("library.sortOptions.status") },
  ];
}

export function getLibraryStatusCopy(t) {
  return {
    Reading: t("library.statusCopy.Reading"),
    Completed: t("library.statusCopy.Completed"),
    Planned: t("library.statusCopy.Planned"),
    Dropped: t("library.statusCopy.Dropped"),
  };
}

export function normalizeLibraryStatus(value) {
  return ["Reading", "Completed", "Planned", "Dropped"].includes(value)
    ? value
    : "Reading";
}

export function getLibraryStatusTone(status) {
  switch (status) {
    case "Completed":
      return "finished";
    case "Planned":
      return "planned";
    case "Dropped":
      return "dropped";
    case "Reading":
    default:
      return "reading";
  }
}
