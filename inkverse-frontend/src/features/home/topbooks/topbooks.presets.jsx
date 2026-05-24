export const TOPBOOKS_TAKE = 5;

export function getTopBooksVerseTypes(t) {
  return [
    { key: "Original", title: t("home.topBooks.verseTypes.Original") },
    { key: "AU", title: t("home.topBooks.verseTypes.AU") },
    { key: "Fanfic", title: t("home.topBooks.verseTypes.Fanfic") },
  ];
}

export function getTopBooksLabels(t) {
  return {
    title: t("home.topBooks.title"),
    subtitle: t("home.topBooks.subtitle"),
    cta: t("home.topBooks.cta"),
    browseShelf: t("home.topBooks.browseShelf"),
  };
}
