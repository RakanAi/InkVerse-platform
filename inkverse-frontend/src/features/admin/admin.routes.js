export function getAdminNavItems(t) {
  return [
    { to: "/admin", label: t("admin.nav.dashboard"), exact: true },
    { to: "/admin/books", label: t("admin.nav.books") },
    { to: "/admin/characters", label: t("admin.nav.characters") },
    { to: "/admin/contracts", label: t("admin.nav.contracts", { defaultValue: "Contracts" }) },
    { to: "/admin/reports", label: t("admin.nav.reports", { defaultValue: "Reports" }) },
    { to: "/admin/moderation", label: t("admin.nav.moderation", { defaultValue: "Moderation" }) },
    { to: "/admin/notifications", label: t("admin.nav.notifications", { defaultValue: "Notifications" }) },
    { to: "/admin/visual-assets", label: t("admin.nav.visualAssets", { defaultValue: "Visual assets" }) },
    { to: "/admin/trends", label: t("admin.nav.trends") },
    { to: "/admin/tags", label: t("admin.nav.tags") },
    { to: "/admin/genres", label: t("admin.nav.genres") },
    { to: "/admin/users", label: t("admin.nav.users") },
  ];
}

const ADMIN_ROUTE_META = [
  {
    match: (pathname) => pathname === "/admin",
    key: "dashboard",
  },
  {
    match: (pathname) => pathname === "/admin/books",
    key: "books",
  },
  {
    match: (pathname) => pathname === "/admin/characters",
    key: "characters",
  },
  {
    match: (pathname) => pathname === "/admin/contracts",
    key: "contracts",
  },
  {
    match: (pathname) => pathname === "/admin/reports",
    key: "reports",
  },
  {
    match: (pathname) => pathname === "/admin/moderation",
    key: "moderation",
  },
  {
    match: (pathname) => pathname === "/admin/notifications",
    key: "notifications",
  },
  {
    match: (pathname) => pathname === "/admin/visual-assets",
    key: "visualAssets",
  },
  {
    match: (pathname) => pathname === "/admin/books/new",
    key: "newBook",
  },
  {
    match: (pathname) =>
      /^\/admin\/books\/[^/]+\/chapters\/new$/.test(pathname),
    key: "newChapter",
  },
  {
    match: (pathname) =>
      /^\/admin\/books\/[^/]+\/chapters\/[^/]+$/.test(pathname),
    key: "editChapter",
  },
  {
    match: (pathname) => /^\/admin\/books\/[^/]+\/chapters$/.test(pathname),
    key: "chapters",
  },
  {
    match: (pathname) =>
      /^\/admin\/books\/[^/]+$/.test(pathname) && pathname !== "/admin/books/new",
    key: "editBook",
  },
  {
    match: (pathname) => pathname === "/admin/trends",
    key: "trends",
  },
  {
    match: (pathname) => pathname === "/admin/tags",
    key: "tags",
  },
  {
    match: (pathname) => pathname === "/admin/genres",
    key: "genres",
  },
  {
    match: (pathname) => pathname === "/admin/users",
    key: "users",
  },
];

export function getAdminRouteMeta(pathname, t) {
  const match = ADMIN_ROUTE_META.find((item) => item.match(pathname));
  const key = match?.key ?? "fallback";

  return {
    title: t(`admin.routes.${key}.title`, {
      defaultValue:
        key === "contracts"
          ? "Contracts"
          : key === "reports"
            ? "Reports"
            : key === "moderation"
              ? "Moderation"
              : key === "notifications"
                ? "Notifications"
                : key === "visualAssets"
                  ? "Visual assets"
                  : "Admin",
    }),
    subtitle: t(`admin.routes.${key}.subtitle`, {
      defaultValue:
        key === "contracts"
          ? "Review eligible books and manage active contracts."
          : key === "reports"
            ? "Review reader and author reports from across the platform."
            : key === "moderation"
              ? "Let Clawbot handle repeated moderation work and review only risky cases."
              : key === "notifications"
                ? "Send persisted in-app notices without email or push."
                : key === "visualAssets"
                  ? "Control page artwork slots used across the public experience."
                  : "",
    }),
  };
}
