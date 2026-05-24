import { Link, NavLink, Outlet } from "react-router-dom";
import { useContext, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FiChevronRight,
  FiGlobe,
  FiHelpCircle,
  FiHome,
  FiLogOut,
  FiMoon,
  FiSettings,
  FiSun,
  FiUser,
} from "react-icons/fi";
import logo from "../../assets/IncVerseLogo.png";
import authorVisual from "../../assets/pics/AlbedoBase_XL_A_highly_detailed_and_ethereal_fantasy_female_ch_1.jpg";
import AuthContext from "../../Context/AuthProvider";
import { useTheme } from "../../Context/ThemeProvider";
import api from "../../Api/api";
import Button from "../../Shared/ui/Button";
import UserAvatar from "../../Shared/user/UserAvatar";
import { getAuthorStudioRoutes } from "../../features/author/author.routes";
import { useSiteVisualAssetView } from "../../features/site-visuals/useSiteVisualAsset";
import { getLanguageOptions, normalizeLanguageCode, setAppLanguage } from "../../i18n";
import "./Author.css";
import "./AuthorStudio.css";

function NavItem({ to, end, label, description, icon }) {
  const RouteIcon = icon;

  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) => `author-studio-nav-link ${isActive ? "active" : ""}`}
    >
      <span className="author-studio-nav-link__icon">
        <RouteIcon size={18} strokeWidth={2} />
      </span>
      <span className="author-studio-nav-link__copy">
        <strong>{label}</strong>
        <small>{description}</small>
      </span>
    </NavLink>
  );
}

function getSidebarUserLabel(user, fallback = "Profile") {
  return (
    user?.displayName ||
    user?.DisplayName ||
    user?.userName ||
    user?.UserName ||
    user?.email ||
    user?.Email ||
    fallback
  );
}

function getSidebarAvatar(user) {
  return user?.avatarUrl || user?.AvatarUrl || user?.profileImageUrl || user?.ProfileImageUrl || "";
}

function SidebarFooter({ user, onSignOut }) {
  const { t, i18n } = useTranslation();
  const { isDark, toggleTheme } = useTheme();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const label = getSidebarUserLabel(user, t("author.studio.common.profile"));
  const avatar = getSidebarAvatar(user);
  const languageOptions = useMemo(() => getLanguageOptions(t), [t]);
  const currentLanguage = normalizeLanguageCode(i18n.resolvedLanguage || i18n.language);
  const currentLanguageLabel =
    languageOptions.find((option) => option.value === currentLanguage)?.shortLabel ??
    currentLanguage.toUpperCase();

  const closeProfileMenuOnBlur = (event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setIsProfileMenuOpen(false);
    }
  };

  return (
    <div className="author-studio-sidebar__bottom">
      <div
        className={`author-studio-profile-menu-wrap ${isProfileMenuOpen ? "is-open" : ""}`}
        onMouseEnter={() => setIsProfileMenuOpen(true)}
        onMouseLeave={() => setIsProfileMenuOpen(false)}
        onFocus={() => setIsProfileMenuOpen(true)}
        onBlur={closeProfileMenuOnBlur}
      >
        <button
          type="button"
          className="author-studio-sidebar-action author-studio-profile-trigger"
          aria-haspopup="menu"
          aria-expanded={isProfileMenuOpen}
          onClick={() => setIsProfileMenuOpen((open) => !open)}
        >
          <span className="author-studio-sidebar-action__icon author-studio-sidebar-action__avatar">
            <UserAvatar
              className="author-studio-sidebar-action__avatarImage"
              name={label}
              src={avatar}
              alt={label}
            />
          </span>
          <span className="author-studio-sidebar-action__label">{label}</span>
          <FiChevronRight className="author-studio-sidebar-action__chevron" size={18} />
        </button>

        <div className="author-studio-profile-menu" role="menu">
          <div className="author-studio-profile-menu__name">{label}</div>

          <label className="author-studio-profile-menu__item author-studio-profile-menu__item--language">
            <FiGlobe size={16} />
            <span>{t("author.studio.common.language")}</span>
            <strong>{currentLanguageLabel}</strong>
            <select
              aria-label={t("author.studio.common.language")}
              value={currentLanguage}
              onChange={(event) => setAppLanguage(event.target.value)}
            >
              {languageOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <button type="button" className="author-studio-profile-menu__item" onClick={toggleTheme}>
            {isDark ? <FiSun size={16} /> : <FiMoon size={16} />}
            <span>
              {isDark
                ? t("author.studio.common.lightTheme")
                : t("author.studio.common.darkTheme")}
            </span>
          </button>

          <Link to="/profilePage" className="author-studio-profile-menu__item" role="menuitem">
            <FiSettings size={16} />
            <span>{t("author.studio.common.setting")}</span>
          </Link>

          <button
            type="button"
            className="author-studio-profile-menu__item"
            onClick={() => {
              setIsProfileMenuOpen(false);
              onSignOut();
            }}
          >
            <FiLogOut size={16} />
            <span>{t("author.studio.common.signOut")}</span>
          </button>
        </div>
      </div>

      <button type="button" className="author-studio-sidebar-action" disabled>
        <span className="author-studio-sidebar-action__icon">
          <FiHelpCircle size={18} />
        </span>
        <span className="author-studio-sidebar-action__label">{t("author.studio.common.assistance")}</span>
        <FiChevronRight className="author-studio-sidebar-action__chevron" size={18} />
      </button>

      <Link to="/" className="author-studio-sidebar-action author-studio-sidebar-action--home">
        <span className="author-studio-sidebar-action__icon">
          <FiHome size={18} />
        </span>
        <span className="author-studio-sidebar-action__label">{t("author.studio.common.backHome")}</span>
      </Link>
    </div>
  );
}

function AuthorOnboarding({ isLoggedIn, onOpenLogin, onBecomeAuthor }) {
  const { t } = useTranslation();
  const onboardingVisual = useSiteVisualAssetView("author.onboarding", authorVisual);

  return (
    <section className="author-studio-onboarding">
      <div className="author-studio-onboarding__hero">
        <div className="author-studio-onboarding__copy">
          <span className="author-studio-eyebrow">{t("author.studio.onboarding.eyebrow")}</span>
          <h1>{t("author.studio.onboarding.title")}</h1>
          <p>{t("author.studio.onboarding.text")}</p>
          <div className="author-studio-onboarding__actions">
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={isLoggedIn ? onBecomeAuthor : onOpenLogin}
            >
              {isLoggedIn
                ? t("author.studio.onboarding.becomeAuthor")
                : t("author.studio.onboarding.signInBecomeAuthor")}
            </Button>
            {!isLoggedIn ? (
              <Button type="button" variant="outline" size="md" onClick={onOpenLogin}>
                {t("author.studio.onboarding.previewFlow")}
              </Button>
            ) : null}
          </div>
        </div>

        <div className="author-studio-onboarding__visual">
          <div className="author-studio-onboarding__floating author-studio-onboarding__floating--workspace">
            <span className="author-studio-onboarding__floating-label">{t("author.studio.onboarding.workspaceLabel")}</span>
            <strong>{t("author.studio.onboarding.workspaceText")}</strong>
          </div>

          <div className="author-studio-onboarding__floating author-studio-onboarding__floating--performance">
            <span className="author-studio-onboarding__floating-label">{t("author.studio.onboarding.readerPulseLabel")}</span>
            <strong>{t("author.studio.onboarding.readerPulseText")}</strong>
          </div>

          <div className="author-studio-onboarding__art-shell">
            <div className="author-studio-onboarding__art-ring author-studio-onboarding__art-ring--one" />
            <div className="author-studio-onboarding__art-ring author-studio-onboarding__art-ring--two" />
            <div className="author-studio-onboarding__art-card">
              <img
                src={onboardingVisual.src}
                alt={t("author.studio.onboarding.visualAlt")}
                className="author-studio-onboarding__art-image"
                style={onboardingVisual.style}
              />
            </div>
          </div>

          <div className="author-studio-onboarding__floating author-studio-onboarding__floating--publishing">
            <span className="author-studio-onboarding__floating-label">{t("author.studio.onboarding.publishingLabel")}</span>
            <strong>{t("author.studio.onboarding.publishingText")}</strong>
          </div>

          <div className="author-studio-onboarding__floating author-studio-onboarding__floating--identity">
            <span className="author-studio-onboarding__floating-label">{t("author.studio.onboarding.identityLabel")}</span>
            <strong>{t("author.studio.onboarding.identityText")}</strong>
          </div>
        </div>
      </div>
    </section>
  );
}

function AuthorTermsModal({
  submitting,
  termsAccepted,
  error,
  onClose,
  onToggleAccepted,
  onSubmit,
}) {
  const { t } = useTranslation();

  return (
    <div className="author-studio-modal-backdrop" onClick={onClose}>
      <div className="author-studio-modal" onClick={(event) => event.stopPropagation()}>
        <div className="author-studio-modal__header">
          <span className="author-studio-eyebrow">{t("author.studio.terms.eyebrow")}</span>
          <h2>{t("author.studio.terms.title")}</h2>
          <p>{t("author.studio.terms.text")}</p>
          <div className="author-studio-modal__chips">
            <span>{t("author.studio.terms.chips.step")}</span>
            <span>{t("author.studio.terms.chips.setup")}</span>
            <span>{t("author.studio.terms.chips.instant")}</span>
          </div>
        </div>

        <div className="author-studio-modal__list">
          <article>
            <strong>{t("author.studio.terms.ownershipTitle")}</strong>
            <span>{t("author.studio.terms.ownershipText")}</span>
          </article>
          <article>
            <strong>{t("author.studio.terms.standardsTitle")}</strong>
            <span>{t("author.studio.terms.standardsText")}</span>
          </article>
          <article>
            <strong>{t("author.studio.terms.monetizationTitle")}</strong>
            <span>{t("author.studio.terms.monetizationText")}</span>
          </article>
        </div>

        <label className="author-studio-modal__check">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(event) => onToggleAccepted(event.target.checked)}
          />
          <span>{t("author.studio.terms.agree")}</span>
        </label>

        {error ? <div className="author-studio-modal__error">{error}</div> : null}

        <div className="author-studio-modal__actions">
          <Button type="button" variant="outline" size="md" onClick={onClose}>
            {t("author.studio.common.cancel")}
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            disabled={!termsAccepted || submitting}
            onClick={onSubmit}
          >
            {submitting ? t("author.studio.terms.submitting") : t("author.studio.terms.submit")}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AuthorLayout() {
  const { auth, setAuth, openLogin } = useContext(AuthContext);
  const { t } = useTranslation();
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
  const authorStudioRoutes = useMemo(() => getAuthorStudioRoutes(t), [t]);

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
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          t("author.studio.terms.upgradeError"),
      );
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

        {isTermsOpen ? (
          <AuthorTermsModal
            submitting={submitting}
            termsAccepted={termsAccepted}
            error={error}
            onClose={closeTerms}
            onToggleAccepted={setTermsAccepted}
            onSubmit={handleBecomeAuthor}
          />
        ) : null}
      </>
    );
  }

  return (
    <div className="author-studio-shell">
      <div className="author-studio-shell__grid">
        <aside className="author-studio-shell__sidebar">
          <div className="author-studio-sidebar">
            <div className="author-studio-sidebar__brand">
              <img src={logo} alt="InkVerse" className="author-studio-sidebar__logo" />
              <div>
                <span className="author-studio-eyebrow">{t("author.studio.common.authorStudio")}</span>
                <strong>{t("common.appName")}</strong>
                <small>{t("author.studio.common.sidebarTagline")}</small>
              </div>
            </div>

            <nav className="author-studio-nav" aria-label={t("author.studio.common.authorStudio")}>
              {authorStudioRoutes.map((item) => (
                <NavItem key={item.to} {...item} />
              ))}
            </nav>

            <SidebarFooter user={auth?.user} onSignOut={() => setAuth(null)} />
          </div>
        </aside>

        <main className="author-studio-shell__main">
          <div className="author-studio-shell__frame">
            <Outlet />
          </div>
        </main>
      </div>

      <nav className="author-studio-mobile-nav" aria-label={t("author.studio.common.authorStudio")}>
        {authorStudioRoutes.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}
      </nav>
    </div>
  );
}
