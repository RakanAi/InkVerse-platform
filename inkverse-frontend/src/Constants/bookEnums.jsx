export const VERSE_TYPES = [
  { value: "", label: "All Verse Types" },
  { value: "Original", label: "Original" },
  { value: "Fanfic", label: "Fanfic" },
  { value: "AlternateUniverse", label: "AU (Alternate Universe)" },
];

// Optional: accept AU shorthand anywhere
export function normalizeVerseType(v) {
  if (!v) return "";
  const s = String(v).trim();
  if (s.toLowerCase() === "au") return "AlternateUniverse";
  return s;
}

export const ORIGIN_TYPES = [
  { value: "", label: "All Origins" },
  { value: "PlatformOriginal", label: "InkVerse Original" },
  { value: "Imported", label: "Imported" },
  { value: "Translated", label: "Translated" },
];
