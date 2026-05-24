import { useMemo } from "react";
import { useTranslation } from "react-i18next";

export const DEFAULTS = {
  fontSize: 18,
  lineHeight: 1.85,
  font: "system",
  backgroundTheme: "mist",
};

export function loadReaderPrefs(key = "iv_reader_prefs") {
  try {
    const raw = localStorage.getItem(key);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

export function saveReaderPrefs(prefs, key = "iv_reader_prefs") {
  try {
    localStorage.setItem(key, JSON.stringify(prefs));
  } catch (e) {
    console.error("Failed to save reader prefs:", e);
  }
}

export default function ReaderSettings({
  value,
  onChange,
  offcanvasId = "settingsSheet",
}) {
  const { t } = useTranslation();
  const prefs = value ?? DEFAULTS;

  const fonts = useMemo(
    () => [
      { value: "system", label: t("reader.settings.fonts.system") },
      { value: "serif", label: t("reader.settings.fonts.serif") },
      { value: "sans", label: t("reader.settings.fonts.sans") },
      { value: "mono", label: t("reader.settings.fonts.mono") },
    ],
    [t]
  );

  const themes = useMemo(
    () => [
      { value: "mist", label: t("reader.settings.backgrounds.mist") },
      { value: "paper", label: t("reader.settings.backgrounds.paper") },
    ],
    [t]
  );

  const set = (patch) => onChange?.({ ...prefs, ...patch });

  return (
    <div
      className="offcanvas offcanvas-bottom iv-sheet"
      tabIndex="-1"
      id={offcanvasId}
      aria-labelledby={`${offcanvasId}Label`}
    >
      <div className="offcanvas-header">
        <h5 className="offcanvas-title" id={`${offcanvasId}Label`}>
          {t("reader.settings.title")}
        </h5>
        <button
          type="button"
          className="btn-close"
          data-bs-dismiss="offcanvas"
          aria-label={t("common.actions.close")}
        />
      </div>

      <div className="offcanvas-body">
        <div className="d-flex flex-column gap-3">
          <div>
            <div className="d-flex justify-content-between">
              <span className="fw-semibold">{t("reader.settings.textSize")}</span>
              <span className="text-muted">{prefs.fontSize}px</span>
            </div>
            <input
              className="form-range"
              type="range"
              min="14"
              max="28"
              value={prefs.fontSize}
              onChange={(e) => set({ fontSize: Number(e.target.value) })}
            />
          </div>

          <div>
            <div className="d-flex justify-content-between">
              <span className="fw-semibold">{t("reader.settings.lineSpacing")}</span>
              <span className="text-muted">{prefs.lineHeight.toFixed(2)}</span>
            </div>
            <input
              className="form-range"
              type="range"
              min="1.4"
              max="2.4"
              step="0.05"
              value={prefs.lineHeight}
              onChange={(e) => set({ lineHeight: Number(e.target.value) })}
            />
          </div>

          <div>
            <div className="fw-semibold mb-1">{t("reader.settings.font")}</div>
            <select
              className="form-select"
              value={prefs.font}
              onChange={(e) => set({ font: e.target.value })}
            >
              {fonts.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="fw-semibold mb-1">{t("reader.settings.background")}</div>
            <select
              className="form-select"
              value={prefs.backgroundTheme}
              onChange={(e) => set({ backgroundTheme: e.target.value })}
            >
              {themes.map((theme) => (
                <option key={theme.value} value={theme.value}>
                  {theme.label}
                </option>
              ))}
            </select>
          </div>

          <button
            className="btn btn-outline-secondary"
            type="button"
            onClick={() => onChange?.(DEFAULTS)}
          >
            {t("reader.settings.reset")}
          </button>
        </div>
      </div>
    </div>
  );
}
