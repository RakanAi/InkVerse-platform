function byRecentActivity(a, b) {
  return new Date(b.lastReadAt || 0) - new Date(a.lastReadAt || 0);
}

export function getLibraryCounts(items) {
  return items.reduce(
    (counts, item) => {
      if (item.isInLibrary) {
        counts.All += 1;

        if (counts[item.status] !== undefined) {
          counts[item.status] += 1;
        }
      }

      if (item.hasHistory) {
        counts.History += 1;
      }

      return counts;
    },
    {
      All: 0,
      Reading: 0,
      Completed: 0,
      Planned: 0,
      Dropped: 0,
      History: 0,
    },
  );
}

export function filterLibraryItems(items, filter, search = "") {
  const query = search.trim().toLowerCase();

  let nextItems =
    filter === "History"
      ? items.filter((item) => item.hasHistory)
      : items.filter((item) => item.isInLibrary);

  if (filter !== "All" && filter !== "History") {
    nextItems = nextItems.filter((item) => item.status === filter);
  }

  if (!query) {
    return nextItems;
  }

  return nextItems.filter((item) => item.titleKey.includes(query));
}

export function sortLibraryItems(items, sort = "recent") {
  const nextItems = [...items];

  switch (sort) {
    case "title":
      return nextItems.sort((a, b) => a.titleKey.localeCompare(b.titleKey));
    case "status":
      return nextItems.sort((a, b) => {
        const statusOrder = ["Reading", "Planned", "Completed", "Dropped"];
        return statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status);
      });
    case "recent":
    default:
      return nextItems.sort(byRecentActivity);
  }
}

export function formatLibraryTimestamp(value) {
  if (!value) return "No recent reading yet";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "No recent reading yet";
  }

  const diff = Date.now() - date.getTime();
  const day = 86_400_000;

  if (diff < day) return "Opened today";
  if (diff < day * 2) return "Opened yesterday";
  if (diff < day * 7) return `Opened ${Math.max(2, Math.round(diff / day))} days ago`;

  return `Opened ${new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(date)}`;
}
