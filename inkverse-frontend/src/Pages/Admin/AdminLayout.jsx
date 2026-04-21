import { NavLink, Outlet, useLocation } from "react-router-dom";
import Surface from "../../Shared/ui/Surface";
import "./AdminExperience.css";

const NAV_ITEMS = [
  { to: "/admin", label: "Dashboard", exact: true },
  { to: "/admin/books", label: "Books" },
  { to: "/admin/trends", label: "Trends" },
  { to: "/admin/tags", label: "Tags" },
  { to: "/admin/genres", label: "Genres" },
  { to: "/admin/users", label: "Manage Users" },
];

const ROUTE_TITLES = {
  "/admin": "Admin Dashboard",
  "/admin/books": "Book Management",
  "/admin/trends": "Trend Management",
  "/admin/tags": "Tag Management",
  "/admin/genres": "Genre Management",
  "/admin/users": "User Management",
};

export default function AdminLayout() {
  const { pathname } = useLocation();
  const routeTitle =
    Object.entries(ROUTE_TITLES).find(([key]) => pathname.startsWith(key))?.[1] ||
    "Admin";

  return (
    <div className="admin-shell">
      <div className="container-fluid admin-shell-grid">
        <aside className="admin-sidebar-col">
          <Surface className="admin-sidebar-surface">
            <div className="admin-brand-row">
              <div>
                <p className="admin-brand-kicker mb-1">Control Center</p>
                <h2 className="admin-brand-title mb-0">InkVerse Admin</h2>
              </div>
            </div>

            <nav className="admin-nav-list" aria-label="Admin navigation">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.exact}
                  className={({ isActive }) =>
                    `admin-nav-link ${isActive ? "is-active" : ""}`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </Surface>
        </aside>

        <main className="admin-main-col">
          <Surface className="admin-main-surface">
            <div className="admin-main-topbar">
              <div>
                <p className="admin-main-kicker mb-1">Workspace</p>
                <h1 className="admin-main-title mb-0">{routeTitle}</h1>
              </div>
            </div>

            <div className="admin-outlet-wrap">
              <Outlet />
            </div>
          </Surface>
        </main>
      </div>
    </div>
  );
}
