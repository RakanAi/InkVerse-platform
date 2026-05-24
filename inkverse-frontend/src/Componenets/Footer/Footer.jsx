import "./Footer.css";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import inkVerseIcon from "../../assets/te.png";

const EXPLORE_LINKS = [
  { to: "/", icon: "bi-house-door", labelKey: "footer.links.home" },
  { to: "/browser", icon: "bi-search", labelKey: "footer.links.browse" },
  { to: "/ranking", icon: "bi-trophy", labelKey: "footer.links.rankings" },
  { to: "/trend", icon: "bi-stars", labelKey: "footer.links.trends" },
];

const SUPPORT_LINKS = [
  { to: "/about", icon: "bi-info-circle", labelKey: "footer.links.about" },
  { to: "/contact", icon: "bi-envelope", labelKey: "footer.links.contact" },
  { to: "/privacy", icon: "bi-shield-check", labelKey: "footer.links.privacy" },
  { to: "/dmca", icon: "bi-file-earmark-text", labelKey: "footer.links.dmca" },
];

export default function Footer() {
  const { t } = useTranslation();
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
                  <span className="iv-footer-kicker">{t("common.brandKicker")}</span>
                  <span className="iv-footer-name">{t("common.appName")}</span>
                </div>
              </div>

              <p className="iv-footer-summary">
                {t("footer.summary")}
              </p>

              <div className="iv-footer-socials">
                <a
                  className="iv-footer-social"
                  href="mailto:InkVerseOdeh@gmail.com"
                  aria-label={t("footer.social.email")}
                >
                  <i className="bi bi-envelope" />
                </a>
                <Link
                  className="iv-footer-social"
                  to="/contact"
                  aria-label={t("footer.social.contact")}
                >
                  <i className="bi bi-chat-dots" />
                </Link>
                <Link
                  className="iv-footer-social"
                  to="/about"
                  aria-label={t("footer.social.about")}
                >
                  <i className="bi bi-info-circle" />
                </Link>
              </div>
            </div>

            <div className="iv-footer-linksBlock">
              <div className="iv-footer-linkGroup">
                <h3 className="iv-footer-title">{t("footer.groups.explore")}</h3>
                <ul className="iv-footer-list">
                  {EXPLORE_LINKS.map((item) => (
                    <li key={item.to}>
                      <Link className="iv-footer-link" to={item.to}>
                        <i className={`bi ${item.icon}`} />
                        <span>{t(item.labelKey)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="iv-footer-linkGroup">
                <h3 className="iv-footer-title">{t("footer.groups.support")}</h3>
                <ul className="iv-footer-list">
                  {SUPPORT_LINKS.map((item) => (
                    <li key={item.to}>
                      <Link className="iv-footer-link" to={item.to}>
                        <i className={`bi ${item.icon}`} />
                        <span>{t(item.labelKey)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="iv-footer-updateCard">
              <p className="iv-footer-cardKicker">{t("footer.card.kicker")}</p>
              <h3 className="iv-footer-cardTitle">{t("footer.card.title")}</h3>
              <p className="iv-footer-cardText">
                {t("footer.card.text")}
              </p>

              <div className="iv-footer-actions">
                <Link className="iv-footer-pill iv-footer-pill--primary" to="/browser">
                  {t("footer.card.browse")}
                </Link>
                <a
                  className="iv-footer-pill iv-footer-pill--ghost"
                  href="mailto:InkVerseOdeh@gmail.com"
                >
                  {t("footer.card.email")}
                </a>
              </div>

              <div className="iv-footer-note">
                <span className="iv-footer-badge">{t("footer.card.badge")}</span>
                <span>{t("footer.card.note")}</span>
              </div>
            </div>
          </div>

          <div className="iv-footer-bottom">
            <p className="iv-footer-meta">{t("footer.bottom.rights", { year })}</p>
            <p className="iv-footer-meta">{t("footer.bottom.tagline")}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
