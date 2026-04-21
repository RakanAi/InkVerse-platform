import { useEffect, useContext, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./NavBar.css";
import AuthContext from "../../Context/AuthProvider";
import logo from "../../assets/IncVerseLogo.png";

function NavBar() {
  const { auth, openLogin, setAuth } = useContext(AuthContext);

  const [menuOpen, setMenuOpen] = useState(false);
  const [isNavHidden, setIsNavHidden] = useState(false);
  const closeTimer = useRef(null);
  const lastScrollYRef = useRef(0);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const currentY = window.scrollY;
      const previousY = lastScrollYRef.current;

      if (currentY <= 24) {
        setIsNavHidden(false);
      } else if (currentY > previousY + 8) {
        setIsNavHidden(true);
      } else if (currentY < previousY - 8) {
        setIsNavHidden(false);
      }

      lastScrollYRef.current = currentY;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const openMenu = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setMenuOpen(true);
  };

  const closeMenu = () => {
    closeTimer.current = setTimeout(() => setMenuOpen(false), 120);
  };

  const closeOffcanvas = () => {
    const el = document.getElementById("mobileNav");
    if (!el) return;

    const instance = window.bootstrap?.Offcanvas?.getInstance(el);
    instance?.hide();
  };

  const handleLogout = () => {
    setAuth(null);
    localStorage.removeItem("auth");
    setMenuOpen(false);
    if (isMobile) closeOffcanvas();
  };

  const isLoggedIn = !!auth?.accessToken;
  const initials = auth?.user?.userName?.slice(0, 1)?.toUpperCase() ?? "?";
  const roles =
    auth?.user?.roles ??
    auth?.user?.Roles ??
    auth?.user?.role ??
    auth?.user?.Role ??
    [];
  const isAdmin = Array.isArray(roles)
    ? roles.includes("Admin")
    : roles === "Admin";

  const onMobileNavClick = () => {
    if (isMobile) closeOffcanvas();
  };

  return (
    <>
      <nav
        className={`navbar text-start navbar-expand-md fixed-top align-items-center ${isNavHidden ? "nav-hidden" : "nav-visible"}`}
      >
        <div className="container iv-navbar-shell" style={{ maxWidth: "1300px" }}>
          <Link
            className="navbar-brand p-0 text-light d-flex align-items-center"
            to="/"
            onClick={onMobileNavClick}
          >
            <img src={logo} alt="InkVerse" className="iv-navbar-icon rounded-3" />
          </Link>

          <button
            className="navbar-toggler shadow-none border-0 bg-light"
            type="button"
            data-bs-toggle="offcanvas"
            data-bs-target="#mobileNav"
            aria-controls="mobileNav"
            onClick={() => setMenuOpen(false)}
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse d-none d-md-flex">
            <ul className="navbar-nav iv-nav-links me-auto">
              <li className="nav-item">
                <Link to="/Browser" className="nav-link iv-nav-link text-light">
                  <span className="bi bi-compass iv-link-icon" aria-hidden="true" />
                  <span>Browser</span>
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/Ranking" className="nav-link iv-nav-link text-light">
                  <span className="bi bi-trophy iv-link-icon" aria-hidden="true" />
                  <span>Ranking</span>
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/Author" className="nav-link iv-nav-link text-light">
                  <span className="bi bi-pencil-square iv-link-icon" aria-hidden="true" />
                  <span>Author</span>
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/Trend" className="nav-link iv-nav-link iv-nav-link-trend text-light fw-bold">
                  <span className="bi bi-stars iv-link-icon" aria-hidden="true" />
                  <span>Trends!</span>
                </Link>
              </li>
              {isLoggedIn && isAdmin && (
                <li className="nav-item">
                  <Link to="/admin" className="nav-link iv-nav-link iv-nav-link-admin text-warning fw-bold">
                    <span className="bi bi-shield-lock iv-link-icon" aria-hidden="true" />
                    <span>Admin</span>
                  </Link>
                </li>
              )}
            </ul>

            <div className="d-flex align-items-center gap-2 iv-nav-actions w-auto">
              {isLoggedIn && (
                <Link className="btn iv-ghost-btn d-flex" to="/my-library">
                  <span className="bi bi-collection me-1" aria-hidden="true" />
                  Library
                </Link>
              )}

              {isLoggedIn ? (
                <div
                  className="iv-profile-dropdown"
                  onMouseEnter={openMenu}
                  onMouseLeave={closeMenu}
                >
                  <Link to="/profilePage" className="text-decoration-none">
                    <div className="iv-avatar" title="Profile">
                      {initials}
                    </div>
                  </Link>

                  {menuOpen && (
                    <div className="iv-menu shadow">
                      <Link className="iv-menu-item" to="/profilePage">
                        <span className="bi bi-person-circle" aria-hidden="true" />
                        Profile
                      </Link>
                      <Link className="iv-menu-item" to="/profilePage">
                        <span className="bi bi-gear" aria-hidden="true" />
                        Settings
                      </Link>
                      <button className="iv-menu-item danger" onClick={handleLogout}>
                        <span className="bi bi-box-arrow-right" aria-hidden="true" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button type="button" className="btn iv-primary-btn" onClick={openLogin}>
                  <span className="bi bi-box-arrow-in-right me-1" aria-hidden="true" />
                  SIGN IN
                </button>
              )}
            </div>
          </div>

          <div
            className="offcanvas offcanvas-start d-md-none"
            tabIndex="-1"
            id="mobileNav"
            aria-labelledby="mobileNavLabel"
          >
            <div className="offcanvas-header">
              <h5 className="offcanvas-title" id="mobileNavLabel">
                InkVerse
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="offcanvas"
                aria-label="Close"
              ></button>
            </div>

            <div className="offcanvas-body backdropcan">
              <ul className="navbar-nav ps-2">
                <li className="nav-item">
                  <Link to="/Browser" className="nav-link" onClick={onMobileNavClick}>
                    <span className="bi bi-compass me-2" aria-hidden="true" />
                    Browser
                  </Link>
                </li>
                <li className="nav-item">
                  <Link to="/Ranking" className="nav-link" onClick={onMobileNavClick}>
                    <span className="bi bi-trophy me-2" aria-hidden="true" />
                    Ranking
                  </Link>
                </li>
                <li className="nav-item">
                  <Link to="/Author" className="nav-link" onClick={onMobileNavClick}>
                    <span className="bi bi-pencil-square me-2" aria-hidden="true" />
                    Author
                  </Link>
                </li>
                <li className="nav-item">
                  <Link to="/Trend" className="nav-link fw-bold" onClick={onMobileNavClick}>
                    <span className="bi bi-stars me-2" aria-hidden="true" />
                    Trends!
                  </Link>
                </li>

                {isLoggedIn && isAdmin && (
                  <li className="nav-item">
                    <Link
                      to="/admin"
                      className="nav-link text-warning fw-bold"
                      onClick={onMobileNavClick}
                    >
                      <span className="bi bi-shield-lock me-2" aria-hidden="true" />
                      Admin
                    </Link>
                  </li>
                )}

                <hr />

                {isLoggedIn && (
                  <>
                    <li className="nav-item">
                      <Link to="/my-library" className="nav-link" onClick={onMobileNavClick}>
                        <span className="bi bi-collection me-2" aria-hidden="true" />
                        Library
                      </Link>
                    </li>
                    <hr />
                  </>
                )}

                {isLoggedIn ? (
                  <>
                    <li className="nav-item">
                      <Link to="/profilePage" className="nav-link" onClick={onMobileNavClick}>
                        <span className="bi bi-person-circle me-2" aria-hidden="true" />
                        Profile
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link to="/profilePage" className="nav-link" onClick={onMobileNavClick}>
                        <span className="bi bi-gear me-2" aria-hidden="true" />
                        Settings
                      </Link>
                    </li>
                    <li className="nav-item">
                      <button
                        className="nav-link btn btn-link text-danger p-0"
                        style={{ textAlign: "left" }}
                        onClick={handleLogout}
                      >
                        <span className="bi bi-box-arrow-right me-2" aria-hidden="true" />
                        Logout
                      </button>
                    </li>
                  </>
                ) : (
                  <li className="nav-item">
                    <button
                      type="button"
                      className="nav-link btn btn-link p-0"
                      style={{ textAlign: "left" }}
                      onClick={() => {
                        closeOffcanvas();
                        openLogin();
                      }}
                    >
                      <span className="bi bi-box-arrow-in-right me-2" aria-hidden="true" />
                      Sign In
                    </button>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}

export default NavBar;