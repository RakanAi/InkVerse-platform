export const TRENDS_QUERY = {
  take: 7,
};

export function getTrendsLabels(t) {
  return {
    title: t("home.trends.title"),
    subtitle: t("home.trends.subtitle"),
    cta: t("home.trends.cta"),
    badge: t("home.trends.badge"),
    action: t("home.trends.action"),
    loading: t("home.trends.loading"),
    empty: t("home.trends.empty"),
    error: t("home.trends.error"),
  };
}
