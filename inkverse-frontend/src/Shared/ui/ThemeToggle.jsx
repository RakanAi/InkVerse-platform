import { useTranslation } from "react-i18next";
import { useTheme } from "../../Context/ThemeProvider";

function ThemeToggle({ className = "", showLabel = true }) {
  const { isDark, toggleTheme } = useTheme();
  const { t } = useTranslation();

  const nextLabel = isDark
    ? t("common.theme.switchToLight")
    : t("common.theme.switchToDark");

  return (
    <button
      type="button"
      className={className}
      onClick={toggleTheme}
      aria-label={nextLabel}
      title={nextLabel}
    >
      <i
        className={`bi ${isDark ? "bi-sun-fill" : "bi-moon-stars-fill"}`}
        aria-hidden="true"
      />
      {showLabel ? <span>{nextLabel}</span> : null}
    </button>
  );
}

export default ThemeToggle;
