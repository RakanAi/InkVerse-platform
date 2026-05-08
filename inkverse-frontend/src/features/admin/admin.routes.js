export const ADMIN_NAV_ITEMS = [
  { to: "/admin", label: "Dashboard", exact: true },
  { to: "/admin/books", label: "Books" },
  { to: "/admin/trends", label: "Trends" },
  { to: "/admin/tags", label: "Tags" },
  { to: "/admin/genres", label: "Genres" },
  { to: "/admin/users", label: "Users" },
];

const ADMIN_ROUTE_META = [
  {
    match: (pathname) => pathname === "/admin",
    title: "Dashboard",
    subtitle: "Catalog health, moderation, and publishing at a glance.",
  },
  {
    match: (pathname) => pathname === "/admin/books",
    title: "Books",
    subtitle: "Manage titles, taxonomy, and chapter entry points.",
  },
  {
    match: (pathname) => pathname === "/admin/books/new",
    title: "New Book",
    subtitle: "Create a new title and prepare it for publishing.",
  },
  {
    match: (pathname) =>
      /^\/admin\/books\/[^/]+\/chapters\/new$/.test(pathname),
    title: "New Chapter",
    subtitle: "Draft a chapter and place it in the right arc.",
  },
  {
    match: (pathname) =>
      /^\/admin\/books\/[^/]+\/chapters\/[^/]+$/.test(pathname),
    title: "Edit Chapter",
    subtitle: "Update chapter content, numbering, and arc placement.",
  },
  {
    match: (pathname) => /^\/admin\/books\/[^/]+\/chapters$/.test(pathname),
    title: "Chapters",
    subtitle: "Organize arcs, import batches, and keep chapter order clean.",
  },
  {
    match: (pathname) =>
      /^\/admin\/books\/[^/]+$/.test(pathname) && pathname !== "/admin/books/new",
    title: "Edit Book",
    subtitle: "Update metadata, cover art, and discovery settings.",
  },
  {
    match: (pathname) => pathname === "/admin/trends",
    title: "Trends",
    subtitle: "Curate spotlight collections and connected books.",
  },
  {
    match: (pathname) => pathname === "/admin/tags",
    title: "Tags",
    subtitle: "Keep reader-facing tags clean, searchable, and active.",
  },
  {
    match: (pathname) => pathname === "/admin/genres",
    title: "Genres",
    subtitle: "Manage the shelf structure readers browse by.",
  },
  {
    match: (pathname) => pathname === "/admin/users",
    title: "Users",
    subtitle: "Handle moderation and account restrictions.",
  },
];

export function getAdminRouteMeta(pathname) {
  return (
    ADMIN_ROUTE_META.find((item) => item.match(pathname)) ?? {
      title: "Admin",
      subtitle: "Manage the platform workspace.",
    }
  );
}
