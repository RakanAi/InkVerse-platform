export function getHomeHeroContent(t) {
  return {
    eyebrow: t("home.hero.eyebrow"),
    title: t("home.hero.title"),
    subtitle: t("home.hero.subtitle"),
    primaryAction: {
      label: t("home.hero.primaryAction"),
      to: "/Browser",
    },
    secondaryAction: {
      label: t("home.hero.secondaryAction"),
      to: "/Author",
    },
    pills: t("home.hero.pills", { returnObjects: true }),
    posterLabel: t("home.hero.posterLabel"),
    posterText: t("home.hero.posterText"),
    posterAlt: t("home.hero.posterAlt"),
  };
}
