import { NavLink, Outlet } from "react-router-dom";
import { FiGrid, FiFolder, FiDollarSign, FiFileText } from "react-icons/fi";
import { useContext, useMemo, useState } from "react";
import logo from "../../assets/IncVerseLogo.png";
import AuthContext from "../../Context/AuthProvider";
import api from "../../Api/api";
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

function AuthorOnboarding({ isLoggedIn, onOpenLogin, onBecomeAuthor }) {
  return (
    <section className="author-onboarding">
      <div className="author-onboarding-card">
        <span className="author-onboarding-eyebrow">InkVerse Creator Program</span>
        <h1>Become an Author on InkVerse</h1>
        <p>
          Build your audience by publishing stories, chapters, and series directly to your
          readers. Your author dashboard helps you manage content and track performance.
        </p>

        <div className="author-onboarding-grid">
          <article className="author-onboarding-box">
            <h3>What you can do</h3>
            <ul>
              <li>Create and publish books</li>
              <li>Manage chapters and updates</li>
              <li>Build your public author profile</li>
            </ul>
          </article>

          <article className="author-onboarding-box">
            <h3>How you can earn</h3>
            <ul>
              <li>Grow a recurring reader base</li>
              <li>Participate in platform monetization programs</li>
              <li>Unlock future income tools as they launch</li>
            </ul>
          </article>
        </div>

        <button
          type="button"
          className="author-onboarding-btn"
          onClick={isLoggedIn ? onBecomeAuthor : onOpenLogin}
        >
          Become Author
        </button>
      </div>
    </section>
  );
}

export default function AuthorLayout() {
  const { auth, setAuth, openLogin } = useContext(AuthContext);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isLoggedIn = !!auth?.accessToken;
  const roles = useMemo(
    () => auth?.user?.roles ?? auth?.user?.Roles ?? [],
    [auth?.user?.roles, auth?.user?.Roles],
  );

  const isAuthor = Array.isArray(roles)
    ? roles.includes("Author") || roles.includes("Admin")
    : roles === "Author" || roles === "Admin";

  const openTerms = () => {
    setError("");
    setTermsAccepted(false);
    setIsTermsOpen(true);
  };

  const closeTerms = () => {
    if (submitting) return;
    setIsTermsOpen(false);
  };

  const handleBecomeAuthor = async () => {
    if (!termsAccepted || submitting) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await api.post("/author/onboarding/accept");
      const dto = res.data;

      setAuth((prev) => ({
        ...prev,
        accessToken: dto?.token ?? prev?.accessToken,
        user: {
          ...(prev?.user || {}),
          userName: dto?.userName ?? prev?.user?.userName,
          email: dto?.email ?? prev?.user?.email,
          roles: dto?.roles ?? prev?.user?.roles ?? [],
        },
      }));

      setIsTermsOpen(false);
      setTermsAccepted(false);
    } catch (e) {
      setError(e?.response?.data?.message || "Could not upgrade your account right now.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthor) {
    return (
      <>
        <AuthorOnboarding
          isLoggedIn={isLoggedIn}
          onOpenLogin={openLogin}
          onBecomeAuthor={openTerms}
        />

        {isTermsOpen && (
          <div className="author-terms-backdrop" onClick={closeTerms}>
            <div className="author-terms-modal" onClick={(e) => e.stopPropagation()}>
              <h2>Author Terms and Contract</h2>
              <p>
                This is a temporary contract placeholder. You will replace this with the
                final legal terms later.
              </p>

              <ul>
                <li>You confirm content ownership and publishing rights.</li>
                <li>You agree to platform quality and community standards.</li>
                <li>You accept monetization and payout policy updates when released.</li>
              </ul>

              <label className="author-terms-check">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                />
                <span>I agree to the author terms and contract.</span>
              </label>

              {error && <div className="author-terms-error">{error}</div>}

              <div className="author-terms-actions">
                <button type="button" className="btn btn-light" onClick={closeTerms}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={!termsAccepted || submitting}
                  onClick={handleBecomeAuthor}
                >
                  {submitting ? "Please wait..." : "Continue"}
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="author-layout">
      <div className="author-content-wrap">
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

        <main className="author-main">
          <Outlet />
        </main>
      </div>

      <nav className="author-bottom-nav">
        {menuItems.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}
      </nav>
    </div>
  );
}