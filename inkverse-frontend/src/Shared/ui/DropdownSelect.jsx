import React, { useEffect, useMemo, useRef, useState } from "react";

export default function DropdownSelect({
  value,
  onChange,
  options = [],
  renderLabel,
  placeholder = "Select…",
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  const selected = useMemo(
    () => options.find((o) => o.value === value),
    [options, value]
  );

  const buttonText = selected
    ? (renderLabel ? renderLabel(selected) : selected.label)
    : placeholder;

  useEffect(() => {
    const onDoc = (e) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
  <div ref={rootRef} className={`iv-dd ${open ? "is-open" : ""} ${className}`}>
    <button
      type="button"
      className="iv-dd-btn"
      onClick={() => setOpen((x) => !x)}
    >
      <span className="iv-dd-text">{buttonText}</span>
      <span className="iv-dd-arrow">▾</span>
    </button>

    {/* keep it mounted so CSS can animate */}
    <div className={`iv-dd-menu ${open ? "is-open" : ""}`} aria-hidden={!open}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            className={`iv-dd-item ${active ? "is-active" : ""}`}
            onClick={() => {
              onChange?.(o.value);
              setOpen(false);
            }}
            tabIndex={open ? 0 : -1}
          >
            {renderLabel ? renderLabel(o) : o.label}
          </button>
        );
      })}
    </div>
  </div>
);
}