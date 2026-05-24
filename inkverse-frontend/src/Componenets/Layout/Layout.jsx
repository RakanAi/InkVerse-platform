import { Outlet, useLocation } from "react-router-dom";
import NavBar from "../NavBar/NavBar";
import Footer from "../Footer/Footer";
import './Layout.css';
import LoginModal from "./LoginModal";

export default function Layout() {
  const { pathname } = useLocation();
  const isAdminRoute = pathname.toLowerCase().startsWith("/admin");
  const isAuthorRoute = pathname.toLowerCase().startsWith("/author");
  const isChapterRoute = /^\/book\/[^/]+\/chapter\/[^/]+$/.test(pathname);
  const shouldHideGlobalChrome = isAdminRoute || isAuthorRoute || isChapterRoute;

  return (
    <>
      {!shouldHideGlobalChrome ? <NavBar /> : null}
      <div
        className={`layout-container ${shouldHideGlobalChrome ? "layout-container--no-nav" : ""}`}
      >
        <Outlet />
      </div>
      {!shouldHideGlobalChrome ? <Footer /> : null}

      {/* ✅ Modal available on ALL pages */}
      <LoginModal />
    </>
  );
}
