import { NavLink, Outlet } from "react-router-dom";
import { FiGrid, FiFolder, FiDollarSign, FiFileText } from "react-icons/fi";
import logo from "../../assets/IncVerseLogo.png";
import "./Author.css";

const menuItems = [
  { to: "/author", end: true, label: "Dashboard", icon: FiGrid },
  { to: "/author/workspace", end: false, label: "Workspace", icon: FiFolder },
  { to: "/author/income", end: false, label: "Income", icon: FiDollarSign },
  { to: "/author/contract", end: false, label: "Contract", icon: FiFileText },
];

function NavItem({ to, end, label, icon: Icon }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `author-nav-link ${isActive ? "active" : ""}`
      }
    >
      <Icon size={20} strokeWidth={2} />
      <span>{label}</span>
    </NavLink>
  );
}

export default function AuthorLayout() {
  return (
    <div className="author-layout">
      <div className="author-content-wrap">
        {/* PC: Side menu */}
        <aside className="author-sidebar-wrapper author-sidebar">
          <div className="author-sidebar-brand">
            <img src={logo} alt="InkVerse" className="author-logo" />
            <span className="author-brand-text">InkVerse</span>
          </div>
          <nav className="author-nav">
            {menuItems.map((item) => (
              <NavItem key={item.to} {...item} />
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="author-main">
          <Outlet />
        </main>
      </div>

      {/* Mobile: Bottom navigation */}
      <nav className="author-bottom-nav">
        {menuItems.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}
      </nav>
    </div>
  );
}
