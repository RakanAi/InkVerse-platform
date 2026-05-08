export const LIBRARY_FILTERS = [
  { value: "All", label: "All shelf", icon: "bi-collection" },
  { value: "Reading", label: "Reading", icon: "bi-book" },
  { value: "Completed", label: "Finished", icon: "bi-check2-circle" },
  { value: "Planned", label: "Planning", icon: "bi-bookmark" },
  { value: "Dropped", label: "Dropped", icon: "bi-x-circle" },
  { value: "History", label: "History", icon: "bi-clock-history" },
];

export const LIBRARY_STATUS_OPTIONS = [
  { value: "Reading", label: "Reading" },
  { value: "Completed", label: "Finished" },
  { value: "Planned", label: "Planning" },
  { value: "Dropped", label: "Dropped" },
];

export const LIBRARY_SORT_OPTIONS = [
  { value: "recent", label: "Recently opened" },
  { value: "title", label: "Title A-Z" },
  { value: "status", label: "Shelf status" },
];

export const LIBRARY_STATUS_COPY = {
  Reading: "Still in motion, with your next reading session waiting right where you left it.",
  Completed: "Finished, kept close, and ready for a revisit whenever the mood comes back.",
  Planned: "Queued on your shelf for the next time you want something new without searching again.",
  Dropped: "Set aside for now, but still close enough to return if the story pulls you back in.",
};

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
