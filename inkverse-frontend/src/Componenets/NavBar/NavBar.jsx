import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import "./NavBar.css";
import AuthContext from "../../Context/AuthProvider";
import logo from "../../assets/IncVerseLogo.png";

const PRIMARY_LINKS = [
  {
    label: "Browse",
    to: "/Browser",
    match: (pathname) => pathname.startsWith("/browser"),
  },
  {
    label: "Ranking",
    to: "/Ranking",
    match: (pathname) => pathname.startsWith("/ranking"),
  },
  {
    label: "Author Studio",
    to: "/Author",
    match: (pathname) => pathname.startsWith("/author"),
  },
  {
    label: "Trends",
    to: "/Trend",
    match: (pathname) => pathname.startsWith("/trend"),
    accent: "trend",
  },
];

function NavItem({ item, pathname, onClick }) {
  const isActive = item.match(pathname);

  return (
    <NavLink
      to={item.to}
      onClick={onClick}
      className={`iv-nav-link ${isActive ? "is-active" : ""} ${
        item.accent ? `iv-nav-link--${item.accent}` : ""
      }`}
    >
      <span>{item.label}</span>
    </NavLink>
  );
}

function MobileMenuContent({
  isLoggedIn,
  isAdmin,
  pathname,
  onNavigate,
  onLogout,
  onOpenLogin,
}) {
  return (
    <>
      <div className="iv-mobile-menu-head">
        <p className="iv-mobile-menu-kicker">Navigation</p>
        <p className="iv-mobile-menu-title">Pick your next corner of InkVerse</p>
      </div>

      <div className="iv-mobile-menu-links">
        {PRIMARY_LINKS.map((item) => (
          <NavItem
            key={item.to}
            item={item}
            pathname={pathname}
            onClick={onNavigate}
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
            <span>Admin</span>
          </NavLink>
        )}
      </div>

      <div className="iv-mobile-menu-footer">
        {isLoggedIn ? (
          <>
            <Link
              to="/my-library"
              className="iv-mobile-utility"
              onClick={onNavigate}
            >
              My library
            </Link>
            <Link
              to="/profilePage"
              className="iv-mobile-utility"
              onClick={onNavigate}
            >
              Profile & settings
            </Link>
            <button
              type="button"
              className="iv-mobile-utility iv-mobile-utility--danger"
              onClick={onLogout}
            >
              Log out
            </button>
          </>
        ) : (
          <button
            type="button"
            className="iv-action-pill iv-action-pill--primary iv-action-pill--full"
            onClick={onOpenLogin}
          >
            Enter InkVerse
          </button>
        )}
      </div>
    </>
  );
}

function NavBar() {
  const { auth, openLogin, setAuth } = useContext(AuthContext);
  const location = useLocation();
  const pathname = location.pathname.toLowerCase();

  const [isNavHidden, setIsNavHidden] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const lastScrollYRef = useRef(0);
  const profileMenuRef = useRef(null);
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
  const initials = auth?.user?.userName?.slice(0, 2)?.toUpperCase() ?? "IV";
  const displayName = auth?.user?.userName ?? "Reader";

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
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

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
    };

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsProfileMenuOpen(false);
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isMobileMenuOpen, isProfileMenuOpen]);

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
    setIsMobileMenuOpen(false);
  };

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

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
              <span className="iv-brand-kicker">Read. Write. Wander.</span>
              <span className="iv-brand-title">InkVerse</span>
            </span>
          </Link>

          <nav className="iv-nav-track" aria-label="Primary navigation">
            {PRIMARY_LINKS.map((item) => (
              <NavItem key={item.to} item={item} pathname={pathname} />
            ))}
            {isLoggedIn && isAdmin && (
              <NavLink
                to="/admin"
                className={`iv-nav-link iv-nav-link--admin ${
                  pathname.startsWith("/admin") ? "is-active" : ""
                }`}
              >
                <span>Admin</span>
              </NavLink>
            )}
          </nav>

          <div className="iv-nav-actions">
            {isLoggedIn && (
              <Link to="/my-library" className="iv-action-pill iv-action-pill--ghost">
                Library
              </Link>
            )}

            {isLoggedIn ? (
              <div className="iv-profile-wrap" ref={profileMenuRef}>
                <button
                  type="button"
                  className={`iv-profile-trigger ${
                    isProfileMenuOpen ? "is-open" : ""
                  }`}
                  onClick={() => setIsProfileMenuOpen((open) => !open)}
                  aria-expanded={isProfileMenuOpen}
                  aria-haspopup="menu"
                >
                  <span className="iv-avatar">{initials}</span>
                  <span className="iv-profile-copy">
                    <span className="iv-profile-label">Signed in</span>
                    <span className="iv-profile-name">{displayName}</span>
                  </span>
                  <span className="iv-chevron" aria-hidden="true">
                    {isProfileMenuOpen ? "−" : "+"}
                  </span>
                </button>

                {isProfileMenuOpen && (
                  <div className="iv-profile-menu" role="menu">
                    <Link to="/profilePage" className="iv-profile-menu-item" role="menuitem">
                      Profile
                    </Link>
                    <Link to="/profilePage" className="iv-profile-menu-item" role="menuitem">
                      Settings
                    </Link>
                    {isAdmin && (
                      <Link to="/admin" className="iv-profile-menu-item" role="menuitem">
                        Admin dashboard
                      </Link>
                    )}
                    <button
                      type="button"
                      className="iv-profile-menu-item iv-profile-menu-item--danger"
                      onClick={handleLogout}
                    >
                      Log out
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
                Enter InkVerse
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
              <span className="iv-mobile-toggle-label">Menu</span>
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
              <span className="iv-phone-brandTitle">InkVerse</span>
              <span className="iv-phone-brandHint">Read. Write. Wander.</span>
            </span>
          </Link>

          <div className="iv-phone-actions">
            {isLoggedIn ? (
              <Link to="/profilePage" className="iv-phone-profile" aria-label="Profile">
                <span className="iv-avatar">{initials}</span>
              </Link>
            ) : (
              <button
                type="button"
                className="iv-phone-entry"
                onClick={openLogin}
              >
                Enter
              </button>
            )}
          </div>
        </div>

        {isMobileMenuOpen && (
          <>
            <button
              type="button"
              className="iv-mobile-backdrop"
              aria-label="Close navigation menu"
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
                onOpenLogin={() => {
                  closeMobileMenu();
                  openLogin();
                }}
              />
            </div>
          </>
        )}
      </div>
    </header>
  );
}

export default NavBar;
