export function buildTopByVerseEndpoint({ verseType, take }) {
  const sp = new URLSearchParams();
  sp.set("verseType", verseType);
  sp.set("take", String(take));
  return `/books/top-by-verse?${sp.toString()}`;
}