export const TOPTAGS_QUERY = {
  take: 80,
};

export function getTopTagsLabels(t) {
  return {
    title: t("home.tags.title"),
    subtitle: t("home.tags.subtitle"),
    cta: t("home.tags.cta"),
    badge: t("home.tags.badge"),
    directoryKicker: t("home.tags.directoryKicker"),
    directoryText: t("home.tags.directoryText"),
    visualHint: t("home.tags.visualHint"),
    visualAlt: t("home.tags.visualAlt"),
    loading: t("home.tags.loading"),
    empty: t("home.tags.empty"),
    error: t("home.tags.error"),
    errorSubtitle: t("home.tags.errorSubtitle"),
  };
}
