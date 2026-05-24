import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import api from "../../Api/api";
import {
  getAdminNavItems,
  getAdminRouteMeta,
} from "../../features/admin/admin.routes";
import ThemeToggle from "../../Shared/ui/ThemeToggle";
import "./AdminExperience.css";

export default function AdminLayout() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const routeMeta = getAdminRouteMeta(pathname, t);
  const adminNavItems = getAdminNavItems(t);
  const [adminPulse, setAdminPulse] = useState({
    books: null,
    chapters: null,
    trends: null,
    users: null,
    contracts: null,
    reports: null,
    moderation: null,
    clawbotToday: null,
  });

  useEffect(() => {
    let active = true;

    const loadPulse = async () => {
      try {
        const [statsRes, usersRes] = await Promise.all([
          api.get("/admin/dashboard/stats"),
          api.get("/admin/users"),
        ]);

        if (!active) return;

        const users = Array.isArray(usersRes.data) ? usersRes.data.length : null;
        setAdminPulse({
          books: statsRes.data?.books ?? null,
          chapters: statsRes.data?.chapters ?? null,
          trends: statsRes.data?.trends ?? null,
          users,
          contracts: statsRes.data?.contractCandidates ?? null,
          reports: statsRes.data?.openReports ?? null,
          moderation: statsRes.data?.openModerationCases ?? null,
          clawbotToday: statsRes.data?.clawbotAutoHandledToday ?? null,
        });
      } catch (error) {
        console.error("Failed to load admin pulse:", error);
      }
    };

    loadPulse();
    return () => {
      active = false;
    };
  }, []);

  const pulseItems = useMemo(
    () => [
      {
        icon: "bi-robot",
        label: t("admin.layout.metrics.moderation.label", { defaultValue: "Moderation" }),
        value:
          adminPulse.moderation != null
            ? adminPulse.moderation.toLocaleString()
            : "—",
        meta: t("admin.layout.metrics.moderation.meta", {
          defaultValue: `${adminPulse.clawbotToday ?? "—"} auto today`,
        }),
        tone: Number(adminPulse.moderation) > 0 ? "brand" : undefined,
      },
      {
        icon: "bi-flag",
        label: t("admin.layout.metrics.reports.label", { defaultValue: "Reports" }),
        value:
          adminPulse.reports != null
            ? adminPulse.reports.toLocaleString()
            : "—",
        meta: t("admin.layout.metrics.reports.meta", { defaultValue: "Open" }),
        tone: Number(adminPulse.reports) > 0 ? "brand" : undefined,
      },
      {
        icon: "bi-file-earmark-check",
        label: t("admin.layout.metrics.contracts.label", { defaultValue: "Contracts" }),
        value:
          adminPulse.contracts != null
            ? adminPulse.contracts.toLocaleString()
            : "—",
        meta: t("admin.layout.metrics.contracts.meta", { defaultValue: "Candidates" }),
        tone: "brand",
      },
      {
        icon: "bi-people",
        label: t("admin.layout.metrics.users.label"),
        value:
          adminPulse.users != null ? adminPulse.users.toLocaleString() : "—",
        meta: t("admin.layout.metrics.users.meta"),
      },
      {
        icon: "bi-journal-richtext",
        label: t("admin.layout.metrics.chapters.label"),
        value:
          adminPulse.chapters != null
            ? adminPulse.chapters.toLocaleString()
            : "—",
        meta: t("admin.layout.metrics.chapters.meta"),
      },
      {
        icon: "bi-stars",
        label: t("admin.layout.metrics.trends.label"),
        value:
          adminPulse.trends != null ? adminPulse.trends.toLocaleString() : "—",
        meta: t("admin.layout.metrics.trends.meta"),
      },
    ],
    [adminPulse, t]
  );

  const hideDynamicBookEditorTopbar =
    pathname === "/admin/books/new" || /^\/admin\/books\/[^/]+$/.test(pathname);
  const hideDynamicChapterEditorTopbar =
    /^\/admin\/books\/[^/]+\/chapters\/new$/.test(pathname) ||
    /^\/admin\/books\/[^/]+\/chapters\/[^/]+$/.test(pathname);
  const showTopbar = !hideDynamicBookEditorTopbar && !hideDynamicChapterEditorTopbar;

  return (
    <div className="admin-shell">
      <div className="admin-utility-wrap">
        <header className="admin-utility-bar">
          <div className="admin-utility-brand">
            <span className="admin-utility-brand__icon" aria-hidden="true">
              <i className="bi bi-shield-lock" />
            </span>

            <div className="admin-utility-brand__copy">
              <p className="admin-utility-brand__eyebrow">{t("admin.layout.pulseEyebrow")}</p>
              <strong>{t("admin.layout.pulseTitle")}</strong>
            </div>
          </div>

          <div className="admin-utility-metrics" aria-label="Admin summary">
            {pulseItems.map((item) => (
              <div
                key={item.label}
                className={`admin-utility-chip ${
                  item.tone ? `admin-utility-chip--${item.tone}` : ""
                }`}
              >
                <span className="admin-utility-chip__icon" aria-hidden="true">
                  <i className={`bi ${item.icon}`} />
                </span>
                <div className="admin-utility-chip__copy">
                  <span className="admin-utility-chip__label">{item.label}</span>
                  <strong className="admin-utility-chip__value">{item.value}</strong>
                  <span className="admin-utility-chip__meta">{item.meta}</span>
                </div>
              </div>
            ))}

            <ThemeToggle className="admin-theme-toggle" />
          </div>
        </header>
      </div>

      <div className="admin-shell-grid">
        <aside className="admin-sidebar-col">
          <div className="admin-sidebar-surface">
            <p className="admin-sidebar-kicker">{t("admin.layout.sidebarKicker")}</p>
            <h2 className="admin-sidebar-title">{t("admin.layout.sidebarTitle")}</h2>
            <p className="admin-sidebar-copy">
              {t("admin.layout.sidebarCopy")}
            </p>

            <nav className="admin-nav-list" aria-label="Admin navigation">
              {adminNavItems.map((item) => (
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

            <div className="admin-sidebar-footer">
              <Link className="admin-home-link" to="/">
                <i className="bi bi-house-door" aria-hidden="true" />
                <span>{t("admin.layout.backHome")}</span>
              </Link>
            </div>
          </div>
        </aside>

        <main className="admin-main-col">
          <div className="admin-main-frame">
            {showTopbar ? (
              <header className="admin-main-topbar">
                <p className="admin-main-kicker">{t("admin.layout.pageKicker")}</p>
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
