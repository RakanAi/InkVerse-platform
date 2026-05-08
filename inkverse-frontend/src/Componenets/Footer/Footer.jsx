import "./Footer.css";
import { Link } from "react-router-dom";
import inkVerseIcon from "../../assets/te.png";

const EXPLORE_LINKS = [
  { to: "/", icon: "bi-house-door", label: "Home" },
  { to: "/browser", icon: "bi-search", label: "Browse" },
  { to: "/ranking", icon: "bi-trophy", label: "Rankings" },
  { to: "/trend", icon: "bi-stars", label: "Trends" },
];

const SUPPORT_LINKS = [
  { to: "/about", icon: "bi-info-circle", label: "About" },
  { to: "/contact", icon: "bi-envelope", label: "Contact" },
  { to: "/privacy", icon: "bi-shield-check", label: "Privacy" },
  { to: "/dmca", icon: "bi-file-earmark-text", label: "DMCA" },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="iv-footer">
      <div className="iv-footer-shell">
        <div className="iv-footer-frame">
          <div className="iv-footer-top">
            <div className="iv-footer-brandBlock">
              <div className="iv-footer-brand">
                <span className="iv-footer-brandMark">
                  <img
                    src={inkVerseIcon}
                    alt="InkVerse"
                    className="iv-footer-logo"
                  />
                </span>
                <div className="iv-footer-brandCopy">
                  <span className="iv-footer-kicker">Read. Write. Wander.</span>
                  <span className="iv-footer-name">InkVerse</span>
                </div>
              </div>

              <p className="iv-footer-summary">
                A reading multiverse for original stories, wild fanfiction, and
                the people who love getting lost in both.
              </p>

              <div className="iv-footer-socials">
                <a
                  className="iv-footer-social"
                  href="mailto:InkVerseOdeh@gmail.com"
                  aria-label="Email InkVerse"
                >
                  <i className="bi bi-envelope" />
                </a>
                <Link
                  className="iv-footer-social"
                  to="/contact"
                  aria-label="Contact page"
                >
                  <i className="bi bi-chat-dots" />
                </Link>
                <Link
                  className="iv-footer-social"
                  to="/about"
                  aria-label="About InkVerse"
                >
                  <i className="bi bi-info-circle" />
                </Link>
              </div>
            </div>

            <div className="iv-footer-linksBlock">
              <div className="iv-footer-linkGroup">
                <h3 className="iv-footer-title">Explore</h3>
                <ul className="iv-footer-list">
                  {EXPLORE_LINKS.map((item) => (
                    <li key={item.to}>
                      <Link className="iv-footer-link" to={item.to}>
                        <i className={`bi ${item.icon}`} />
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="iv-footer-linkGroup">
                <h3 className="iv-footer-title">Support</h3>
                <ul className="iv-footer-list">
                  {SUPPORT_LINKS.map((item) => (
                    <li key={item.to}>
                      <Link className="iv-footer-link" to={item.to}>
                        <i className={`bi ${item.icon}`} />
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="iv-footer-updateCard">
              <p className="iv-footer-cardKicker">Now Live</p>
              <h3 className="iv-footer-cardTitle">InkVerse demo is open.</h3>
              <p className="iv-footer-cardText">
                Browse live books, test ranking and moderation flows, and keep
                an eye out for the upcoming author experience.
              </p>

              <div className="iv-footer-actions">
                <Link className="iv-footer-pill iv-footer-pill--primary" to="/browser">
                  Start browsing
                </Link>
                <a
                  className="iv-footer-pill iv-footer-pill--ghost"
                  href="mailto:InkVerseOdeh@gmail.com"
                >
                  Email us
                </a>
              </div>

              <div className="iv-footer-note">
                <span className="iv-footer-badge">v1.0 Demo</span>
                <span>Author tools, profiles, and more are on the roadmap.</span>
              </div>
            </div>
          </div>

          <div className="iv-footer-bottom">
            <p className="iv-footer-meta">© {year} InkVerse. All rights reserved.</p>
            <p className="iv-footer-meta">Built for readers who stay one chapter too long.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
