import { useEffect, useContext, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./NavBar.css";
import AuthContext from "../../Context/AuthProvider";

// ✅ Vite best practice: import the logo
import logo from "../../assets/IncVerseLogo.png";

function NavBar() {
  const { auth, openLogin, setAuth } = useContext(AuthContext);

  const [menuOpen, setMenuOpen] = useState(false);
  const closeTimer = useRef(null);

  // ✅ Mobile detection (Bootstrap md breakpoint = 768px)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const openMenu = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setMenuOpen(true);
  };

  const closeMenu = () => {
    closeTimer.current = setTimeout(() => setMenuOpen(false), 120);
  };

  // ✅ Offcanvas close helper
  const closeOffcanvas = () => {
    const el = document.getElementById("mobileNav");
    if (!el) return;

    // Bootstrap JS must be loaded for this to work
    const instance = window.bootstrap?.Offcanvas?.getInstance(el);
    instance?.hide();
  };

  const handleLogout = () => {
    setAuth(null);
    localStorage.removeItem("auth");
    setMenuOpen(false);
    if (isMobile) closeOffcanvas();
  };

  // Your search expand/collapse logic (unchanged)
  useEffect(() => {
    const searchContainer = document.querySelector(".search-container");
    const searchInput = document.getElementById("search-input");
    const searchBtn = document.getElementById("search-btn");

    if (!searchContainer || !searchInput || !searchBtn) return;

    const expandSearch = (event) => {
      event.preventDefault();
      searchContainer.classList.add("active");
      searchInput.focus();
    };

    const collapseSearch = (event) => {
      if (!searchContainer.contains(event.target)) {
        searchContainer.classList.remove("active");
        searchInput.value = "";
      }
    };

    searchBtn.addEventListener("click", expandSearch);
    document.addEventListener("click", collapseSearch);

    return () => {
      searchBtn.removeEventListener("click", expandSearch);
      document.removeEventListener("click", collapseSearch);
    };
  }, []);

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

  // ✅ click handler used on mobile links
  const onMobileNavClick = () => {
    if (isMobile) closeOffcanvas();
  };

  return (
    <>
      <nav className="navbar text-start navbar-expand-md fixed-top align-items-center ">
        <div className="container" style={{ maxWidth: "1300px" }}>
          {/* Brand */}
          <Link
            className="navbar-brand p-0 text-light d-flex align-items-center"
            to="/"
            onClick={onMobileNavClick}
          >
            <img src={logo} alt="InkVerse" className="iv-navbar-icon rounded-3  "/>
            {/* <div className="ps-4 ms-5"></div> */}
          </Link>

          {/* ✅ Toggler: opens OFFCANVAS on mobile */}
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

          {/* ✅ DESKTOP NAV (normal, no offcanvas) */}
          <div className="collapse navbar-collapse d-none d-md-flex">
            <ul className="navbar-nav ms-auto col-lg-10 col-md-8 col-sm-12">
              <li className="nav-item">
                <Link to="/Browser" className="nav-link text-light">
                  Browser
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/Ranking" className="nav-link text-light">
                  Ranking
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/Author" className="nav-link text-light">
                  Author
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/Trend" className="nav-link text-light fw-bold">
                  Trends!
                </Link>
              </li>
              {isLoggedIn && isAdmin && (
                <li className="nav-item">
                  <Link to="/admin" className="nav-link text-warning fw-bold">
                    Admin
                  </Link>
                </li>
              )}
            </ul>

            <div className="d-flex align-items-center gap-2">
              {isLoggedIn && (
                <Link
                  className="nav-link text-white btn loginBtn"
                  to="/my-library"
                >
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
                        Profile
                      </Link>
                      <Link className="iv-menu-item" to="/profilePage">
                        Settings
                      </Link>
                      <button
                        className="iv-menu-item danger"
                        onClick={handleLogout}
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  className="loginBtn btn btn-outline-dark text-white btn-sm border-0"
                  onClick={openLogin}
                >
                  SIGN IN
                </button>
              )}
            </div>
          </div>

          {/* ✅ OFFCANVAS (mobile only) */}
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
                  <Link
                    to="/Browser"
                    className="nav-link"
                    onClick={onMobileNavClick}
                  >
                    Browser
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    to="/Ranking"
                    className="nav-link"
                    onClick={onMobileNavClick}
                  >
                    Ranking
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    to="/Author"
                    className="nav-link"
                    onClick={onMobileNavClick}
                  >
                    Author
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    to="/Trend"
                    className="nav-link fw-bold"
                    onClick={onMobileNavClick}
                  >
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
                      Admin
                    </Link>
                  </li>
                )}

                <hr />

                {isLoggedIn && (
                  <>
                    <hr />
                    <li className="nav-item">
                      <Link
                        to="/my-library"
                        className="nav-link"
                        onClick={onMobileNavClick}
                      >
                        Library
                      </Link>
                    </li>
                  </>
                )}

                {isLoggedIn ? (
                  <>
                    <li className="nav-item">
                      <Link
                        to="/profilePage"
                        className="nav-link"
                        onClick={onMobileNavClick}
                      >
                        Profile
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link
                        to="/profilePage"
                        className="nav-link"
                        onClick={onMobileNavClick}
                      >
                        Settings
                      </Link>
                    </li>
                    <li className="nav-item">
                      <button
                        className="nav-link btn btn-link text-danger p-0"
                        style={{ textAlign: "left" }}
                        onClick={handleLogout}
                      >
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
