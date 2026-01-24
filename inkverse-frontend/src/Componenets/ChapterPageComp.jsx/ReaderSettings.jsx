import { useMemo } from "react";

const DEFAULTS = {
  fontSize: 18,
  lineHeight: 1.85,
  font: "system",
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
  const prefs = value ?? DEFAULTS;

  const fonts = useMemo(
    () => [
      { value: "system", label: "System" },
      { value: "serif", label: "Serif" },
      { value: "sans", label: "Sans" },
      { value: "mono", label: "Mono" },
    ],
    []
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
          Reader settings
        </h5>
        <button
          type="button"
          className="btn-close"
          data-bs-dismiss="offcanvas"
          aria-label="Close"
        />
      </div>

      <div className="offcanvas-body">
        <div className="d-flex flex-column gap-3">
          <div>
            <div className="d-flex justify-content-between">
              <span className="fw-semibold">Text size</span>
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
              <span className="fw-semibold">Line spacing</span>
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
            <div className="fw-semibold mb-1">Font</div>
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

          <button
            className="btn btn-outline-secondary"
            type="button"
            onClick={() => onChange?.(DEFAULTS)}
          >
            Reset to default
          </button>
        </div>
      </div>
    </div>
  );
}
