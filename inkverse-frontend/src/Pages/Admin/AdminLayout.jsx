import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  ADMIN_NAV_ITEMS,
  getAdminRouteMeta,
} from "../../features/admin/admin.routes";
import "./AdminExperience.css";

export default function AdminLayout() {
  const { pathname } = useLocation();
  const routeMeta = getAdminRouteMeta(pathname);
  const topbarHiddenRoutes = new Set([
    "/admin",
    "/admin/books",
    "/admin/trends",
    "/admin/tags",
    "/admin/genres",
    "/admin/users",
  ]);
  const showTopbar = !topbarHiddenRoutes.has(pathname);

  return (
    <div className="admin-shell">
      <div className="container-fluid admin-shell-grid">
        <aside className="admin-sidebar-col">
          <div className="admin-sidebar-surface">
            <p className="admin-sidebar-kicker">Admin workspace</p>
            <h2 className="admin-sidebar-title">InkVerse</h2>
            <p className="admin-sidebar-copy">
              Books, moderation, taxonomy, and trend curation in one place.
            </p>

            <nav className="admin-nav-list" aria-label="Admin navigation">
              {ADMIN_NAV_ITEMS.map((item) => (
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
          </div>
        </aside>

        <main className="admin-main-col">
          <div className="admin-main-frame">
            {showTopbar ? (
              <header className="admin-main-topbar">
                <p className="admin-main-kicker">Admin</p>
                <h1 className="admin-main-title">{routeMeta.title}</h1>
                {routeMeta.subtitle ? (
                  <p className="admin-main-subtitle">{routeMeta.subtitle}</p>
                ) : null}
              </header>
            ) : null}

            <div className="admin-outlet-wrap">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
