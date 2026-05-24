import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, NavLink, useLocation } from "react-router-dom";
import "./NavBar.css";
import AuthContext from "../../Context/AuthProvider";
import logo from "../../assets/IncVerseLogo.png";
import { getLanguageOptions, normalizeLanguageCode, setAppLanguage } from "../../i18n";
import ThemeToggle from "../../Shared/ui/ThemeToggle";
import UserAvatar from "../../Shared/user/UserAvatar";
import { fetchWallet } from "../../Api/monetization.api";
import {
  fetchNotifications,
  fetchUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "../../Api/notifications.api";

const PRIMARY_LINKS = [
  {
    labelKey: "nav.links.browse",
    to: "/Browser",
    match: (pathname) => pathname.startsWith("/browser"),
  },
  {
    labelKey: "nav.links.ranking",
    to: "/Ranking",
    match: (pathname) => pathname.startsWith("/ranking"),
  },
  {
    labelKey: "nav.links.authorStudio",
    to: "/Author",
    match: (pathname) => pathname.startsWith("/author"),
  },
  {
    labelKey: "nav.links.trends",
    to: "/Trend",
    match: (pathname) => pathname.startsWith("/trend"),
    accent: "trend",
  },
];

function NavItem({ item, pathname, onClick, t }) {
  const isActive = item.match(pathname);

  return (
    <NavLink
      to={item.to}
      onClick={onClick}
      className={`iv-nav-link ${isActive ? "is-active" : ""} ${
        item.accent ? `iv-nav-link--${item.accent}` : ""
      }`}
    >
      <span>{t(item.labelKey)}</span>
    </NavLink>
  );
}

function LanguageControl({ className = "" }) {
  const { t, i18n } = useTranslation();
  const languageOptions = useMemo(() => getLanguageOptions(t), [t]);
  const activeLanguage = normalizeLanguageCode(i18n.language || i18n.resolvedLanguage);
  const activeOption = languageOptions.find((option) => option.value === activeLanguage);
  const label = `${t("nav.language.ariaLabel")}: ${
    activeOption?.label ?? activeLanguage.toUpperCase()
  }`;

  return (
    <label className={`iv-language-control ${className}`.trim()} title={label}>
      <span
        className="iv-language-trigger"
        aria-hidden="true"
      >
        <i className="bi bi-translate" />
      </span>
      <select
        className="iv-language-native-select"
        value={activeLanguage}
        aria-label={label}
        onChange={(event) => setAppLanguage(event.target.value)}
      >
        {languageOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.shortLabel} - {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function SettingsMenuLanguageControl() {
  const { t, i18n } = useTranslation();
  const languageOptions = useMemo(() => getLanguageOptions(t), [t]);
  const activeLanguage = normalizeLanguageCode(i18n.language || i18n.resolvedLanguage);
  const activeOption = languageOptions.find((option) => option.value === activeLanguage);
  const label = `${t("nav.language.ariaLabel")}: ${
    activeOption?.label ?? activeLanguage.toUpperCase()
  }`;

  return (
    <label className="iv-settings-menu-item iv-settings-menu-item--select" title={label}>
      <span className="iv-settings-menu-icon" aria-hidden="true">
        <i className="bi bi-translate" />
      </span>
      <span className="iv-settings-menu-copy">
        <span>{t("nav.language.label")}</span>
        <strong>{activeOption?.label ?? activeLanguage.toUpperCase()}</strong>
      </span>
      <i className="bi bi-chevron-down iv-settings-menu-caret" aria-hidden="true" />
      <select
        className="iv-settings-native-select"
        value={activeLanguage}
        aria-label={label}
        onChange={(event) => setAppLanguage(event.target.value)}
      >
        {languageOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.shortLabel} - {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function getNotificationField(item, camelKey, pascalKey = "") {
  return item?.[camelKey] ?? item?.[pascalKey || camelKey[0].toUpperCase() + camelKey.slice(1)];
}

function formatNotificationTime(value) {
  if (!value) return "now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "now";

  const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function NotificationsDropdown({
  notifications,
  loading,
  unreadCount,
  onMarkAll,
  onOpenNotification,
}) {
  return (
    <div className="iv-notification-menu" role="dialog" aria-label="Notifications">
      <div className="iv-notification-menu__head">
        <div>
          <strong>Notifications</strong>
          <span>{unreadCount ? `${unreadCount} unread` : "All caught up"}</span>
        </div>
        <button type="button" onClick={onMarkAll} disabled={!unreadCount}>
          Mark read
        </button>
      </div>

      <div className="iv-notification-menu__list">
        {loading ? (
          <div className="iv-notification-empty">Loading...</div>
        ) : notifications.length ? (
          notifications.map((item) => {
            const id = getNotificationField(item, "id");
            const title = getNotificationField(item, "title") || "Notification";
            const body = getNotificationField(item, "body") || "";
            const linkUrl = getNotificationField(item, "linkUrl") || "/notifications";
            const isRead = !!getNotificationField(item, "isRead");
            const actorName = getNotificationField(item, "actorName") || title;
            const actorAvatarUrl = getNotificationField(item, "actorAvatarUrl") || "";
            const createdAt = getNotificationField(item, "createdAt");

            return (
              <Link
                key={id}
                to={linkUrl}
                className={`iv-notification-item ${isRead ? "" : "is-unread"}`}
                onClick={() => onOpenNotification(item)}
              >
                <UserAvatar
                  className="iv-notification-item__avatar"
                  src={actorAvatarUrl}
                  name={actorName}
                />
                <span className="iv-notification-item__copy">
                  <span>
                    <strong>{title}</strong>
                    <em>{formatNotificationTime(createdAt)}</em>
                  </span>
                  {body ? <small>{body}</small> : null}
                </span>
              </Link>
            );
          })
        ) : (
          <div className="iv-notification-empty">No notifications yet.</div>
        )}
      </div>

      <Link className="iv-notification-menu__all" to="/notifications">
        View notification inbox
      </Link>
    </div>
  );
}

function MobileMenuContent({
  isLoggedIn,
  isAdmin,
  pathname,
  onNavigate,
  onLogout,
  onOpenLogin,
  coinBalance,
  notificationCount,
  t,
}) {
  return (
    <>
      <div className="iv-mobile-menu-head">
        <p className="iv-mobile-menu-kicker">{t("nav.mobile.navigation")}</p>
        <p className="iv-mobile-menu-title">{t("nav.mobile.title")}</p>
      </div>

      <div className="iv-mobile-menu-links">
        {PRIMARY_LINKS.map((item) => (
          <NavItem
            key={item.to}
            item={item}
            pathname={pathname}
            onClick={onNavigate}
            t={t}
          />
        ))}
        {isLoggedIn && isAdmin && (
          <NavLink
            to="/admin"
            onClick={onNavigate}
            className={`iv-nav-link iv-nav-link--admin ${
              pathname.startsWith("/admin") ? "is-active" : ""
            }`}
          >
            <span>{t("nav.links.admin")}</span>
          </NavLink>
        )}
      </div>

      <div className="iv-mobile-menu-footer">
        <LanguageControl className="iv-mobile-language-control" />
        <ThemeToggle className="iv-mobile-theme-toggle" />

        {isLoggedIn ? (
          <>
            <Link
              to="/my-library"
              className="iv-mobile-utility"
              onClick={onNavigate}
            >
              {t("nav.mobile.myLibrary")}
            </Link>
            <Link
              to="/notifications"
              className="iv-mobile-utility"
              onClick={onNavigate}
            >
              Notifications{notificationCount ? ` (${notificationCount})` : ""}
            </Link>
            <Link
              to="/wallet"
              className="iv-mobile-utility"
              onClick={onNavigate}
            >
              {(coinBalance ?? 0).toLocaleString()} coins
            </Link>
            <Link
              to="/profilePage"
              className="iv-mobile-utility"
              onClick={onNavigate}
            >
              {t("nav.mobile.profileSettings")}
            </Link>
            <button
              type="button"
              className="iv-mobile-utility iv-mobile-utility--danger"
              onClick={onLogout}
            >
              {t("nav.profile.logout")}
            </button>
          </>
        ) : (
          <button
            type="button"
            className="iv-action-pill iv-action-pill--primary iv-action-pill--full"
            onClick={onOpenLogin}
          >
            {t("nav.actions.enterInkVerse")}
          </button>
        )}
      </div>
    </>
  );
}

function NavBar() {
  const { auth, openLogin, setAuth } = useContext(AuthContext);
  const { t } = useTranslation();
  const location = useLocation();
  const pathname = location.pathname.toLowerCase();

  const [isNavHidden, setIsNavHidden] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [coinBalance, setCoinBalance] = useState(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const [notificationPreview, setNotificationPreview] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  const lastScrollYRef = useRef(0);
  const profileMenuRef = useRef(null);
  const settingsMenuRef = useRef(null);
  const notificationsMenuRef = useRef(null);
  const mobileMenuRef = useRef(null);

  const isLoggedIn = !!auth?.accessToken;
  const roles = useMemo(() => {
    const raw =
      auth?.user?.roles ??
      auth?.user?.Roles ??
      auth?.user?.role ??
      auth?.user?.Role ??
      [];

    return Array.isArray(raw) ? raw : [raw];
  }, [auth]);

  const isAdmin = roles.includes("Admin");
  const displayName = auth?.user?.userName ?? "Reader";
  const avatarUrl = auth?.user?.avatarUrl ?? "";

  useEffect(() => {
    const onScroll = () => {
      const currentY = window.scrollY;
      const previousY = lastScrollYRef.current;

      if (currentY <= 24) {
        setIsNavHidden(false);
      } else if (currentY > previousY + 10) {
        setIsNavHidden(true);
      } else if (currentY < previousY - 10) {
        setIsNavHidden(false);
      }

      lastScrollYRef.current = currentY;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setIsProfileMenuOpen(false);
    setIsSettingsMenuOpen(false);
    setIsNotificationsOpen(false);
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const refreshNotifications = useCallback(
    async ({ silent = false } = {}) => {
      if (!isLoggedIn) return;

      try {
        if (!silent) setNotificationsLoading(true);
        const [count, latest] = await Promise.all([
          fetchUnreadNotificationCount(),
          fetchNotifications({ take: 5 }),
        ]);
        setNotificationCount(count);
        setNotificationPreview(latest);
      } catch (error) {
        console.error("Load notifications failed", error);
      } finally {
        if (!silent) setNotificationsLoading(false);
      }
    },
    [isLoggedIn],
  );

  useEffect(() => {
    if (!isLoggedIn) {
      setNotificationCount(0);
      setNotificationPreview([]);
      return undefined;
    }

    refreshNotifications({ silent: true });
    const timer = window.setInterval(() => {
      refreshNotifications({ silent: true });
    }, 60000);

    return () => window.clearInterval(timer);
  }, [isLoggedIn, location.pathname, refreshNotifications]);

  useEffect(() => {
    let alive = true;
    if (!isLoggedIn) {
      setCoinBalance(null);
      return undefined;
    }

    fetchWallet()
      .then((wallet) => {
        if (alive) setCoinBalance(wallet?.coinBalance ?? 0);
      })
      .catch(() => {
        if (alive) setCoinBalance(null);
      });

    return () => {
      alive = false;
    };
  }, [isLoggedIn, location.pathname]);

  useEffect(() => {
    const onPointerDown = (event) => {
      if (
        isProfileMenuOpen &&
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target)
      ) {
        setIsProfileMenuOpen(false);
      }

      if (
        isMobileMenuOpen &&
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target)
      ) {
        setIsMobileMenuOpen(false);
      }

      if (
        isSettingsMenuOpen &&
        settingsMenuRef.current &&
        !settingsMenuRef.current.contains(event.target)
      ) {
        setIsSettingsMenuOpen(false);
      }

      if (
        isNotificationsOpen &&
        notificationsMenuRef.current &&
        !notificationsMenuRef.current.contains(event.target)
      ) {
        setIsNotificationsOpen(false);
      }
    };

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsProfileMenuOpen(false);
        setIsSettingsMenuOpen(false);
        setIsNotificationsOpen(false);
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isMobileMenuOpen, isNotificationsOpen, isProfileMenuOpen, isSettingsMenuOpen]);

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 992) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const handleLogout = () => {
    setAuth(null);
    localStorage.removeItem("auth");
    setIsProfileMenuOpen(false);
    setIsSettingsMenuOpen(false);
    setIsNotificationsOpen(false);
    setIsMobileMenuOpen(false);
  };

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const handleOpenNotification = async (notification) => {
    const id = getNotificationField(notification, "id");
    if (!id || getNotificationField(notification, "isRead")) return;

    try {
      const updated = await markNotificationRead(id);
      setNotificationPreview((current) =>
        current.map((item) =>
          getNotificationField(item, "id") === id ? updated : item,
        ),
      );
      setNotificationCount((current) => Math.max(0, current - 1));
    } catch (error) {
      console.error("Mark notification read failed", error);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotificationCount(0);
      setNotificationPreview((current) =>
        current.map((item) => ({ ...item, isRead: true, IsRead: true })),
      );
    } catch (error) {
      console.error("Mark all notifications read failed", error);
    }
  };

  return (
    <header
      className={`iv-navbar ${isNavHidden ? "nav-hidden" : "nav-visible"} ${
        isMobileMenuOpen ? "is-mobile-menu-open" : ""
      }`}
    >
      <div className="iv-navbar-shell">
        <div className="iv-navbar-frame">
          <Link className="iv-brand" to="/">
            <span className="iv-brand-mark">
              <img src={logo} alt="InkVerse" className="iv-brand-logo" />
            </span>
            <span className="iv-brand-copy">
              <span className="iv-brand-kicker">{t("common.brandKicker")}</span>
              <span className="iv-brand-title">{t("common.appName")}</span>
            </span>
          </Link>

          <nav className="iv-nav-track" aria-label="Primary navigation">
            {PRIMARY_LINKS.map((item) => (
              <NavItem key={item.to} item={item} pathname={pathname} t={t} />
            ))}
            {isLoggedIn && isAdmin && (
              <NavLink
                to="/admin"
                className={`iv-nav-link iv-nav-link--admin ${
                  pathname.startsWith("/admin") ? "is-active" : ""
                }`}
              >
                <span>{t("nav.links.admin")}</span>
              </NavLink>
            )}
          </nav>

          <div className="iv-nav-actions">
            <div className="iv-settings-wrap" ref={settingsMenuRef}>
              <button
                type="button"
                className={`iv-settings-trigger ${
                  isSettingsMenuOpen ? "is-open" : ""
                }`}
                onClick={() => {
                  setIsSettingsMenuOpen((open) => !open);
                  setIsProfileMenuOpen(false);
                  setIsNotificationsOpen(false);
                }}
                aria-label={t("nav.profile.settings")}
                aria-expanded={isSettingsMenuOpen}
                aria-haspopup="true"
                title={t("nav.profile.settings")}
              >
                <i className="bi bi-gear-fill" aria-hidden="true" />
              </button>

              {isSettingsMenuOpen && (
                <div className="iv-settings-menu" role="dialog" aria-label={t("nav.profile.settings")}>
                  <SettingsMenuLanguageControl />
                  <ThemeToggle className="iv-settings-menu-item iv-settings-theme-toggle" />
                </div>
              )}
            </div>

            {isLoggedIn && (
              <div className="iv-notification-wrap" ref={notificationsMenuRef}>
                <button
                  type="button"
                  className={`iv-notification-trigger ${isNotificationsOpen ? "is-open" : ""}`}
                  onClick={() => {
                    setIsNotificationsOpen((open) => !open);
                    setIsProfileMenuOpen(false);
                    setIsSettingsMenuOpen(false);
                    refreshNotifications();
                  }}
                  aria-label="Notifications"
                  aria-expanded={isNotificationsOpen}
                  aria-haspopup="true"
                  title="Notifications"
                >
                  <i className="bi bi-bell-fill" aria-hidden="true" />
                  {notificationCount > 0 ? (
                    <span className="iv-notification-badge">
                      {notificationCount > 99 ? "99+" : notificationCount}
                    </span>
                  ) : null}
                </button>

                {isNotificationsOpen ? (
                  <NotificationsDropdown
                    notifications={notificationPreview}
                    loading={notificationsLoading}
                    unreadCount={notificationCount}
                    onMarkAll={handleMarkAllNotificationsRead}
                    onOpenNotification={handleOpenNotification}
                  />
                ) : null}
              </div>
            )}

            {isLoggedIn && (
              <Link to="/my-library" className="iv-action-pill iv-action-pill--ghost">
                {t("nav.actions.library")}
              </Link>
            )}

            {isLoggedIn ? (
              <div className="iv-profile-wrap" ref={profileMenuRef}>
                <button
                  type="button"
                  className={`iv-profile-trigger ${
                    isProfileMenuOpen ? "is-open" : ""
                  }`}
                  aria-expanded={isProfileMenuOpen}
                  aria-haspopup="menu"
                  onClick={() => {
                    setIsProfileMenuOpen((open) => !open);
                    setIsSettingsMenuOpen(false);
                    setIsNotificationsOpen(false);
                  }}
                >
                  <UserAvatar
                    className="iv-avatar"
                    name={displayName}
                    src={avatarUrl}
                    alt={displayName}
                  />
                  <span className="iv-profile-copy">
                    <span className="iv-profile-label">{t("nav.profile.signedIn")}</span>
                    <span className="iv-profile-name">{displayName}</span>
                  </span>
                  <span className="iv-chevron" aria-hidden="true">
                    {isProfileMenuOpen ? "−" : "+"}
                  </span>
                </button>

                {isProfileMenuOpen && (
                  <div className="iv-profile-menu" role="menu">
                    <Link
                      to="/wallet"
                      className="iv-profile-menu-item iv-profile-menu-item--wallet"
                      role="menuitem"
                    >
                      <span className="iv-profile-menu-icon" aria-hidden="true">
                        <i className="bi bi-coin" />
                      </span>
                      <span>{(coinBalance ?? 0).toLocaleString()} coins</span>
                    </Link>
                    <Link to="/profilePage" className="iv-profile-menu-item" role="menuitem">
                      {t("nav.profile.profile")}
                    </Link>
                    <Link to="/profilePage" className="iv-profile-menu-item" role="menuitem">
                      {t("nav.profile.settings")}
                    </Link>
                    {isAdmin && (
                      <Link to="/admin" className="iv-profile-menu-item" role="menuitem">
                        {t("nav.profile.adminDashboard")}
                      </Link>
                    )}
                    <button
                      type="button"
                      className="iv-profile-menu-item iv-profile-menu-item--danger"
                      onClick={handleLogout}
                    >
                      {t("nav.profile.logout")}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                className="iv-action-pill iv-action-pill--primary"
                onClick={openLogin}
              >
                {t("nav.actions.enterInkVerse")}
              </button>
            )}

            <button
              type="button"
              className={`iv-mobile-toggle ${isMobileMenuOpen ? "is-open" : ""}`}
              onClick={() => setIsMobileMenuOpen((open) => !open)}
              aria-expanded={isMobileMenuOpen}
              aria-controls="iv-mobile-menu"
            >
              <span className="iv-mobile-toggle-lines" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
              <span className="iv-mobile-toggle-label">{t("nav.actions.menu")}</span>
            </button>
          </div>
        </div>

        <div className="iv-navbar-phone">
          <button
            type="button"
            className={`iv-phone-menuToggle ${isMobileMenuOpen ? "is-open" : ""}`}
            onClick={() => setIsMobileMenuOpen((open) => !open)}
            aria-expanded={isMobileMenuOpen}
            aria-controls="iv-mobile-menu"
            aria-label="Open navigation menu"
          >
            <span className="iv-mobile-toggle-lines" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </button>

          <Link className="iv-phone-brand" to="/">
            <span className="iv-phone-brandMark">
              <img src={logo} alt="InkVerse" className="iv-phone-brandLogo" />
            </span>
            <span className="iv-phone-brandCopy">
              <span className="iv-phone-brandTitle">{t("common.appName")}</span>
              <span className="iv-phone-brandHint">{t("common.brandKicker")}</span>
            </span>
          </Link>

          <div className="iv-phone-actions">
            {isLoggedIn ? (
              <>
                <Link
                  to="/notifications"
                  className="iv-phone-notifications"
                  aria-label="Notifications"
                >
                  <i className="bi bi-bell-fill" aria-hidden="true" />
                  {notificationCount > 0 ? (
                    <span>{notificationCount > 99 ? "99+" : notificationCount}</span>
                  ) : null}
                </Link>
                <Link
                  to="/profilePage"
                  className="iv-phone-profile"
                  aria-label={t("nav.profile.profile")}
                >
                  <UserAvatar
                    className="iv-avatar"
                    name={displayName}
                    src={avatarUrl}
                    alt={displayName}
                  />
                </Link>
              </>
            ) : (
              <button
                type="button"
                className="iv-phone-entry"
                onClick={openLogin}
              >
                {t("nav.actions.enter")}
              </button>
            )}
          </div>
        </div>

        {isMobileMenuOpen && (
          <>
            <button
              type="button"
              className="iv-mobile-backdrop"
              aria-label={t("nav.mobile.closeMenu")}
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <div
              id="iv-mobile-menu"
              className="iv-mobile-menu"
              ref={mobileMenuRef}
            >
              <MobileMenuContent
                isLoggedIn={isLoggedIn}
                isAdmin={isAdmin}
                pathname={pathname}
                onNavigate={closeMobileMenu}
                onLogout={handleLogout}
                coinBalance={coinBalance}
                t={t}
                onOpenLogin={() => {
                  closeMobileMenu();
                  openLogin();
                }}
                notificationCount={notificationCount}
              />
            </div>
          </>
        )}
      </div>
    </header>
  );
}

export default NavBar;
