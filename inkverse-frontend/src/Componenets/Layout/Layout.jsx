import { Outlet } from "react-router-dom";
import NavBar from "../NavBar/NavBar";
import Footer from "../Footer/Footer";
import './Layout.css';
import LoginModal from "./LoginModal";

export default function Layout() {
  return (
    <>
      <NavBar />
      <div className="layout-container mt-2">
        <Outlet />
      </div>
      <Footer />

      {/* ✅ Modal available on ALL pages */}
      <LoginModal />
    </>
  );
}