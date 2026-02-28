export const VERSE_TYPES = ["Original", "Fanfic", "AU"] as const;
export type VerseType = (typeof VERSE_TYPES)[number];

export const ORIGIN_TYPES = ["PlatformOriginal", "Translation"] as const;
export type OriginType = (typeof ORIGIN_TYPES)[number];

export const STATUS_OPTIONS = ["Ongoing", "Completed", "Paused", "Dropped"] as const;
export type BookStatus = (typeof STATUS_OPTIONS)[number];

export const SORT_OPTIONS = [
  { value: "UpdatedAt", label: "Updated" },
  { value: "CreatedAt", label: "New" },
  { value: "Random", label: "Random" },
  { value: "TotalViews", label: "Views" },
  { value: "Title", label: "Name" },
  { value: "ChapterCount", label: "Chapters" },
  { value: "AverageRating", label: "Rating" },
  { value: "ReviewCount", label: "Reviews" },
] as const;

export type SortBy = (typeof SORT_OPTIONS)[number]["value"];