export function getLoginFeatures(t) {
  return t("auth.login.aside.features", { returnObjects: true });
}

export function getRegisterFeatures(t) {
  return {
    eyebrow: t("auth.register.aside.eyebrow"),
    title: t("auth.register.aside.title"),
    text: t("auth.register.aside.text"),
  };
}
